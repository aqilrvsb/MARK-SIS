"use server";

import { createClient, createServiceClient } from "./supabase-server";
import { redirect } from "next/navigation";
import { UserProfile } from "./types";

// ============================================
// AUTH ACTIONS
// ============================================

export async function registerCompany(formData: FormData) {
  const supabase = await createClient();
  const admin = createServiceClient();

  const companyName = formData.get("company_name") as string;
  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!companyName || !fullName || !email || !password) {
    return { error: "All fields are required" };
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Failed to create user" };

  // 2. Create company (using service role to bypass RLS)
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName })
    .select()
    .single();

  if (companyError) return { error: companyError.message };

  // 3. Create user profile as BOD
  const { error: profileError } = await admin.from("users").insert({
    id: authData.user.id,
    company_id: company.id,
    email,
    full_name: fullName,
    role: "bod",
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
  const supabase = await createClient();
  const admin = createServiceClient();

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Not authenticated" };

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const leaderId = formData.get("leader_id") as string || null;

  if (!fullName || !email || !password || !role) {
    return { error: "All fields are required" };
  }

  // BOD can create leaders and marketers
  // Leaders can only create marketers under themselves
  if (currentUser.role === "leader" && role !== "marketer") {
    return { error: "Leaders can only create marketers" };
  }
  if (currentUser.role === "marketer") {
    return { error: "Marketers cannot create users" };
  }

  // Create auth user via service role
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) return { error: authError.message };

  // Create profile
  const { error: profileError } = await admin.from("users").insert({
    id: authData.user.id,
    company_id: currentUser.company_id,
    email,
    full_name: fullName,
    role,
    leader_id: role === "marketer" ? (leaderId || currentUser.id) : null,
  });

  if (profileError) return { error: profileError.message };

  return { success: true };
}

export async function updateTeamMember(userId: string, formData: FormData) {
  const admin = createServiceClient();

  const fullName = formData.get("full_name") as string;
  const isActive = formData.get("is_active") === "true";
  const leaderId = formData.get("leader_id") as string || null;

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

  // Delete profile first, then auth user
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
    // Leaders see themselves + their marketers
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
