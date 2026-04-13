"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; rowCount?: number } | null>(null);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [marketers, setMarketers] = useState<{ id: string; full_name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [selectedMarketer, setSelectedMarketer] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [preview, setPreview] = useState<{ columns: string[]; rowCount: number } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    const { data: m } = await supabase.from("users").select("id, full_name").in("role", ["marketer", "leader"]);
    setMarketers(m || []);
    const { data: b } = await supabase.from("brands").select("id, name");
    setBrands(b || []);
  }

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Handle quoted CSV properly
    function parseLine(line: string): string[] {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = parseLine(lines[0]).map((h) => h.replace(/^\uFEFF/, ""));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length < 2) continue;
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h && values[idx] !== undefined) {
          row[h] = values[idx];
        }
      });
      rows.push(row);
    }

    return rows;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const text = await f.text();
    let rows: Record<string, unknown>[];

    if (f.name.endsWith(".json")) {
      const json = JSON.parse(text);
      rows = Array.isArray(json) ? json : Object.values(json).flat() as Record<string, unknown>[];
    } else {
      rows = parseCSV(text);
    }

    if (rows.length > 0) {
      setPreview({
        columns: Object.keys(rows[0]),
        rowCount: rows.length,
      });
    }
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      let rows: Record<string, unknown>[];

      if (file.name.endsWith(".json")) {
        const json = JSON.parse(text);
        rows = Array.isArray(json) ? json : Object.values(json).flat() as Record<string, unknown>[];
      } else {
        rows = parseCSV(text);
      }

      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          fileName: file.name,
          dateStart,
          dateEnd,
          marketerId: selectedMarketer || undefined,
          brandId: selectedBrand || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : "Upload failed" });
    }

    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Data</h1>
      <p className="text-gray-500 mb-6">Upload CSV or JSON from FB Ads Manager extension</p>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        {/* Assign to */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Marketer</label>
            <select value={selectedMarketer} onChange={(e) => setSelectedMarketer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">-- Myself --</option>
              {marketers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">-- No brand --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File (CSV or JSON)</label>
          <input type="file" accept=".csv,.json" onChange={handleFileSelect}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-700">Preview</p>
            <p className="text-sm text-blue-600">{preview.rowCount} rows, {preview.columns.length} columns</p>
            <p className="text-xs text-blue-500 mt-1 truncate">
              Columns: {preview.columns.slice(0, 10).join(", ")}{preview.columns.length > 10 ? ` ...+${preview.columns.length - 10} more` : ""}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button onClick={handleUpload} disabled={!file || loading || !dateStart || !dateEnd}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Importing..." : "Upload & Import"}
        </button>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-4 ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {result.success
              ? `Imported ${result.rowCount} rows successfully!`
              : `Error: ${result.error}`}
          </div>
        )}
      </div>
    </div>
  );
}
