import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReportView from "@/components/report-view";
import PageCharts from "@/components/page-charts";
import { filterByRole } from "@/lib/filter-by-role";

export default async function ReportLeaderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();
  const [adRes, colRes, customRes, teamRes, fbRes, chartConfigRes] = await Promise.all([
    admin.from("ad_data").select("data, marketer_id, date_start, date_end").eq("company_id", user.company_id).limit(1000),
    admin.from("company_column_views").select("column_order").eq("company_id", user.company_id).eq("is_default", true).maybeSingle(),
    admin.from("custom_columns").select("key, label, formula, is_active").eq("company_id", user.company_id),
    admin.from("users").select("id, full_name, role, id_staff, leader_id").eq("company_id", user.company_id),
    admin.from("fb_columns").select("key, label").limit(300),
    admin.from("site_settings").select("setting_value").eq("setting_key", `charts_${user.company_id}_report_leader`).maybeSingle(),
  ]);

  const selectedCols = (colRes.data?.column_order as string[]) || [];
  const availableMetrics = [
    ...(fbRes.data?.filter(c => selectedCols.includes(c.key)) || []),
    ...(customRes.data || []).map(c => ({ key: c.key, label: c.label })),
  ].filter((m, i, arr) => arr.findIndex(x => x.key === m.key) === i);

  type ChartConfig = { id: number; title: string; metric1: string; metric2: string };
  const savedCharts = (chartConfigRes.data?.setting_value as ChartConfig[] | undefined) ?? null;

  const roleData = filterByRole(adRes.data || [], user, teamRes.data || []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Report by Leader</h1>
      <PageCharts
        pageKey="report_leader" companyId={user.company_id} isBod={user.role === "bod"}
        adData={roleData.map(r => ({ data: r.data as Record<string, unknown>, date_start: r.date_start }))}
        availableMetrics={availableMetrics}
        customColumns={(customRes.data || []).map(c => ({ key: c.key, label: c.label, formula: c.formula }))}
        savedCharts={savedCharts}
      />
      <ReportView
        adData={roleData} selectedColumns={selectedCols}
        customColumns={customRes.data || []} fbColumns={fbRes.data || []}
        teamMembers={teamRes.data || []} groupBy="leader"
      />
    </div>
  );
}
