"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getFormulaHelp } from "@/lib/formula";

interface CustomColumn {
  id: string;
  key: string;
  label: string;
  formula: string | null;
  data_type: string;
  is_active: boolean;
  created_at: string;
}

interface FbColumn {
  key: string;
  label: string;
  category: string;
}

export default function CustomColumnsClient({ companyId }: { companyId: string }) {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [fbColumns, setFbColumns] = useState<FbColumn[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: custom }, { data: fb }] = await Promise.all([
      supabase.from("custom_columns").select("*").eq("company_id", companyId).order("created_at"),
      supabase.from("fb_columns").select("key, label, category").order("category").order("label"),
    ]);
    setColumns((custom || []).map(c => ({ ...c, is_active: c.is_active ?? true })));
    setFbColumns(fb || []);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const label = (form.get("label") as string).trim();
    const formula = (form.get("formula") as string).trim();
    const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    if (!label || !formula) { setError("Name and formula are required"); setLoading(false); return; }

    const { error: insertError } = await supabase.from("custom_columns").insert({
      company_id: companyId,
      key,
      label,
      formula,
      data_type: "number",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      loadData();
    }
    setLoading(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await supabase.from("custom_columns").update({ is_active: !currentActive }).eq("id", id);
    setColumns(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c));
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete custom column "${label}"?`)) return;
    await supabase.from("custom_columns").delete().eq("id", id);
    loadData();
  }

  const filteredFb = fbColumns.filter(c =>
    c.key.toLowerCase().includes(search.toLowerCase()) ||
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Columns</h1>
          <p className="text-gray-500">Create calculated columns with formulas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-premium px-4 py-2 text-white font-semibold rounded-lg text-sm">
          {showForm ? "Cancel" : "+ New Custom Column"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Column Name</label>
              <input type="text" name="label" required placeholder="e.g. Cost Per Lead"
                className="input-premium w-full px-4 py-2 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Formula</label>
              <input type="text" name="formula" required
                placeholder="e.g. {spend} / {actions:lead}"
                className="input-premium w-full px-4 py-2 rounded-lg text-sm font-mono" />
              <p className="text-xs text-gray-400 mt-1">
                Use <code className="bg-gray-100 px-1 rounded">{"{column_key}"}</code> to reference columns.
                Supports <code className="bg-gray-100 px-1 rounded">+ - * / ()</code> and numbers.
              </p>
            </div>

            {/* Column Key Reference */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Available Column Keys (click to copy)</p>
              <input type="text" placeholder="Search columns..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 border rounded text-xs mb-2" />
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredFb.slice(0, 30).map(c => (
                  <button key={c.key} type="button"
                    onClick={() => navigator.clipboard.writeText(`{${c.key}}`)}
                    className="block w-full text-left px-2 py-1 text-xs rounded hover:bg-indigo-50 hover:text-indigo-700">
                    <code className="text-indigo-600">{`{${c.key}}`}</code>
                    <span className="text-gray-400 ml-2">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-premium px-6 py-2 text-white font-semibold rounded-lg text-sm disabled:opacity-50">
              {loading ? "Creating..." : "Create Custom Column"}
            </button>
          </form>

          <pre className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded">{getFormulaHelp()}</pre>
        </div>
      )}

      {/* Existing Custom Columns */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Key</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Formula</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {columns.map(col => (
              <tr key={col.id} className={`hover:bg-gray-50 ${!col.is_active ? "opacity-50" : ""}`}>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(col.id, col.is_active)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${col.is_active ? "bg-indigo-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${col.is_active ? "left-5" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{col.label}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{col.key}</td>
                <td className="px-6 py-4 text-sm font-mono text-indigo-600">{col.formula || "—"}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(col.id, col.label)}
                    className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                </td>
              </tr>
            ))}
            {columns.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No custom columns yet. Create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
