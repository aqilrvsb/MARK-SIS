import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReportView from "@/components/report-view";
import PageCharts from "@/components/page-charts";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();

  const [companyRes, adDataRes, colRes, customRes, teamRes, fbRes, chartConfigRes] = await Promise.all([
    admin.from("companies").select("name").eq("id", user.company_id).single(),
    admin.from("ad_data").select("data, marketer_id, date_start, date_end").eq("company_id", user.company_id).limit(1000),
    admin.from("company_column_views").select("column_order").eq("company_id", user.company_id).eq("is_default", true).maybeSingle(),
    admin.from("custom_columns").select("key, label, formula, is_active").eq("company_id", user.company_id),
    admin.from("users").select("id, full_name, role, id_staff, leader_id").eq("company_id", user.company_id),
    admin.from("fb_columns").select("key, label").limit(300),
    admin.from("site_settings").select("setting_value").eq("setting_key", `charts_${user.company_id}_dashboard`).maybeSingle(),
  ]);

  const company = companyRes.data;
  const selectedCols = (colRes.data?.column_order as string[]) || [];
  const availableMetrics = [
    ...(fbRes.data?.filter(c => selectedCols.includes(c.key)) || []),
    ...(customRes.data || []).map(c => ({ key: c.key, label: c.label })),
  ].filter((m, i, arr) => arr.findIndex(x => x.key === m.key) === i);

  type ChartConfig = { id: number; title: string; metric1: string; metric2: string };
  const savedCharts = (chartConfigRes.data?.setting_value as ChartConfig[] | undefined) ?? null;

  // Filter data by role
  let roleFilteredData = adDataRes.data || [];
  if (user.role === "leader") {
    const myMarketers = (teamRes.data || []).filter(m => m.leader_id === user.id).map(m => m.id);
    roleFilteredData = roleFilteredData.filter(r => myMarketers.includes(r.marketer_id) || r.marketer_id === user.id);
  } else if (user.role === "marketer") {
    roleFilteredData = roleFilteredData.filter(r => r.marketer_id === user.id);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{company?.name} — Welcome, {user.full_name}</p>
        {user.id_staff && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">Your Staff ID:</span>
            <code className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{user.id_staff}</code>
          </div>
        )}
      </div>

      {/* Charts */}
      <PageCharts
        pageKey="dashboard"
        companyId={user.company_id}
        isBod={user.role === "bod"}
        adData={roleFilteredData.map(row => ({ data: row.data as Record<string, unknown>, date_start: row.date_start as string }))}
        availableMetrics={availableMetrics}
        customColumns={(customRes.data || []).map(c => ({ key: c.key, label: c.label, formula: c.formula }))}
        savedCharts={savedCharts}
      />

      {/* Report View — column-driven summary boxes + data table + date filter */}
      <ReportView
        adData={roleFilteredData}
        selectedColumns={selectedCols}
        customColumns={customRes.data || []}
        fbColumns={fbRes.data || []}
        teamMembers={teamRes.data || []}
        groupBy="none"
      />
    </div>
  );
}
