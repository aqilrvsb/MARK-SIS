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

// Map of keys that can be summed for summary boxes
const SUMMABLE_KEYS: Record<string, { format: "number" | "currency" | "percentage"; compute?: string }> = {
  spend: { format: "currency" },
  impressions: { format: "number" },
  clicks: { format: "number" },
  reach: { format: "number" },
  frequency: { format: "number" },
  cpc: { format: "currency", compute: "avg" },
  cpm: { format: "currency", compute: "avg" },
  ctr: { format: "percentage", compute: "avg" },
  cpp: { format: "currency", compute: "avg" },
  inline_link_clicks: { format: "number" },
  unique_clicks: { format: "number" },
  unique_impressions: { format: "number" },
  social_spend: { format: "currency" },
  "actions:lead": { format: "number" },
  "actions:onsite_conversion.lead_grouped": { format: "number" },
  "actions:purchase": { format: "number" },
  "actions:omni_purchase": { format: "number" },
  "actions:link_click": { format: "number" },
  "actions:landing_page_view": { format: "number" },
  "actions:post_engagement": { format: "number" },
  "actions:page_engagement": { format: "number" },
  "actions:video_view": { format: "number" },
  "actions:omni_add_to_cart": { format: "number" },
  "actions:omni_view_content": { format: "number" },
  "actions:omni_complete_registration": { format: "number" },
  "actions:omni_initiated_checkout": { format: "number" },
  "action_values:purchase": { format: "currency" },
  "action_values:omni_purchase": { format: "currency" },
  "cost_per_action_type:lead": { format: "currency", compute: "avg" },
  "cost_per_action_type:purchase": { format: "currency", compute: "avg" },
  "cost_per_inline_link_click": { format: "currency", compute: "avg" },
  "cost_per_unique_click": { format: "currency", compute: "avg" },
  "purchase_roas:purchase": { format: "number", compute: "avg" },
};

export default function ReportView({
  adData, selectedColumns, customColumns, fbColumns, groupBy = "none", teamMembers,
}: ReportViewProps) {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Column label map
  const colLabelMap = new Map(fbColumns.map(c => [c.key, c.label]));
  customColumns.forEach(c => colLabelMap.set(c.key, c.label));

  // Visible columns = checked defaults + active custom
  const activeCustomKeys = customColumns.filter(c => c.is_active).map(c => c.key);
  const visibleColumns = [...selectedColumns, ...activeCustomKeys];

  // Filter by date
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

  // Aggregate summary ONLY for visible columns
  function getSummaryBoxes(rows: typeof adData): { label: string; value: string; color?: string }[] {
    const boxes: { label: string; value: string; color?: string }[] = [];

    // For each visible column, check if it's summable
    for (const colKey of visibleColumns) {
      const meta = SUMMABLE_KEYS[colKey];
      const customCol = customColumns.find(c => c.key === colKey);
      const label = colLabelMap.get(colKey) || colKey;

      if (meta) {
        // Default column — aggregate from data
        let total = 0;
        let count = 0;
        rows.forEach(r => {
          const val = parseFloat(String(r.data[colKey] || 0));
          if (!isNaN(val)) { total += val; count++; }
        });

        const value = meta.compute === "avg" && count > 0 ? total / count : total;

        if (meta.format === "currency") {
          boxes.push({ label, value: `RM ${value.toFixed(2)}` });
        } else if (meta.format === "percentage") {
          boxes.push({ label, value: `${value.toFixed(2)}%`, color: value > 2 ? "green" : value > 1 ? "yellow" : "red" });
        } else {
          boxes.push({ label, value: Math.round(value).toLocaleString() });
        }
      } else if (customCol?.formula) {
        // Custom column — evaluate formula with aggregated data
        // Aggregate all row data first
        const aggData: Record<string, number> = {};
        rows.forEach(r => {
          for (const [k, v] of Object.entries(r.data)) {
            const num = parseFloat(String(v || 0));
            if (!isNaN(num)) aggData[k] = (aggData[k] || 0) + num;
          }
        });
        const result = evaluateFormula(customCol.formula, aggData);
        boxes.push({ label, value: result !== null ? result.toFixed(2) : "—" });
      }
    }

    // Always show record count
    boxes.push({ label: "Records", value: String(rows.length) });

    return boxes;
  }

  // Group data
  function getGroups() {
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

      {/* No columns warning */}
      {noColumnsSelected && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-6 text-sm">
          No columns selected. Go to <a href="/settings/columns" className="font-bold underline">Column Settings</a> to check default columns,
          or create <a href="/settings/custom-columns" className="font-bold underline">Custom Columns</a>.
        </div>
      )}

      {/* Report Sections */}
      {groups.map((group, gi) => {
        const boxes = getSummaryBoxes(group.rows);
        return (
          <div key={gi} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-bold text-gray-800">{group.title}</h2>
              {group.staffId && <code className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{group.staffId}</code>}
            </div>

            {/* Summary Boxes — only checked columns */}
            {boxes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {boxes.map((box, bi) => (
                  <SummaryBox key={bi} label={box.label} value={box.value} color={box.color} />
                ))}
              </div>
            )}

            {/* Data Table */}
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

function SummaryBox({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = { green: "text-emerald-600", yellow: "text-amber-600", red: "text-red-500" };
  return (
    <div className="stat-card bg-white rounded-xl p-3">
      <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
      <p className={`text-lg font-bold ${color ? colors[color] || "" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
