"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface FbColumn {
  id: number;
  key: string;
  label: string;
  category: string;
  data_type: string;
  is_default: boolean;
}

export default function ColumnsPage() {
  const [columns, setColumns] = useState<FbColumn[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: cols } = await supabase.from("fb_columns").select("*").order("category").order("label");
    setColumns(cols || []);

    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.user!.id).single();
    const { data: view } = await supabase
      .from("company_column_views")
      .select("column_order")
      .eq("company_id", profile!.company_id)
      .eq("is_default", true)
      .single();

    if (view?.column_order) {
      setSelected(view.column_order as string[]);
    } else {
      setSelected((cols || []).filter(c => c.is_default).map(c => c.key));
    }
  }

  async function handleSave() {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.user!.id).single();

    await supabase.from("company_column_views").upsert({
      company_id: profile!.company_id,
      name: "Default",
      column_order: selected,
      is_default: true,
    }, { onConflict: "company_id,name" });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleColumn(key: string) {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function selectAll() { setSelected(filtered.map(c => c.key)); }
  function selectNone() { setSelected([]); }

  const categories = ["all", ...Array.from(new Set(columns.map(c => c.category)))];
  const filtered = columns.filter(c => {
    if (category !== "all" && c.category !== category) return false;
    if (search && !c.label.toLowerCase().includes(search.toLowerCase()) && !c.key.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Column Configuration</h1>
          <p className="text-gray-500">{selected.length} of {columns.length} columns selected</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved!" : "Save Default View"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap gap-4 items-center">
        <input type="text" placeholder="Search columns..." value={search} onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-48" />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
          {categories.map(c => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>
        <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">Select All</button>
        <button onClick={selectNone} className="text-sm text-red-600 hover:underline">Clear All</button>
      </div>

      {/* Column Grid */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filtered.map(col => (
            <label key={col.key}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                selected.includes(col.key) ? "bg-blue-50" : ""
              }`}>
              <input type="checkbox" checked={selected.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="rounded border-gray-300 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{col.label}</p>
                <p className="text-xs text-gray-400 truncate">{col.key}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{col.category}</span>
            </label>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No columns match your search.</p>
        )}
      </div>
    </div>
  );
}
