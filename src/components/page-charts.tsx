"use client";

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import { evaluateFormula } from "@/lib/formula";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ChartConfig {
  id: number;
  title: string;
  metric1: string;
  metric2: string;
}

interface PageChartsProps {
  pageKey: string;
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
  adData, availableMetrics, customColumns, savedCharts,
}: PageChartsProps) {
  const charts = savedCharts || [];
  const metricMap = new Map(availableMetrics.map(m => [m.key, m.label]));

  if (charts.length === 0 || adData.length === 0) return null;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {charts.map(chart => (
        <div key={chart.id} className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-xs font-bold text-gray-600 mb-3">{chart.title}</h3>
          <Line data={buildChartData(chart)} options={chartOptions} />
        </div>
      ))}
    </div>
  );
}
