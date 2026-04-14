import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReportsClient from "./client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const admin = createServiceClient();

  // Fetch all data in parallel
  const [adDataRes, selectedColsRes, customColsRes, teamRes, fbColsRes] = await Promise.all([
    admin.from("ad_data").select("data, marketer_id").eq("company_id", user.company_id).limit(1000),
    admin.from("company_column_views").select("column_order").eq("company_id", user.company_id).eq("is_default", true).maybeSingle(),
    admin.from("custom_columns").select("*").eq("company_id", user.company_id).eq("is_active", true),
    admin.from("users").select("id, full_name, role, id_staff, leader_id").eq("company_id", user.company_id),
    admin.from("fb_columns").select("key, label").limit(300),
  ]);

  return (
    <ReportsClient
      adData={adDataRes.data || []}
      selectedColumns={(selectedColsRes.data?.column_order as string[]) || []}
      customColumns={customColsRes.data || []}
      teamMembers={teamRes.data || []}
      fbColumns={fbColsRes.data || []}
      currentUser={user}
      defaultTab={params.tab || "all"}
    />
  );
}
