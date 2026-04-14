"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: string;
  is_active: boolean;
}

interface AlertHistory {
  id: string;
  rule_name: string;
  metric: string;
  actual_value: number;
  threshold: number;
  severity: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AlertsClient({ companyId }: { companyId: string }) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: r } = await supabase
      .from("alert_rules")
      .select("*")
      .order("created_at", { ascending: false });
    setRules(r || []);

    const { data: h } = await supabase
      .from("alert_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(h || []);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const { error: err } = await supabase.from("alert_rules").insert({
      name: form.get("name"),
      metric: form.get("metric"),
      condition: form.get("condition"),
      threshold: parseFloat(form.get("threshold") as string),
      severity: form.get("severity"),
      is_active: true,
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
    if (!confirm("Delete this alert rule?")) return;
    const { error: err } = await supabase.from("alert_rules").delete().eq("id", id);
    if (err) {
      alert(err.message);
    } else {
      loadData();
    }
  }

  const severityColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Rules</h1>
          <p className="text-gray-500">Configure metric alerts and thresholds</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
        >
          {showForm ? "Cancel" : "+ Add Rule"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Alert Rule</h2>
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. High CPA Alert"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                <option value="daily_spend">Daily Spend</option>
                <option value="frequency">Frequency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                name="condition"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
              <input
                type="number"
                name="threshold"
                step="any"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                name="severity"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Rule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No alert rules configured yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Threshold</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 uppercase">{rule.metric}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 capitalize">{rule.condition}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{rule.threshold}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        severityColors[rule.severity] || severityColors.info
                      }`}
                    >
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(rule.id)}
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

      {/* Alert History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alert History</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No alerts triggered yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-6 py-4 flex items-center justify-between ${
                    !alert.is_read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                        severityColors[alert.severity] || severityColors.info
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.rule_name || alert.metric.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {alert.message || `${alert.metric} is ${alert.actual_value} (threshold: ${alert.threshold})`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 ml-4 shrink-0">
                    {new Date(alert.created_at).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
