import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ChartsClient from "./client";

export default async function ChartsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();
  const [adRes, colRes, customRes, teamRes, fbRes, chartConfigRes] = await Promise.all([
    admin.from("ad_data").select("data, marketer_id, date_start").eq("company_id", user.company_id).order("date_start").limit(2000),
    admin.from("company_column_views").select("column_order").eq("company_id", user.company_id).eq("is_default", true).maybeSingle(),
    admin.from("custom_columns").select("key, label, formula, is_active").eq("company_id", user.company_id).eq("is_active", true),
    admin.from("users").select("id, full_name, role, id_staff").eq("company_id", user.company_id),
    admin.from("fb_columns").select("key, label, category").limit(300),
    admin.from("site_settings").select("setting_value").eq("setting_key", `chart_config_${user.company_id}`).maybeSingle(),
  ]);

  // Build available metrics from selected columns + custom columns
  const selectedCols = (colRes.data?.column_order as string[]) || [];
  const allMetrics = [
    ...fbRes.data?.filter(c => selectedCols.includes(c.key)) || [],
    ...(customRes.data || []).map(c => ({ key: c.key, label: c.label, category: "custom" })),
    // Always include core metrics
    { key: "spend", label: "Spend", category: "performance" },
    { key: "impressions", label: "Impressions", category: "performance" },
    { key: "clicks", label: "Clicks", category: "performance" },
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueMetrics = allMetrics.filter(m => {
    if (seen.has(m.key)) return false;
    seen.add(m.key);
    return true;
  });

  return (
    <ChartsClient
      adData={adRes.data || []}
      availableMetrics={uniqueMetrics}
      customColumns={customRes.data || []}
      teamMembers={teamRes.data || []}
      companyId={user.company_id}
      savedConfig={chartConfigRes.data?.setting_value || null}
    />
  );
}
