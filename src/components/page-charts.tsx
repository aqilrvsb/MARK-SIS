"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import { evaluateFormula } from "@/lib/formula";
import { createClient } from "@/lib/supabase-browser";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ChartConfig {
  id: number;
  title: string;
  metric1: string;
  metric2: string;
}

interface PageChartsProps {
  pageKey: string; // e.g. "dashboard", "report_all", "report_leader", "report_marketer"
  companyId: string;
  isBod: boolean;
  adData: { data: Record<string, unknown>; date_start: string }[];
  availableMetrics: { key: string; label: string }[];
  customColumns: { key: string; label: string; formula: string | null }[];
  savedCharts: ChartConfig[] | null;
}

const COLORS = [
  { line: "rgb(99, 102, 241)", bg: "rgba(99, 102, 241, 0.1)" },
  { line: "rgb(244, 63, 94)", bg: "rgba(244, 63, 94, 0.1)" },
];

export default function PageCharts({
  pageKey, companyId, isBod, adData, availableMetrics, customColumns, savedCharts,
}: PageChartsProps) {
  const [charts, setCharts] = useState<ChartConfig[]>(savedCharts || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const metricMap = new Map(availableMetrics.map(m => [m.key, m.label]));

  function getDateSeries(metricKey: string) {
    const dateMap = new Map<string, number>();
    adData.forEach(row => {
      const date = row.date_start || "unknown";
      const customCol = customColumns.find(c => c.key === metricKey);
      let val: number;
      if (customCol?.formula) {
        val = evaluateFormula(customCol.formula, row.data) || 0;
      } else {
        val = parseFloat(String(row.data[metricKey] || 0)) || 0;
      }
      dateMap.set(date, (dateMap.get(date) || 0) + val);
    });
    const sorted = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return { labels: sorted.map(([d]) => d), values: sorted.map(([, v]) => v) };
  }

  function buildChartData(chart: ChartConfig) {
    const s1 = getDateSeries(chart.metric1);
    const s2 = getDateSeries(chart.metric2);
    return {
      labels: s1.labels.length >= s2.labels.length ? s1.labels : s2.labels,
      datasets: [
        { label: metricMap.get(chart.metric1) || chart.metric1, data: s1.values, borderColor: COLORS[0].line, backgroundColor: COLORS[0].bg, fill: true, tension: 0.4, pointRadius: 3, yAxisID: "y" },
        { label: metricMap.get(chart.metric2) || chart.metric2, data: s2.values, borderColor: COLORS[1].line, backgroundColor: COLORS[1].bg, fill: true, tension: 0.4, pointRadius: 3, yAxisID: "y1" },
      ],
    };
  }

  const chartOptions = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    plugins: { legend: { position: "top" as const, labels: { usePointStyle: true, padding: 15, font: { size: 11 } } } },
    scales: {
      y: { type: "linear" as const, position: "left" as const, grid: { color: "rgba(0,0,0,0.04)" } },
      y1: { type: "linear" as const, position: "right" as const, grid: { drawOnChartArea: false } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };

  function addChart() {
    if (charts.length >= 4) return;
    setCharts([...charts, { id: Date.now(), title: `Chart ${charts.length + 1}`, metric1: "spend", metric2: "impressions" }]);
  }

  function removeChart(id: number) { setCharts(charts.filter(c => c.id !== id)); }

  function updateChart(id: number, field: keyof ChartConfig, value: string) {
    setCharts(charts.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  async function saveConfig() {
    setSaving(true);
    await supabase.from("site_settings").upsert({
      setting_key: `charts_${companyId}_${pageKey}`,
      setting_value: charts,
    }, { onConflict: "setting_key" });
    setSaving(false);
    setEditing(false);
  }

  if (charts.length === 0 && !editing) {
    if (!isBod) return null;
    return (
      <div className="mb-6">
        <button onClick={() => { setEditing(true); addChart(); }}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 text-sm font-semibold transition">
          + Add Charts to this page
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Edit toggle for BOD */}
      {isBod && (
        <div className="flex justify-end mb-3">
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
            {editing ? "Done" : "Edit Charts"}
          </button>
        </div>
      )}

      {/* Settings inline */}
      {editing && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-indigo-700">Chart Settings — {pageKey.replace("_", " ")}</span>
            <span className="text-xs text-indigo-400">{charts.length}/4</span>
          </div>
          {charts.map((chart, idx) => (
            <div key={chart.id} className="bg-white rounded-lg p-3 mb-2 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-32">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">TITLE</label>
                <input type="text" value={chart.title} onChange={e => updateChart(chart.id, "title", e.target.value)}
                  className="input-premium w-full px-2 py-1.5 rounded text-xs" />
              </div>
              <div className="flex-1 min-w-32">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">METRIC 1</label>
                <select value={chart.metric1} onChange={e => updateChart(chart.id, "metric1", e.target.value)}
                  className="input-premium w-full px-2 py-1.5 rounded text-xs">
                  {availableMetrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-32">
                <label className="block text-[10px] font-bold text-gray-400 mb-1">METRIC 2</label>
                <select value={chart.metric2} onChange={e => updateChart(chart.id, "metric2", e.target.value)}
                  className="input-premium w-full px-2 py-1.5 rounded text-xs">
                  {availableMetrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <button onClick={() => removeChart(chart.id)} className="text-xs text-red-400 hover:text-red-600 pb-1">Remove</button>
            </div>
          ))}
          <div className="flex gap-3 mt-3">
            {charts.length < 4 && (
              <button onClick={addChart} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">+ Add Chart</button>
            )}
            <button onClick={saveConfig} disabled={saving}
              className="btn-premium px-4 py-1.5 text-white text-xs font-semibold rounded-lg ml-auto disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Render Charts — 2x2 grid */}
      {charts.length > 0 && adData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.map(chart => (
            <div key={chart.id} className="bg-white rounded-xl border shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-600 mb-3">{chart.title}</h3>
              <Line data={buildChartData(chart)} options={chartOptions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
