"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface KpiTarget {
  id: string;
  metric: string;
  target_value: number;
  warning_threshold: number;
  danger_threshold: number;
  direction: string;
  user_id: string | null;
  users?: { full_name: string } | null;
}

export default function KpiTargetsPage() {
  const [targets, setTargets] = useState<KpiTarget[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: t } = await supabase
      .from("kpi_targets")
      .select("*, users:user_id(full_name)")
      .order("metric");
    setTargets(t || []);

    const { data: u } = await supabase
      .from("users")
      .select("id, full_name")
      .order("full_name");
    setUsers(u || []);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const userId = form.get("user_id") as string;

    const { error: err } = await supabase.from("kpi_targets").insert({
      metric: form.get("metric"),
      target_value: parseFloat(form.get("target_value") as string),
      warning_threshold: parseFloat(form.get("warning_threshold") as string),
      danger_threshold: parseFloat(form.get("danger_threshold") as string),
      direction: form.get("direction"),
      user_id: userId || null,
    });

    if (err) {
      setError(err.message);
    } else {
      setShowForm(false);
      loadData();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this KPI target?")) return;
    const { error: err } = await supabase.from("kpi_targets").delete().eq("id", id);
    if (err) {
      alert(err.message);
    } else {
      loadData();
    }
  }

  const metricLabels: Record<string, string> = {
    cpa: "CPA",
    roas: "ROAS",
    ctr: "CTR",
    cpc: "CPC",
    daily_spend: "Daily Spend",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Targets</h1>
          <p className="text-gray-500">Set performance goals and thresholds</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
        >
          {showForm ? "Cancel" : "+ Add Target"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New KPI Target</h2>
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
              <select
                name="metric"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cpa">CPA</option>
                <option value="roas">ROAS</option>
                <option value="ctr">CTR</option>
                <option value="cpc">CPC</option>
                <option value="daily_spend">Daily Spend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                name="direction"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="lower_is_better">Lower is Better</option>
                <option value="higher_is_better">Higher is Better</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
              <input
                type="number"
                name="target_value"
                step="any"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warning Threshold</label>
              <input
                type="number"
                name="warning_threshold"
                step="any"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danger Threshold</label>
              <input
                type="number"
                name="danger_threshold"
                step="any"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to User</label>
              <select
                name="user_id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Company-wide</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Target"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Targets Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {targets.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No KPI targets configured yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Target</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Warning</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Danger</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Direction</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {targets.map((target) => (
                <tr key={target.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {metricLabels[target.metric] || target.metric}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{target.target_value}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      {target.warning_threshold}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                      {target.danger_threshold}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {target.direction === "lower_is_better" ? "Lower is Better" : "Higher is Better"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {target.users?.full_name || "Company-wide"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(target.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
