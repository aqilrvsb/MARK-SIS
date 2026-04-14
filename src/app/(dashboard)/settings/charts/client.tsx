"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface ChartConfig {
  id: number;
  title: string;
  metric1: string;
  metric2: string;
}

interface Props {
  companyId: string;
  availableMetrics: { key: string; label: string }[];
  savedConfigs: Record<string, unknown[]>;
}

const PAGES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "report_all", label: "Report All" },
  { key: "report_leader", label: "Report Leader" },
  { key: "report_marketer", label: "Report Marketer" },
];

export default function ChartsConfigClient({ companyId, availableMetrics, savedConfigs }: Props) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [configs, setConfigs] = useState<Record<string, ChartConfig[]>>(() => {
    const initial: Record<string, ChartConfig[]> = {};
    PAGES.forEach(p => { initial[p.key] = (savedConfigs[p.key] || []) as ChartConfig[]; });
    return initial;
  });
  const [saving, setSaving] = useState<string | null>(null);

  const supabase = createClient();
  const charts = configs[activeTab] || [];

  function addChart() {
    if (charts.length >= 4) return;
    setConfigs({
      ...configs,
      [activeTab]: [...charts, { id: Date.now(), title: `Chart ${charts.length + 1}`, metric1: availableMetrics[0]?.key || "spend", metric2: availableMetrics[1]?.key || "impressions" }],
    });
  }

  function removeChart(id: number) {
    setConfigs({ ...configs, [activeTab]: charts.filter(c => c.id !== id) });
  }

  function updateChart(id: number, field: keyof ChartConfig, value: string) {
    setConfigs({ ...configs, [activeTab]: charts.map(c => c.id === id ? { ...c, [field]: value } : c) });
  }

  async function saveConfig(pageKey: string) {
    setSaving(pageKey);
    await supabase.from("site_settings").upsert({
      setting_key: `charts_${companyId}_${pageKey}`,
      setting_value: configs[pageKey],
    }, { onConflict: "setting_key" });
    setSaving(null);
  }

  async function saveAll() {
    setSaving("all");
    for (const page of PAGES) {
      await supabase.from("site_settings").upsert({
        setting_key: `charts_${companyId}_${page.key}`,
        setting_value: configs[page.key],
      }, { onConflict: "setting_key" });
    }
    setSaving(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart Configuration</h1>
          <p className="text-gray-500">Configure up to 4 charts per page (2x2 grid)</p>
        </div>
        <button onClick={saveAll} disabled={saving !== null}
          className="btn-premium px-5 py-2 text-white font-semibold rounded-lg text-sm disabled:opacity-50">
          {saving === "all" ? "Saving..." : "Save All Pages"}
        </button>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {PAGES.map(p => (
          <button key={p.key} onClick={() => setActiveTab(p.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === p.key ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {p.label}
            <span className="ml-1 text-xs text-gray-400">({(configs[p.key] || []).length})</span>
          </button>
        ))}
      </div>

      {/* Charts for active tab */}
      <div className="space-y-3 mb-4">
        {charts.map((chart, idx) => (
          <div key={chart.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">Chart {idx + 1}</span>
              <button onClick={() => removeChart(chart.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">TITLE</label>
                <input type="text" value={chart.title} onChange={e => updateChart(chart.id, "title", e.target.value)}
                  className="input-premium w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">METRIC 1 (Left)</label>
                <select value={chart.metric1} onChange={e => updateChart(chart.id, "metric1", e.target.value)}
                  className="input-premium w-full px-3 py-2 rounded-lg text-sm">
                  {availableMetrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">METRIC 2 (Right)</label>
                <select value={chart.metric2} onChange={e => updateChart(chart.id, "metric2", e.target.value)}
                  className="input-premium w-full px-3 py-2 rounded-lg text-sm">
                  {availableMetrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {charts.length < 4 && (
          <button onClick={addChart}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 font-semibold">
            + Add Chart
          </button>
        )}
        <button onClick={() => saveConfig(activeTab)} disabled={saving !== null}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 disabled:opacity-50 ml-auto">
          {saving === activeTab ? "Saving..." : `Save ${PAGES.find(p => p.key === activeTab)?.label}`}
        </button>
      </div>

      {availableMetrics.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mt-6 text-sm">
          No metrics available. Go to <a href="/settings/columns" className="font-bold underline">Columns</a> to check some columns first.
        </div>
      )}

      {/* Preview layout */}
      <div className="mt-8 border-t pt-6">
        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Preview Layout — {PAGES.find(p => p.key === activeTab)?.label}</p>
        <div className="grid grid-cols-2 gap-3">
          {charts.map((chart, i) => (
            <div key={i} className="bg-white rounded-xl border border-dashed border-indigo-200 p-4 h-24 flex items-center justify-center">
              <span className="text-xs text-indigo-400 font-semibold">{chart.title}</span>
            </div>
          ))}
          {charts.length === 0 && (
            <div className="col-span-2 bg-gray-50 rounded-xl border border-dashed p-8 text-center text-gray-300 text-sm">
              No charts configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
