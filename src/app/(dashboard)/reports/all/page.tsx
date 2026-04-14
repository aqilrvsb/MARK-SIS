import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReportView from "@/components/report-view";

export default async function ReportAllPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();
  const [adRes, colRes, customRes, teamRes, fbRes] = await Promise.all([
    admin.from("ad_data").select("data, marketer_id, date_start, date_end").eq("company_id", user.company_id).limit(1000),
    admin.from("company_column_views").select("column_order").eq("company_id", user.company_id).eq("is_default", true).maybeSingle(),
    admin.from("custom_columns").select("key, label, formula, is_active").eq("company_id", user.company_id),
    admin.from("users").select("id, full_name, role, id_staff, leader_id").eq("company_id", user.company_id),
    admin.from("fb_columns").select("key, label").limit(300),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Report All</h1>
      <ReportView
        adData={adRes.data || []}
        selectedColumns={(colRes.data?.column_order as string[]) || []}
        customColumns={customRes.data || []}
        fbColumns={fbRes.data || []}
        teamMembers={teamRes.data || []}
        groupBy="none"
      />
    </div>
  );
}
