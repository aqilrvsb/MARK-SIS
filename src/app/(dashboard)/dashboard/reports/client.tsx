"use client";

import { useState } from "react";
import { evaluateFormula } from "@/lib/formula";
import { UserProfile } from "@/lib/types";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  id_staff: string;
  leader_id: string | null;
}

interface CustomColumn {
  id: string;
  key: string;
  label: string;
  formula: string | null;
  is_active: boolean;
}

interface Props {
  adData: { data: Record<string, unknown>; marketer_id: string }[];
  selectedColumns: string[];
  customColumns: CustomColumn[];
  teamMembers: TeamMember[];
  fbColumns: { key: string; label: string }[];
  currentUser: UserProfile;
  defaultTab: string;
}

export default function ReportsClient({
  adData, selectedColumns, customColumns, teamMembers, fbColumns, currentUser, defaultTab,
}: Props) {
  const [tab, setTab] = useState(defaultTab);

  // Build column label map
  const colLabelMap = new Map(fbColumns.map(c => [c.key, c.label]));
  customColumns.forEach(c => colLabelMap.set(c.key, c.label));

  // Determine visible columns: selected defaults + active custom columns
  const visibleColumns = [
    ...(selectedColumns.length > 0 ? selectedColumns : ["campaign_name", "ad_name", "spend", "impressions", "clicks", "ctr", "cpc"]),
    ...customColumns.filter(c => c.is_active).map(c => c.key),
  ];

  // Filter data by role
  function getFilteredData(filterType: string, filterId?: string) {
    let rows = adData;

    if (currentUser.role === "marketer") {
      rows = rows.filter(r => r.marketer_id === currentUser.id);
    } else if (currentUser.role === "leader") {
      const myMarketers = teamMembers.filter(m => m.leader_id === currentUser.id).map(m => m.id);
      rows = rows.filter(r => myMarketers.includes(r.marketer_id) || r.marketer_id === currentUser.id);
    }

    if (filterType === "leader" && filterId) {
      const leaderMarketers = teamMembers.filter(m => m.leader_id === filterId).map(m => m.id);
      rows = rows.filter(r => leaderMarketers.includes(r.marketer_id));
    } else if (filterType === "marketer" && filterId) {
      rows = rows.filter(r => r.marketer_id === filterId);
    }

    return rows;
  }

  // Aggregate summary for a set of rows
  function getSummary(rows: typeof adData) {
    let spend = 0, impressions = 0, clicks = 0, leads = 0, purchases = 0, revenue = 0;
    rows.forEach(r => {
      const d = r.data;
      spend += parseFloat(String(d.spend || 0));
      impressions += parseInt(String(d.impressions || 0));
      clicks += parseInt(String(d.clicks || 0));
      leads += parseInt(String(d["actions:lead"] || d["actions:onsite_conversion.lead_grouped"] || 0));
      purchases += parseInt(String(d["actions:purchase"] || d["actions:omni_purchase"] || 0));
      revenue += parseFloat(String(d["action_values:purchase"] || d["action_values:omni_purchase"] || 0));
    });
    return {
      spend, impressions, clicks, leads, purchases, revenue,
      ctr: impressions > 0 ? (clicks / impressions * 100) : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: leads > 0 ? spend / leads : 0,
      roas: spend > 0 ? revenue / spend : 0,
      records: rows.length,
    };
  }

  // Get cell value including custom column formula
  function getCellValue(rowData: Record<string, unknown>, colKey: string): string {
    const customCol = customColumns.find(c => c.key === colKey);
    if (customCol?.formula) {
      const result = evaluateFormula(customCol.formula, rowData);
      return result !== null ? result.toFixed(2) : "—";
    }
    const val = rowData[colKey];
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "number") return val.toLocaleString();
    return String(val);
  }

  const leaders = teamMembers.filter(m => m.role === "leader");
  const marketers = teamMembers.filter(m => m.role === "marketer");

  const tabs = [
    { id: "all", label: "Report All" },
    { id: "leader", label: "Report by Leader" },
    { id: "marketer", label: "Report by Marketer" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "all" && <ReportSection title="All Data" rows={getFilteredData("all")} />}

      {tab === "leader" && (
        <div className="space-y-8">
          {leaders.length === 0 ? (
            <p className="text-gray-400">No leaders found.</p>
          ) : leaders.map(leader => {
            const leaderRows = getFilteredData("leader", leader.id);
            return (
              <ReportSection
                key={leader.id}
                title={`${leader.full_name} (${leader.id_staff || "—"})`}
                rows={leaderRows}
              />
            );
          })}
        </div>
      )}

      {tab === "marketer" && (
        <div className="space-y-8">
          {marketers.length === 0 ? (
            <p className="text-gray-400">No marketers found.</p>
          ) : marketers.map(mktr => {
            const mktrRows = getFilteredData("marketer", mktr.id);
            return (
              <ReportSection
                key={mktr.id}
                title={`${mktr.full_name} (${mktr.id_staff || "—"})`}
                rows={mktrRows}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  function ReportSection({ title, rows }: { title: string; rows: typeof adData }) {
    const summary = getSummary(rows);

    return (
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>

        {/* Summary Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-4">
          <SummaryBox label="Spend" value={`RM ${summary.spend.toFixed(2)}`} />
          <SummaryBox label="Impressions" value={summary.impressions.toLocaleString()} />
          <SummaryBox label="Clicks" value={summary.clicks.toLocaleString()} />
          <SummaryBox label="CTR" value={`${summary.ctr.toFixed(2)}%`} color={summary.ctr > 2 ? "green" : summary.ctr > 1 ? "yellow" : "red"} />
          <SummaryBox label="CPA" value={summary.cpa > 0 ? `RM ${summary.cpa.toFixed(2)}` : "—"} />
          <SummaryBox label="Leads" value={summary.leads.toLocaleString()} />
          <SummaryBox label="Purchases" value={summary.purchases.toLocaleString()} />
          <SummaryBox label="Revenue" value={`RM ${summary.revenue.toFixed(2)}`} />
          <SummaryBox label="ROAS" value={summary.roas > 0 ? `${summary.roas.toFixed(2)}x` : "—"} color={summary.roas >= 3 ? "green" : summary.roas >= 1.5 ? "yellow" : "red"} />
          <SummaryBox label="Records" value={String(summary.records)} />
        </div>

        {/* Data Table */}
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No data yet.</div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {visibleColumns.map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                        {colLabelMap.get(col) || col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {visibleColumns.map(col => (
                        <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                          {getCellValue(row.data, col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <div className="px-4 py-3 text-center text-xs text-gray-400 border-t">
                Showing 100 of {rows.length} rows
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

function SummaryBox({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    green: "text-emerald-600", yellow: "text-amber-600", red: "text-red-500",
  };
  return (
    <div className="stat-card bg-white rounded-xl p-3">
      <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
      <p className={`text-lg font-bold ${color ? colors[color] || "" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
