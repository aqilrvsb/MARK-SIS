"use client";

import { useState, useEffect } from "react";
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

interface Props {
  adData: { data: Record<string, unknown>; marketer_id: string; date_start: string }[];
  availableMetrics: { key: string; label: string; category: string }[];
  customColumns: { key: string; label: string; formula: string | null; is_active: boolean }[];
  teamMembers: { id: string; full_name: string; role: string; id_staff: string }[];
  companyId: string;
  savedConfig: unknown;
}

const COLORS = [
  { line: "rgb(99, 102, 241)", bg: "rgba(99, 102, 241, 0.1)" },
  { line: "rgb(244, 63, 94)", bg: "rgba(244, 63, 94, 0.1)" },
  { line: "rgb(16, 185, 129)", bg: "rgba(16, 185, 129, 0.1)" },
  { line: "rgb(245, 158, 11)", bg: "rgba(245, 158, 11, 0.1)" },
];

export default function ChartsClient({ adData, availableMetrics, customColumns, companyId, savedConfig }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [charts, setCharts] = useState<ChartConfig[]>(() => {
    if (savedConfig && Array.isArray(savedConfig)) return savedConfig as ChartConfig[];
    return [
      { id: 1, title: "Spend vs Clicks", metric1: "spend", metric2: "clicks" },
    ];
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const metricMap = new Map(availableMetrics.map(m => [m.key, m.label]));

  // Group ad data by date
  function getDateSeries(metricKey: string): { labels: string[]; values: number[] } {
    const dateMap = new Map<string, number[]>();

    adData.forEach(row => {
      const date = row.date_start || "unknown";
      if (!dateMap.has(date)) dateMap.set(date, []);

      const customCol = customColumns.find(c => c.key === metricKey);
      let val: number;
      if (customCol?.formula) {
        val = evaluateFormula(customCol.formula, row.data) || 0;
      } else {
        val = parseFloat(String(row.data[metricKey] || 0)) || 0;
      }
      dateMap.get(date)!.push(val);
    });

    // Aggregate per date (sum)
    const sorted = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: sorted.map(([d]) => d),
      values: sorted.map(([, vals]) => vals.reduce((a, b) => a + b, 0)),
    };
  }

  function buildChartData(chart: ChartConfig) {
    const series1 = getDateSeries(chart.metric1);
    const series2 = getDateSeries(chart.metric2);

    return {
      labels: series1.labels.length >= series2.labels.length ? series1.labels : series2.labels,
      datasets: [
        {
          label: metricMap.get(chart.metric1) || chart.metric1,
          data: series1.values,
          borderColor: COLORS[0].line,
          backgroundColor: COLORS[0].bg,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          yAxisID: "y",
        },
        {
          label: metricMap.get(chart.metric2) || chart.metric2,
          data: series2.values,
          borderColor: COLORS[1].line,
          backgroundColor: COLORS[1].bg,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          yAxisID: "y1",
        },
      ],
    };
  }

  const chartOptions = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { position: "top" as const, labels: { usePointStyle: true, padding: 20 } },
    },
    scales: {
      y: { type: "linear" as const, position: "left" as const, grid: { color: "rgba(0,0,0,0.05)" } },
      y1: { type: "linear" as const, position: "right" as const, grid: { drawOnChartArea: false } },
      x: { grid: { display: false } },
    },
  };

  function addChart() {
    if (charts.length >= 4) return;
    setCharts([...charts, {
      id: Date.now(),
      title: `Chart ${charts.length + 1}`,
      metric1: availableMetrics[0]?.key || "spend",
      metric2: availableMetrics[1]?.key || "impressions",
    }]);
  }

  function removeChart(id: number) {
    setCharts(charts.filter(c => c.id !== id));
  }

  function updateChart(id: number, field: keyof ChartConfig, value: string) {
    setCharts(charts.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  async function saveConfig() {
    setSaving(true);
    await supabase.from("site_settings").upsert({
      setting_key: `chart_config_${companyId}`,
      setting_value: charts,
    }, { onConflict: "setting_key" });
    setSaving(false);
    setShowSettings(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Charts</h1>
        <button onClick={() => setShowSettings(!showSettings)}
          className="btn-premium px-4 py-2 text-white font-semibold rounded-lg text-sm">
          {showSettings ? "Close Settings" : "Configure Charts"}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Chart Settings</h2>
            <span className="text-xs text-gray-400">{charts.length}/4 charts</span>
          </div>

          <div className="space-y-4">
            {charts.map((chart, idx) => (
              <div key={chart.id} className="border rounded-xl p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700">Chart {idx + 1}</span>
                  {charts.length > 1 && (
                    <button onClick={() => removeChart(chart.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Title</label>
                    <input type="text" value={chart.title} onChange={e => updateChart(chart.id, "title", e.target.value)}
                      className="input-premium w-full px-3 py-2 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Metric 1 (Left axis)</label>
                    <select value={chart.metric1} onChange={e => updateChart(chart.id, "metric1", e.target.value)}
                      className="input-premium w-full px-3 py-2 rounded-lg text-sm">
                      {availableMetrics.map(m => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Metric 2 (Right axis)</label>
                    <select value={chart.metric2} onChange={e => updateChart(chart.id, "metric2", e.target.value)}
                      className="input-premium w-full px-3 py-2 rounded-lg text-sm">
                      {availableMetrics.map(m => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            {charts.length < 4 && (
              <button onClick={addChart} className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
                + Add Chart
              </button>
            )}
            <button onClick={saveConfig} disabled={saving}
              className="btn-premium px-6 py-2 text-white font-semibold rounded-lg text-sm ml-auto disabled:opacity-50">
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* Charts Grid — 2 columns layout (col-6 col-6) */}
      {adData.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          No data yet. Import data to see charts.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map(chart => (
            <div key={chart.id} className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4">{chart.title}</h3>
              <Line data={buildChartData(chart)} options={chartOptions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
