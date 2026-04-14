import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ChartsConfigClient from "./client";

export default async function ChartsConfigPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "bod") redirect("/dashboard");

  const admin = createServiceClient();
  const [colRes, customRes, fbRes, configRes] = await Promise.all([
    admin.from("company_column_views").select("column_order").eq("company_id", user.company_id).eq("is_default", true).maybeSingle(),
    admin.from("custom_columns").select("key, label").eq("company_id", user.company_id).eq("is_active", true),
    admin.from("fb_columns").select("key, label").limit(300),
    admin.from("site_settings").select("setting_key, setting_value").like("setting_key", `charts_${user.company_id}_%`),
  ]);

  const selectedCols = (colRes.data?.column_order as string[]) || [];
  const availableMetrics = [
    ...(fbRes.data?.filter(c => selectedCols.includes(c.key)) || []),
    ...(customRes.data || []).map(c => ({ key: c.key, label: c.label })),
  ].filter((m, i, arr) => arr.findIndex(x => x.key === m.key) === i);

  // Parse saved configs per page
  const pages = ["dashboard", "report_all", "report_leader", "report_marketer"];
  const savedConfigs: Record<string, unknown[]> = {};
  pages.forEach(p => {
    const found = (configRes.data || []).find(c => c.setting_key === `charts_${user.company_id}_${p}`);
    savedConfigs[p] = (found?.setting_value as unknown[]) || [];
  });

  return (
    <ChartsConfigClient
      companyId={user.company_id}
      availableMetrics={availableMetrics}
      savedConfigs={savedConfigs}
    />
  );
}
