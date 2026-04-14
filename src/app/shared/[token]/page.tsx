import { createServiceClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

export default async function SharedDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createServiceClient();

  // Validate share token
  const { data: share } = await admin
    .from("client_shares")
    .select("*, companies(name)")
    .eq("share_token", token)
    .eq("is_active", true)
    .single();

  if (!share) notFound();

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500">This shared dashboard link has expired.</p>
        </div>
      </div>
    );
  }

  // Get ad data for this company (filtered by brand if specified)
  let query = admin
    .from("ad_data")
    .select("data")
    .eq("company_id", share.company_id);

  if (share.brand_id) {
    query = query.eq("brand_id", share.brand_id);
  }

  const { data: adData } = await query;

  // Aggregate metrics
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0;
  let totalLeads = 0, totalPurchases = 0, totalRevenue = 0;
  const campaignMap = new Map<string, { spend: number; clicks: number; impressions: number; ctr: number }>();

  (adData || []).forEach((row) => {
    const d = row.data as Record<string, unknown>;
    const spend = parseFloat(String(d.spend || 0));
    const impressions = parseInt(String(d.impressions || 0));
    const clicks = parseInt(String(d.clicks || 0));
    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalLeads += parseInt(String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0));
    totalPurchases += parseInt(String(d["actions:purchase"] || d["actions:omni_purchase"] || 0));
    totalRevenue += parseFloat(String(d["action_values:purchase"] || d["action_values:omni_purchase"] || 0));

    const name = String(d.campaign_name || "Unknown");
    const existing = campaignMap.get(name) || { spend: 0, clicks: 0, impressions: 0, ctr: 0 };
    existing.spend += spend;
    existing.clicks += clicks;
    existing.impressions += impressions;
    campaignMap.set(name, existing);
  });

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const cpa = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const topCampaigns = Array.from(campaignMap.entries())
    .map(([name, data]) => ({
      name,
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  const companyName = (share.companies as { name: string } | null)?.name || "Company";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-600">Hack Data</h1>
            <p className="text-xs text-gray-500">Shared Report for {share.client_name}</p>
          </div>
          <span className="text-sm text-gray-500">{companyName}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketing Performance Report</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card label="Total Spend" value={`RM ${totalSpend.toFixed(2)}`} />
          <Card label="Impressions" value={totalImpressions.toLocaleString()} />
          <Card label="Clicks" value={totalClicks.toLocaleString()} />
          <Card label="CTR" value={`${ctr.toFixed(2)}%`} />
          <Card label="Leads" value={totalLeads.toLocaleString()} />
          <Card label="CPA" value={cpa > 0 ? `RM ${cpa.toFixed(2)}` : "—"} />
          <Card label="Purchases" value={totalPurchases.toLocaleString()} />
          <Card label="Revenue" value={`RM ${totalRevenue.toFixed(2)}`} />
          <Card label="ROAS" value={roas > 0 ? `${roas.toFixed(2)}x` : "—"} />
          <Card label="Campaigns" value={String(campaignMap.size)} />
          <Card label="Ad Records" value={String(adData?.length || 0)} />
        </div>

        {/* Campaign Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Campaign Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Spend</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Impressions</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Clicks</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topCampaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-700">RM {c.spend.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-700">{c.impressions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-700">{c.clicks.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-700">{c.ctr.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by Hack Data Marketing Reporting System
        </p>
      </main>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
