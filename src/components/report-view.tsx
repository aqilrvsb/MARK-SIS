"use client";

import { useState } from "react";
import { evaluateFormula } from "@/lib/formula";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  id_staff: string;
  leader_id: string | null;
}

interface CustomColumn {
  key: string;
  label: string;
  formula: string | null;
  is_active: boolean;
}

interface ReportViewProps {
  adData: { data: Record<string, unknown>; marketer_id: string; date_start: string; date_end: string }[];
  selectedColumns: string[];
  customColumns: CustomColumn[];
  fbColumns: { key: string; label: string }[];
  groupBy?: "none" | "leader" | "marketer";
  teamMembers: TeamMember[];
}

export default function ReportView({
  adData, selectedColumns, customColumns, fbColumns, groupBy = "none", teamMembers,
}: ReportViewProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Column label map
  const colLabelMap = new Map(fbColumns.map(c => [c.key, c.label]));
  customColumns.forEach(c => colLabelMap.set(c.key, c.label));

  // Visible columns = checked defaults + active custom
  const activeCustomKeys = customColumns.filter(c => c.is_active).map(c => c.key);
  const visibleColumns = [...selectedColumns, ...activeCustomKeys];

  // Filter by date range
  let filteredData = adData;
  if (startDate) filteredData = filteredData.filter(r => r.date_start >= startDate);
  if (endDate) filteredData = filteredData.filter(r => r.date_end <= endDate);

  // Get cell value
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

  // Aggregate summary
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
      cpa: leads > 0 ? spend / leads : 0,
      roas: spend > 0 ? revenue / spend : 0,
      records: rows.length,
    };
  }

  // Group data
  function getGroups(): { title: string; staffId: string; rows: typeof adData }[] {
    if (groupBy === "leader") {
      return teamMembers.filter(m => m.role === "leader").map(leader => ({
        title: leader.full_name,
        staffId: leader.id_staff || "—",
        rows: filteredData.filter(r => {
          const leaderMarketers = teamMembers.filter(m => m.leader_id === leader.id).map(m => m.id);
          return leaderMarketers.includes(r.marketer_id);
        }),
      }));
    }
    if (groupBy === "marketer") {
      return teamMembers.filter(m => m.role === "marketer" || m.role === "leader").map(mktr => ({
        title: mktr.full_name,
        staffId: mktr.id_staff || "—",
        rows: filteredData.filter(r => r.marketer_id === mktr.id),
      }));
    }
    return [{ title: "All Data", staffId: "", rows: filteredData }];
  }

  const groups = getGroups();
  const noColumnsSelected = visibleColumns.length === 0;

  return (
    <div>
      {/* Date Filter */}
      <div className="flex items-center gap-4 mb-6 bg-white rounded-xl border p-4">
        <span className="text-sm font-semibold text-gray-600">Filter:</span>
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="input-premium px-3 py-1.5 rounded-lg text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="input-premium px-3 py-1.5 rounded-lg text-sm" />
        </div>
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(""); setEndDate(""); }}
            className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filteredData.length} records</span>
      </div>

      {/* No columns selected warning */}
      {noColumnsSelected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-6 text-sm">
          No columns selected. Go to <a href="/settings/columns" className="font-bold underline">Column Settings</a> to check default columns,
          or create <a href="/settings/custom-columns" className="font-bold underline">Custom Columns</a>.
        </div>
      )}

      {/* Report Sections */}
      {groups.map((group, gi) => {
        const summary = getSummary(group.rows);
        return (
          <div key={gi} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-bold text-gray-800">{group.title}</h2>
              {group.staffId && <code className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{group.staffId}</code>}
            </div>

            {/* Summary Boxes */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <Box label="Spend" value={`RM ${summary.spend.toFixed(2)}`} />
              <Box label="Impressions" value={summary.impressions.toLocaleString()} />
              <Box label="Clicks" value={summary.clicks.toLocaleString()} />
              <Box label="CTR" value={`${summary.ctr.toFixed(2)}%`} color={summary.ctr > 2 ? "green" : summary.ctr > 1 ? "yellow" : "red"} />
              <Box label="CPA" value={summary.cpa > 0 ? `RM ${summary.cpa.toFixed(2)}` : "—"} />
              <Box label="Leads" value={summary.leads.toLocaleString()} />
              <Box label="Purchases" value={summary.purchases.toLocaleString()} />
              <Box label="Revenue" value={`RM ${summary.revenue.toFixed(2)}`} />
              <Box label="ROAS" value={summary.roas > 0 ? `${summary.roas.toFixed(2)}x` : "—"} color={summary.roas >= 3 ? "green" : summary.roas >= 1.5 ? "yellow" : "red"} />
              <Box label="Records" value={String(summary.records)} />
            </div>

            {/* Data Table — only if columns are selected */}
            {!noColumnsSelected && group.rows.length > 0 && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {groupBy !== "none" && (
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                        )}
                        {visibleColumns.map(col => (
                          <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                            {colLabelMap.get(col) || col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.rows.slice(0, 100).map((row, i) => {
                        const member = teamMembers.find(m => m.id === row.marketer_id);
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            {groupBy !== "none" && (
                              <td className="px-4 py-2.5 text-xs font-mono font-bold text-indigo-600">{member?.id_staff || "—"}</td>
                            )}
                            {visibleColumns.map(col => (
                              <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap max-w-xs truncate">
                                {getCellValue(row.data, col)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {group.rows.length > 100 && (
                  <div className="px-4 py-3 text-center text-xs text-gray-400 border-t">
                    Showing 100 of {group.rows.length} rows
                  </div>
                )}
              </div>
            )}

            {group.rows.length === 0 && (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">No data.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Box({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = { green: "text-emerald-600", yellow: "text-amber-600", red: "text-red-500" };
  return (
    <div className="stat-card bg-white rounded-xl p-3">
      <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
      <p className={`text-lg font-bold ${color ? colors[color] || "" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
