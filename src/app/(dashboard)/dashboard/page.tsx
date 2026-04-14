import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();

  // Run ALL queries in parallel — much faster
  const [companyRes, teamRes, adDataRes, alertRes, scoresRes] = await Promise.all([
    admin.from("companies").select("name").eq("id", user.company_id).single(),
    admin.from("users").select("*", { count: "exact", head: true }).eq("company_id", user.company_id),
    admin.from("ad_data").select("data").eq("company_id", user.company_id).limit(500),
    admin.from("alert_history").select("*", { count: "exact", head: true }).eq("company_id", user.company_id).eq("is_read", false),
    admin.from("marketer_scores").select("*, users:marketer_id(full_name)").eq("company_id", user.company_id).order("total_spend", { ascending: false }).limit(10),
  ]);

  const company = companyRes.data;
  const teamCount = teamRes.count;
  const adData = adDataRes.data;
  const alertCount = alertRes.count;
  const scores = scoresRes.data;

  let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalLeads = 0;
  let totalPurchases = 0, totalRevenue = 0;

  (adData || []).forEach((row) => {
    const d = row.data as Record<string, unknown>;
    totalSpend += parseFloat(String(d.spend || 0));
    totalImpressions += parseInt(String(d.impressions || 0));
    totalClicks += parseInt(String(d.clicks || 0));
    totalLeads += parseInt(String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0));
    totalPurchases += parseInt(String(d["actions:purchase"] || d["actions:omni_purchase"] || 0));
    totalRevenue += parseFloat(String(d["action_values:purchase"] || d["action_values:omni_purchase"] || 0));
  });

  const roas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
  const cpa = totalLeads > 0 ? (totalSpend / totalLeads) : 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
  const cpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

  // Top campaigns by spend
  const campaignMap = new Map<string, { spend: number; clicks: number; impressions: number; leads: number }>();
  (adData || []).forEach((row) => {
    const d = row.data as Record<string, unknown>;
    const name = String(d.campaign_name || "Unknown");
    const existing = campaignMap.get(name) || { spend: 0, clicks: 0, impressions: 0, leads: 0 };
    existing.spend += parseFloat(String(d.spend || 0));
    existing.clicks += parseInt(String(d.clicks || 0));
    existing.impressions += parseInt(String(d.impressions || 0));
    existing.leads += parseInt(String(d["actions:lead"] || 0));
    campaignMap.set(name, existing);
  });

  const topCampaigns = Array.from(campaignMap.entries())
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">{company?.name} — Welcome, {user.full_name}</p>
          {user.id_staff && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">Your Staff ID:</span>
              <code className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{user.id_staff}</code>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {(alertCount || 0) > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
              {alertCount} alert{alertCount! > 1 ? "s" : ""}
            </span>
          )}
          <Link href="/dashboard/import"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Import Data
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Spend" value={`RM ${totalSpend.toFixed(2)}`} />
        <StatCard label="Impressions" value={totalImpressions.toLocaleString()} />
        <StatCard label="Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="CTR" value={`${ctr.toFixed(2)}%`} color={ctr > 2 ? "green" : ctr > 1 ? "yellow" : "red"} />
        <StatCard label="CPC" value={`RM ${cpc.toFixed(2)}`} />
        <StatCard label="Leads" value={totalLeads.toLocaleString()} />
        <StatCard label="CPA" value={cpa > 0 ? `RM ${cpa.toFixed(2)}` : "—"} color={cpa > 0 && cpa < 10 ? "green" : cpa < 20 ? "yellow" : "red"} />
        <StatCard label="Purchases" value={totalPurchases.toLocaleString()} />
        <StatCard label="Revenue" value={`RM ${totalRevenue.toFixed(2)}`} />
        <StatCard label="ROAS" value={roas > 0 ? `${roas.toFixed(2)}x` : "—"} color={roas >= 3 ? "green" : roas >= 1.5 ? "yellow" : "red"} />
        <StatCard label="Team" value={String(teamCount || 0)} />
        <StatCard label="Records" value={String(adData?.length || 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campaigns */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Top Campaigns by Spend</h2>
          {topCampaigns.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet. Import data first.</p>
          ) : (
            <div className="space-y-3">
              {topCampaigns.map(([name, data], i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-500">
                      {data.clicks} clicks · {data.leads} leads
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 ml-4">
                    RM {data.spend.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marketer Ranking */}
        {(user.role === "bod" || user.role === "leader") && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Marketer Ranking</h2>
              <Link href="/scorecard" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {(!scores || scores.length === 0) ? (
              <p className="text-gray-400 text-sm">No scores yet.</p>
            ) : (
              <div className="space-y-3">
                {scores.map((score, i) => {
                  const ratingColors: Record<string, string> = {
                    excellent: "bg-green-100 text-green-700",
                    good: "bg-blue-100 text-blue-700",
                    neutral: "bg-gray-100 text-gray-700",
                    warning: "bg-yellow-100 text-yellow-700",
                    danger: "bg-red-100 text-red-700",
                  };
                  const userName = (score.users as { full_name: string } | null)?.full_name || "Unknown";
                  return (
                    <div key={score.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{userName}</p>
                          <p className="text-xs text-gray-500">
                            Spend: RM {(score.total_spend || 0).toFixed(2)} · ROAS: {(score.avg_roas || 0).toFixed(2)}x
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ratingColors[score.score_rating] || ratingColors.neutral}`}>
                        {score.score_rating?.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink href="/dashboard/reports" label="View Reports" desc="Full data table" color="blue" />
        <QuickLink href="/scorecard" label="Scorecard" desc="Performance ranking" color="green" />
        <QuickLink href="/creatives" label="Creatives" desc="Best performing ads" color="purple" />
        {user.role === "bod" && (
          <QuickLink href="/settings/kpi" label="KPI Targets" desc="Set performance goals" color="orange" />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ? colorMap[color] || "" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function QuickLink({ href, label, desc, color }: { href: string; label: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    green: "bg-green-50 hover:bg-green-100 text-green-700",
    purple: "bg-purple-50 hover:bg-purple-100 text-purple-700",
    orange: "bg-orange-50 hover:bg-orange-100 text-orange-700",
  };
  return (
    <Link href={href} className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs opacity-75">{desc}</p>
    </Link>
  );
}
