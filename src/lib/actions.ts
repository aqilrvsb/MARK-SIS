"use server";

import { createClient, createServiceClient } from "./supabase-server";
import { redirect } from "next/navigation";
import { UserProfile } from "./types";

// ============================================
// STAFF ID GENERATION
// ============================================

function generatePrefix(companyName: string, existingPrefixes: string[]): string {
  const clean = companyName.toUpperCase().replace(/[^A-Z]/g, "");
  if (clean.length < 2) return "XX";

  // Try first 2 chars
  let prefix = clean.substring(0, 2);
  if (!existingPrefixes.includes(prefix)) return prefix;

  // Try first + last char
  prefix = clean[0] + clean[clean.length - 1];
  if (!existingPrefixes.includes(prefix)) return prefix;

  // Try first + each other char
  for (let i = 2; i < clean.length; i++) {
    prefix = clean[0] + clean[i];
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  // Fallback: first char + random letter
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const letter of alphabet) {
    prefix = clean[0] + letter;
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  return clean.substring(0, 2) + Math.floor(Math.random() * 10);
}

async function generateStaffId(
  admin: ReturnType<typeof createServiceClient>,
  companyId: string,
  prefix: string,
  role: string
): Promise<string> {
  const roleChar = role === "bod" ? "B" : role === "leader" ? "L" : "M";

  // Count existing users with this role in company
  const { count } = await admin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .like("id_staff", `${prefix}${roleChar}-%`);

  const num = (count || 0) + 1;
  return `${prefix}${roleChar}-${String(num).padStart(3, "0")}`;
}

// ============================================
// AUTH ACTIONS
// ============================================

export async function registerCompany(formData: FormData) {
  const supabase = await createClient();
  const admin = createServiceClient();

  const companyName = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!companyName || !email || !password) {
    return { error: "All fields are required" };
  }

  // 1. Generate unique prefix
  const { data: existingCompanies } = await admin
    .from("companies")
    .select("prefix")
    .not("prefix", "is", null);

  const existingPrefixes = (existingCompanies || []).map((c: { prefix: string }) => c.prefix);
  const prefix = generatePrefix(companyName, existingPrefixes);

  // 2. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: companyName } },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Failed to create user" };

  // 3. Create company with prefix
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName, prefix })
    .select()
    .single();

  if (companyError) return { error: companyError.message };

  // 4. Create BOD user with staff ID
  const staffId = `${prefix}B-001`;
  const { error: profileError } = await admin.from("users").insert({
    id: authData.user.id,
    company_id: company.id,
    email,
    full_name: companyName,
    role: "bod",
    id_staff: staffId,
  });

  if (profileError) return { error: profileError.message };

  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ============================================
// USER ACTIONS
// ============================================

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function createTeamMember(formData: FormData) {
  const admin = createServiceClient();

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Not authenticated" };

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const leaderId = (formData.get("leader_id") as string) || null;

  if (!fullName || !email || !password || !role) {
    return { error: "All fields are required" };
  }

  if (currentUser.role === "leader" && role !== "marketer") {
    return { error: "Leaders can only create marketers" };
  }
  if (currentUser.role === "marketer") {
    return { error: "Marketers cannot create users" };
  }

  // Get company prefix
  const { data: company } = await admin
    .from("companies")
    .select("prefix")
    .eq("id", currentUser.company_id)
    .single();

  if (!company?.prefix) return { error: "Company prefix not found" };

  // Generate staff ID
  const staffId = await generateStaffId(admin, currentUser.company_id, company.prefix, role);

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) return { error: authError.message };

  // Create profile with staff ID
  const { error: profileError } = await admin.from("users").insert({
    id: authData.user.id,
    company_id: currentUser.company_id,
    email,
    full_name: fullName,
    role,
    id_staff: staffId,
    leader_id: role === "marketer" ? (leaderId || currentUser.id) : null,
  });

  if (profileError) return { error: profileError.message };

  return { success: true, staffId };
}

export async function updateTeamMember(userId: string, formData: FormData) {
  const admin = createServiceClient();

  const fullName = formData.get("full_name") as string;
  const isActive = formData.get("is_active") === "true";
  const leaderId = (formData.get("leader_id") as string) || null;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fullName) updates.full_name = fullName;
  if (formData.has("is_active")) updates.is_active = isActive;
  if (formData.has("leader_id")) updates.leader_id = leaderId || null;

  const { error } = await admin.from("users").update(updates).eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteTeamMember(userId: string) {
  const admin = createServiceClient();

  const { error: profileError } = await admin.from("users").delete().eq("id", userId);
  if (profileError) return { error: profileError.message };

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { error: authError.message };

  return { success: true };
}

// ============================================
// TEAM DATA
// ============================================

export async function getTeamMembers() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  let query = supabase.from("users").select("*").eq("company_id", currentUser.company_id);

  if (currentUser.role === "leader") {
    query = supabase
      .from("users")
      .select("*")
      .eq("company_id", currentUser.company_id)
      .or(`id.eq.${currentUser.id},leader_id.eq.${currentUser.id}`);
  }

  const { data } = await query.order("role").order("full_name");
  return data || [];
}

export async function getLeaders() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", currentUser.company_id)
    .eq("role", "leader")
    .order("full_name");

  return data || [];
}
