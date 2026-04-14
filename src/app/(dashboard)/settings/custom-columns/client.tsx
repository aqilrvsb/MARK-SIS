"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

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
}

export default function CustomColumnsClient({ companyId }: { companyId: string }) {
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [checkedColumns, setCheckedColumns] = useState<FbColumn[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [formula, setFormula] = useState("");
  const formulaRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: custom }, { data: allFb }, { data: colView }] = await Promise.all([
      supabase.from("custom_columns").select("*").eq("company_id", companyId).order("created_at"),
      supabase.from("fb_columns").select("key, label").order("label"),
      supabase.from("company_column_views").select("column_order").eq("company_id", companyId).eq("is_default", true).maybeSingle(),
    ]);

    setColumns((custom || []).map(c => ({ ...c, is_active: c.is_active ?? true })));

    // Only show columns that are checked in default view
    const checkedKeys = (colView?.column_order as string[]) || [];
    const filtered = (allFb || []).filter(c => checkedKeys.includes(c.key));
    setCheckedColumns(filtered);
  }

  function insertIntoFormula(key: string) {
    const insertion = `{${key}}`;
    const input = formulaRef.current;
    if (input) {
      const start = input.selectionStart || formula.length;
      const end = input.selectionEnd || formula.length;
      const newFormula = formula.slice(0, start) + insertion + formula.slice(end);
      setFormula(newFormula);
      // Set cursor after insertion
      setTimeout(() => {
        input.focus();
        const newPos = start + insertion.length;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setFormula(formula + insertion);
    }
  }

  function insertOperator(op: string) {
    const input = formulaRef.current;
    if (input) {
      const start = input.selectionStart || formula.length;
      const end = input.selectionEnd || formula.length;
      const newFormula = formula.slice(0, start) + ` ${op} ` + formula.slice(end);
      setFormula(newFormula);
      setTimeout(() => {
        input.focus();
        const newPos = start + op.length + 2;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setFormula(formula + ` ${op} `);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const label = (form.get("label") as string).trim();
    const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    if (!label || !formula) { setError("Name and formula are required"); setLoading(false); return; }

    const { error: insertError } = await supabase.from("custom_columns").insert({
      company_id: companyId, key, label, formula, data_type: "number",
    });

    if (insertError) { setError(insertError.message); }
    else { setShowForm(false); setFormula(""); loadData(); }
    setLoading(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await supabase.from("custom_columns").update({ is_active: !currentActive }).eq("id", id);
    setColumns(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c));
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"?`)) return;
    await supabase.from("custom_columns").delete().eq("id", id);
    loadData();
  }

  const filteredCols = checkedColumns.filter(c =>
    c.key.toLowerCase().includes(search.toLowerCase()) ||
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="dashboard-header px-6 py-5 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><span className="text-gradient">Custom Columns</span></h1>
          <p className="text-gray-500 text-sm">Create calculated columns with formulas</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); setFormula(""); }}
          className="btn-premium px-4 py-2 text-white font-semibold rounded-lg text-sm">
          {showForm ? "Cancel" : "+ New Custom Column"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-6">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Column Name</label>
              <input type="text" name="label" required placeholder="e.g. Cost Per Lead"
                className="input-premium w-full px-4 py-2.5 rounded-xl text-sm" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Formula</label>
              <input type="text" ref={formulaRef} value={formula} onChange={e => setFormula(e.target.value)}
                placeholder="Click columns below to build formula"
                className="input-premium w-full px-4 py-2.5 rounded-xl text-sm font-mono" />

              {/* Operator buttons */}
              <div className="flex gap-2 mt-2">
                {["+", "-", "*", "/", "(", ")"].map(op => (
                  <button key={op} type="button" onClick={() => insertOperator(op)}
                    className="w-10 h-8 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 font-bold text-sm transition-all border border-gray-200 hover:border-purple-300">
                    {op}
                  </button>
                ))}
                <button type="button" onClick={() => setFormula("")}
                  className="px-3 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold transition-all border border-red-200">
                  Clear
                </button>
              </div>
            </div>

            {/* Available Columns — only checked defaults */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Columns
                <span className="text-xs text-gray-400 font-normal ml-2">({checkedColumns.length} checked columns — click to insert)</span>
              </label>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="input-premium w-full px-3 py-2 rounded-lg text-xs mb-3" />

              {checkedColumns.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
                  No columns checked. Go to <a href="/settings/columns" className="font-bold underline">Columns</a> to select default columns first.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredCols.map(c => (
                    <button key={c.key} type="button" onClick={() => insertIntoFormula(c.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || !formula}
              className="btn-premium w-full py-3 text-white font-bold rounded-xl text-sm disabled:opacity-50">
              {loading ? "Creating..." : "Create Custom Column"}
            </button>
          </form>
        </div>
      )}

      {/* Existing Custom Columns */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full table-premium">
          <thead>
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Formula</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {columns.map(col => (
              <tr key={col.id} className={`hover:bg-purple-50/30 ${!col.is_active ? "opacity-40" : ""}`}>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(col.id, col.is_active)}
                    className={`w-11 h-6 rounded-full relative transition-all ${col.is_active ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${col.is_active ? "left-5" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{col.label}</td>
                <td className="px-6 py-4 text-sm font-mono text-purple-600">{col.formula || "—"}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(col.id, col.label)}
                    className="text-red-400 hover:text-red-600 text-sm font-semibold transition-colors">Delete</button>
                </td>
              </tr>
            ))}
            {columns.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No custom columns yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
