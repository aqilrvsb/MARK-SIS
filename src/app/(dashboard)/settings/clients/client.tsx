"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface ClientShare {
  id: string;
  client_name: string;
  client_email: string;
  share_token: string;
  brand_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface Brand {
  id: string;
  name: string;
}

export default function ClientSharesClient({ companyId }: { companyId: string }) {
  const [shares, setShares] = useState<ClientShare[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: s } = await supabase.from("client_shares").select("*").order("created_at", { ascending: false });
    setShares(s || []);
    const { data: b } = await supabase.from("brands").select("id, name");
    setBrands(b || []);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    await supabase.from("client_shares").insert({
      company_id: companyId,
      client_name: form.get("client_name"),
      client_email: form.get("client_email") || null,
      brand_id: form.get("brand_id") || null,
      expires_at: form.get("expires_at") || null,
    });

    setShowForm(false);
    setLoading(false);
    loadData();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("client_shares").update({ is_active: !current }).eq("id", id);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client share link?")) return;
    await supabase.from("client_shares").delete().eq("id", id);
    loadData();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Sharing</h1>
          <p className="text-gray-500">Create read-only dashboard links for clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm">
          {showForm ? "Cancel" : "+ Create Share Link"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input type="text" name="client_name" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Client Company" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Email (optional)</label>
              <input type="email" name="client_email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="client@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand (optional)</label>
              <select name="brand_id" className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">-- All brands --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires (optional)</label>
              <input type="date" name="expires_at"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Creating..." : "Create Share Link"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Share Link</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Expires</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shares.map(share => (
              <tr key={share.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{share.client_name}</p>
                  {share.client_email && <p className="text-xs text-gray-500">{share.client_email}</p>}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => copyLink(share.share_token)}
                    className="text-xs text-blue-600 hover:underline font-mono">
                    {copied === share.share_token ? "Copied!" : `/shared/${share.share_token.slice(0, 12)}...`}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleActive(share.id, share.is_active)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full cursor-pointer ${share.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {share.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {share.expires_at ? new Date(share.expires_at).toLocaleDateString() : "Never"}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(share.id)} className="text-red-500 hover:text-red-700 text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {shares.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No share links yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
