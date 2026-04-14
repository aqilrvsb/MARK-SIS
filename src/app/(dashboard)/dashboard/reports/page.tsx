import { getCurrentUser } from "@/lib/actions";
import { createServiceClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date_start?: string; date_end?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const dateStart = params.date_start || "";
  const dateEnd = params.date_end || "";

  const admin = createServiceClient();

  let query = admin
    .from("ad_data")
    .select("*")
    .eq("company_id", user.company_id)
    .order("date_start", { ascending: false })
    .limit(50);

  if (dateStart) {
    query = query.gte("date_start", dateStart);
  }
  if (dateEnd) {
    query = query.lte("date_end", dateEnd);
  }

  const { data: adData } = await query;

  // Extract rows with JSONB data flattened
  const rows = (adData || []).map((row) => {
    const d = row.data as Record<string, unknown>;
    return {
      id: row.id,
      date_start: row.date_start,
      date_end: row.date_end,
      campaign_name: String(d.campaign_name || "---"),
      ad_name: String(d.ad_name || "---"),
      spend: parseFloat(String(d.spend || 0)),
      impressions: parseInt(String(d.impressions || 0)),
      clicks: parseInt(String(d.clicks || 0)),
      ctr: parseFloat(String(d.ctr || 0)),
      cpc: parseFloat(String(d.cpc || 0)),
      leads: parseInt(
        String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0)
      ),
      purchases: parseInt(
        String(d["actions:purchase"] || d["actions:omni_purchase"] || 0)
      ),
      roas: parseFloat(
        String(
          d["purchase_roas:omni_purchase"] ||
            d["purchase_roas:purchase"] ||
            d.roas ||
            0
        )
      ),
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Reports</h1>
          <p className="text-gray-500">
            Showing {rows.length} records{dateStart ? ` from ${dateStart}` : ""}{dateEnd ? ` to ${dateEnd}` : ""}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <form className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="date_start"
              defaultValue={dateStart}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="date_end"
              defaultValue={dateEnd}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Filter
          </button>
          {(dateStart || dateEnd) && (
            <Link
              href="/dashboard/reports"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No data found for the selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ad Name</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Spend</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Impressions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clicks</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CTR</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CPC</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Leads</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Purchases</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {row.date_start}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
                      {row.campaign_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">
                      {row.ad_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                      RM {row.spend.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {row.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {row.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {row.ctr.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
                      RM {row.cpc.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {row.leads}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {row.purchases}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      <span
                        className={
                          row.roas >= 3
                            ? "text-green-600"
                            : row.roas >= 1.5
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {row.roas > 0 ? `${row.roas.toFixed(2)}x` : "---"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
