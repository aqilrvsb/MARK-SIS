import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function FunnelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();
  const { data: adData } = await admin.from("ad_data").select("data").eq("company_id", user.company_id);

  let impressions = 0, clicks = 0, landingPageViews = 0, leads = 0, purchases = 0, revenue = 0;

  (adData || []).forEach((row) => {
    const d = row.data as Record<string, unknown>;
    impressions += parseInt(String(d.impressions || 0));
    clicks += parseInt(String(d.clicks || d.inline_link_clicks || 0));
    landingPageViews += parseInt(String(d["actions:landing_page_view"] || 0));
    leads += parseInt(String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0));
    purchases += parseInt(String(d["actions:purchase"] || d["actions:omni_purchase"] || 0));
    revenue += parseFloat(String(d["action_values:purchase"] || d["action_values:omni_purchase"] || 0));
  });

  const steps = [
    { label: "Impressions", value: impressions, color: "bg-blue-500" },
    { label: "Clicks", value: clicks, color: "bg-blue-400" },
    { label: "Landing Page Views", value: landingPageViews, color: "bg-indigo-400" },
    { label: "Leads", value: leads, color: "bg-purple-400" },
    { label: "Purchases", value: purchases, color: "bg-green-500" },
  ];

  // Calculate conversion rates between steps
  const rates = steps.map((step, i) => {
    if (i === 0) return { ...step, rate: 100, dropoff: 0 };
    const prevValue = steps[i - 1].value;
    const rate = prevValue > 0 ? (step.value / prevValue) * 100 : 0;
    const dropoff = prevValue > 0 ? 100 - rate : 0;
    return { ...step, rate, dropoff };
  });

  const maxValue = Math.max(...steps.map(s => s.value), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Funnel Tracker</h1>
      <p className="text-gray-500 mb-6">Impression → Click → Landing Page → Lead → Purchase</p>

      {/* Visual Funnel */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <div className="space-y-4 max-w-2xl mx-auto">
          {rates.map((step, i) => {
            const widthPct = Math.max((step.value / maxValue) * 100, 8);
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">{step.value.toLocaleString()}</span>
                    {i > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        step.rate >= 10 ? "bg-green-100 text-green-700" :
                        step.rate >= 3 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {step.rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-8 flex items-center justify-center mx-auto"
                  style={{ width: `${widthPct}%`, minWidth: "60px", margin: "0 auto" }}>
                  <div className={`${step.color} rounded-full h-8 w-full`} />
                </div>
                {i > 0 && step.dropoff > 0 && (
                  <p className="text-xs text-red-400 text-center mt-1">
                    ↓ {step.dropoff.toFixed(1)}% drop-off
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Click-Through Rate</p>
          <p className="text-xl font-bold text-gray-900">
            {impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Click → Lead Rate</p>
          <p className="text-xl font-bold text-gray-900">
            {clicks > 0 ? ((leads / clicks) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Lead → Purchase Rate</p>
          <p className="text-xl font-bold text-gray-900">
            {leads > 0 ? ((purchases / leads) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">RM {revenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
