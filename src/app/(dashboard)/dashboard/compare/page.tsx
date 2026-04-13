import { getCurrentUser } from "@/lib/actions";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const period = params.period || "week";
  const supabase = await createClient();

  const now = new Date();
  let currentStart: string, currentEnd: string, prevStart: string, prevEnd: string, periodLabel: string;

  if (period === "month") {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    currentStart = thisMonth.toISOString().split("T")[0];
    currentEnd = now.toISOString().split("T")[0];
    prevStart = lastMonth.toISOString().split("T")[0];
    prevEnd = lastMonthEnd.toISOString().split("T")[0];
    periodLabel = "This Month vs Last Month";
  } else {
    const dayOfWeek = now.getDay();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - dayOfWeek);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    currentStart = thisWeekStart.toISOString().split("T")[0];
    currentEnd = now.toISOString().split("T")[0];
    prevStart = lastWeekStart.toISOString().split("T")[0];
    prevEnd = lastWeekEnd.toISOString().split("T")[0];
    periodLabel = "This Week vs Last Week";
  }

  // Fetch current period data
  const { data: currentData } = await supabase
    .from("ad_data")
    .select("data")
    .gte("date_start", currentStart)
    .lte("date_end", currentEnd);

  // Fetch previous period data
  const { data: prevData } = await supabase
    .from("ad_data")
    .select("data")
    .gte("date_start", prevStart)
    .lte("date_end", prevEnd);

  function aggregate(rows: { data: Record<string, unknown> }[] | null) {
    let spend = 0, impressions = 0, clicks = 0, leads = 0, purchases = 0, revenue = 0;
    (rows || []).forEach((row) => {
      const d = row.data;
      spend += parseFloat(String(d.spend || 0));
      impressions += parseInt(String(d.impressions || 0));
      clicks += parseInt(String(d.clicks || 0));
      leads += parseInt(String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0));
      purchases += parseInt(String(d["actions:purchase"] || d["actions:omni_purchase"] || 0));
      revenue += parseFloat(String(d["action_values:purchase"] || d["action_values:omni_purchase"] || 0));
    });
    return {
      spend, impressions, clicks, leads, purchases, revenue,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: leads > 0 ? spend / leads : 0,
      roas: spend > 0 ? revenue / spend : 0,
      records: rows?.length || 0,
    };
  }

  const current = aggregate(currentData);
  const prev = aggregate(prevData);

  function change(curr: number, previous: number): { value: string; direction: "up" | "down" | "flat" } {
    if (previous === 0 && curr === 0) return { value: "0%", direction: "flat" };
    if (previous === 0) return { value: "+100%", direction: "up" };
    const pct = ((curr - previous) / previous) * 100;
    return {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    };
  }

  const metrics = [
    { label: "Spend", current: `RM ${current.spend.toFixed(2)}`, prev: `RM ${prev.spend.toFixed(2)}`, change: change(current.spend, prev.spend), lowerBetter: true },
    { label: "Impressions", current: current.impressions.toLocaleString(), prev: prev.impressions.toLocaleString(), change: change(current.impressions, prev.impressions), lowerBetter: false },
    { label: "Clicks", current: current.clicks.toLocaleString(), prev: prev.clicks.toLocaleString(), change: change(current.clicks, prev.clicks), lowerBetter: false },
    { label: "CTR", current: `${current.ctr.toFixed(2)}%`, prev: `${prev.ctr.toFixed(2)}%`, change: change(current.ctr, prev.ctr), lowerBetter: false },
    { label: "CPC", current: `RM ${current.cpc.toFixed(2)}`, prev: `RM ${prev.cpc.toFixed(2)}`, change: change(current.cpc, prev.cpc), lowerBetter: true },
    { label: "Leads", current: current.leads.toLocaleString(), prev: prev.leads.toLocaleString(), change: change(current.leads, prev.leads), lowerBetter: false },
    { label: "CPA", current: `RM ${current.cpa.toFixed(2)}`, prev: `RM ${prev.cpa.toFixed(2)}`, change: change(current.cpa, prev.cpa), lowerBetter: true },
    { label: "Purchases", current: current.purchases.toLocaleString(), prev: prev.purchases.toLocaleString(), change: change(current.purchases, prev.purchases), lowerBetter: false },
    { label: "Revenue", current: `RM ${current.revenue.toFixed(2)}`, prev: `RM ${prev.revenue.toFixed(2)}`, change: change(current.revenue, prev.revenue), lowerBetter: false },
    { label: "ROAS", current: `${current.roas.toFixed(2)}x`, prev: `${prev.roas.toFixed(2)}x`, change: change(current.roas, prev.roas), lowerBetter: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Period Comparison</h1>
          <p className="text-gray-500">{periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard/compare?period=week"
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${period === "week" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            Weekly
          </a>
          <a href="/dashboard/compare?period=month"
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${period === "month" ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            Monthly
          </a>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        Current: {currentStart} to {currentEnd} | Previous: {prevStart} to {prevEnd}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m) => {
          const isGood = m.lowerBetter
            ? m.change.direction === "down"
            : m.change.direction === "up";
          const isBad = m.lowerBetter
            ? m.change.direction === "up"
            : m.change.direction === "down";

          return (
            <div key={m.label} className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs text-gray-500 mb-2">{m.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-900">{m.current}</p>
                  <p className="text-xs text-gray-400">was {m.prev}</p>
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  isGood ? "bg-green-100 text-green-700" :
                  isBad ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {m.change.direction === "up" ? "↑" : m.change.direction === "down" ? "↓" : "→"} {m.change.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
