import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function HealthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();
  const { data: adData } = await admin.from("ad_data").select("data").eq("company_id", user.company_id);

  // Calculate health metrics per campaign
  const campaignHealth = new Map<string, {
    spend: number; impressions: number; clicks: number; frequency: number;
    reach: number; ctr: number; qualityRanking: string; engagementRanking: string;
    conversionRanking: string; count: number;
  }>();

  (adData || []).forEach((row) => {
    const d = row.data as Record<string, unknown>;
    const name = String(d.campaign_name || "Unknown");
    const existing = campaignHealth.get(name) || {
      spend: 0, impressions: 0, clicks: 0, frequency: 0, reach: 0,
      ctr: 0, qualityRanking: "", engagementRanking: "", conversionRanking: "", count: 0,
    };
    existing.spend += parseFloat(String(d.spend || 0));
    existing.impressions += parseInt(String(d.impressions || 0));
    existing.clicks += parseInt(String(d.clicks || 0));
    existing.frequency += parseFloat(String(d.frequency || 0));
    existing.reach += parseInt(String(d.reach || 0));
    existing.count++;
    if (d.quality_ranking) existing.qualityRanking = String(d.quality_ranking);
    if (d.engagement_rate_ranking) existing.engagementRanking = String(d.engagement_rate_ranking);
    if (d.conversion_rate_ranking) existing.conversionRanking = String(d.conversion_rate_ranking);
    campaignHealth.set(name, existing);
  });

  function scoreRanking(ranking: string): number {
    const map: Record<string, number> = {
      ABOVE_AVERAGE: 3, AVERAGE: 2, BELOW_AVERAGE: 1,
      "ABOVE AVERAGE": 3, "BELOW AVERAGE": 1,
    };
    return map[ranking?.toUpperCase()] || 0;
  }

  const campaigns = Array.from(campaignHealth.entries()).map(([name, data]) => {
    const avgFrequency = data.count > 0 ? data.frequency / data.count : 0;
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;

    // Health score: 0-100
    let healthScore = 50;

    // CTR impact (good CTR = +points)
    if (ctr >= 3) healthScore += 15;
    else if (ctr >= 1.5) healthScore += 8;
    else if (ctr < 0.5) healthScore -= 15;

    // Frequency impact (high frequency = bad)
    if (avgFrequency <= 2) healthScore += 10;
    else if (avgFrequency <= 4) healthScore += 0;
    else if (avgFrequency <= 6) healthScore -= 10;
    else healthScore -= 20;

    // Quality rankings
    healthScore += (scoreRanking(data.qualityRanking) - 1) * 5;
    healthScore += (scoreRanking(data.engagementRanking) - 1) * 5;
    healthScore += (scoreRanking(data.conversionRanking) - 1) * 5;

    healthScore = Math.max(0, Math.min(100, healthScore));

    let status: "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
    if (healthScore >= 80) status = "Excellent";
    else if (healthScore >= 60) status = "Good";
    else if (healthScore >= 40) status = "Fair";
    else if (healthScore >= 20) status = "Poor";
    else status = "Critical";

    return { name, ...data, avgFrequency, ctr, healthScore, status };
  }).sort((a, b) => b.healthScore - a.healthScore);

  const statusColors: Record<string, string> = {
    Excellent: "bg-green-100 text-green-700",
    Good: "bg-blue-100 text-blue-700",
    Fair: "bg-yellow-100 text-yellow-700",
    Poor: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };

  const barColors: Record<string, string> = {
    Excellent: "bg-green-500",
    Good: "bg-blue-500",
    Fair: "bg-yellow-500",
    Poor: "bg-orange-500",
    Critical: "bg-red-500",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ad Account Health</h1>
      <p className="text-gray-500 mb-6">Health score based on CTR, frequency, and quality rankings</p>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-400">
          No campaign data yet. Import data first.
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    Spend: RM {c.spend.toFixed(2)} · Freq: {c.avgFrequency.toFixed(1)} · CTR: {c.ctr.toFixed(2)}%
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">{c.healthScore}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`${barColors[c.status]} h-3 rounded-full transition-all`}
                  style={{ width: `${c.healthScore}%` }} />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                {c.qualityRanking && <span>Quality: {c.qualityRanking}</span>}
                {c.engagementRanking && <span>Engagement: {c.engagementRanking}</span>}
                {c.conversionRanking && <span>Conversion: {c.conversionRanking}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
