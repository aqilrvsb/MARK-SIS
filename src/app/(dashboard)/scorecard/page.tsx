import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function ScorecardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createServiceClient();

  // For leaders, fetch team members in parallel with scores
  let teamIds: string[] | null = null;
  if (user.role === "leader") {
    const { data: teamMembers } = await admin
      .from("users")
      .select("id")
      .eq("company_id", user.company_id)
      .or(`id.eq.${user.id},leader_id.eq.${user.id}`);
    teamIds = (teamMembers || []).map((m) => m.id);
  }

  let query = admin
    .from("marketer_scores")
    .select("*, users:marketer_id(id, full_name, role, leader_id)")
    .eq("company_id", user.company_id)
    .order("total_spend", { ascending: false });

  // Role-based filtering
  if (user.role === "marketer") {
    query = query.eq("marketer_id", user.id);
  } else if (user.role === "leader" && teamIds && teamIds.length > 0) {
    query = query.in("marketer_id", teamIds);
  }
  // BOD sees all — no additional filter

  const { data: scores } = await query;

  const ratingColors: Record<string, string> = {
    excellent: "bg-green-100 text-green-700",
    good: "bg-blue-100 text-blue-700",
    neutral: "bg-gray-100 text-gray-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketer Scorecard</h1>
        <p className="text-gray-500">Performance ranking across all marketers</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {!scores || scores.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No scorecard data available yet. Import ad data first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spend</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Impressions</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Clicks</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Leads</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">ROAS</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">CPA</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">CTR</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.map((score, i) => {
                  const userName = (score.users as { full_name: string } | null)?.full_name || "Unknown";
                  return (
                    <tr key={score.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-gray-300">#{i + 1}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{userName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        RM {(score.total_spend || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {(score.total_impressions || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {(score.total_clicks || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {(score.total_leads || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {(score.avg_roas || 0).toFixed(2)}x
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {score.avg_cpa ? `RM ${score.avg_cpa.toFixed(2)}` : "---"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right">
                        {(score.avg_ctr || 0).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            ratingColors[score.score_rating] || ratingColors.neutral
                          }`}
                        >
                          {(score.score_rating || "neutral").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
