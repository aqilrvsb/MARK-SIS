"use client";

import { createTeamMember, deleteTeamMember, updateTeamMember } from "@/lib/actions";
import { UserProfile } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentUser: UserProfile;
  members: UserProfile[];
  leaders: UserProfile[];
}

export default function TeamClient({ currentUser, members, leaders }: Props) {
  const [tab, setTab] = useState<"leader" | "marketer">("leader");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Filter out BOD from display
  const leaderList = members.filter(m => m.role === "leader");
  const marketerList = members.filter(m => m.role === "marketer");

  // Count marketers per leader
  const marketerCountMap = new Map<string, number>();
  marketerList.forEach(m => {
    if (m.leader_id) marketerCountMap.set(m.leader_id, (marketerCountMap.get(m.leader_id) || 0) + 1);
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    // Auto-generate email from staff ID
    const staffId = (formData.get("id_staff") as string).toUpperCase().trim();
    formData.set("email", `${staffId.toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.hackdata.app`);
    const result = await createTeamMember(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowCreate(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateTeamMember(editUser.id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditUser(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const result = await deleteTeamMember(userId);
    if (result?.error) alert(result.error);
    else router.refresh();
  }

  const tabs = [
    { id: "leader" as const, label: "Leaders", count: leaderList.length },
    { id: "marketer" as const, label: "Marketers", count: marketerList.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">{leaderList.length} leaders, {marketerList.length} marketers</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(""); }}
          className="btn-premium px-4 py-2 text-white font-semibold rounded-lg text-sm">
          + Add Member
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Leader Tab */}
      {tab === "leader" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Staff ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">WhatsApp</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total Marketer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaderList.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">{member.id_staff || "—"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{member.whatsapp_number || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {marketerCountMap.get(member.id) || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${member.is_active ? "text-emerald-600" : "text-red-500"}`}>
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => { setEditUser(member); setError(""); }} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">Edit</button>
                    <button onClick={() => handleDelete(member.id, member.full_name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {leaderList.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No leaders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Marketer Tab */}
      {tab === "marketer" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Staff ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">WhatsApp</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Leader</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marketerList.map(member => {
                const leader = leaders.find(l => l.id === member.leader_id);
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">{member.id_staff || "—"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{member.whatsapp_number || "—"}</td>
                    <td className="px-6 py-4">
                      {leader ? (
                        <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                          {leader.id_staff}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold ${member.is_active ? "text-emerald-600" : "text-red-500"}`}>
                        {member.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => { setEditUser(member); setError(""); }} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold">Edit</button>
                      <button onClick={() => handleDelete(member.id, member.full_name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </td>
                  </tr>
                );
              })}
              {marketerList.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No marketers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Team Member</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="full_name" required className="input-premium w-full px-4 py-2.5 rounded-xl text-sm" placeholder="Ahmad" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Staff ID</label>
                  <input type="text" name="id_staff" required className="input-premium w-full px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider" placeholder="ESL-001" style={{ textTransform: "uppercase" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <input type="password" name="password" required minLength={6} className="input-premium w-full px-4 py-2.5 rounded-xl text-sm" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                  <input type="text" name="whatsapp_number" className="input-premium w-full px-4 py-2.5 rounded-xl text-sm" placeholder="60123456789" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                  <select name="role" required className="input-premium w-full px-4 py-2.5 rounded-xl text-sm">
                    {currentUser.role === "bod" && <option value="leader">Leader</option>}
                    <option value="marketer">Marketer</option>
                  </select>
                </div>
                {currentUser.role === "bod" && leaders.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assign to Leader</label>
                    <select name="leader_id" className="input-premium w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="">-- No leader --</option>
                      {leaders.map(l => <option key={l.id} value={l.id}>{l.full_name} ({l.id_staff})</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" disabled={loading}
                className="btn-premium w-full py-3 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {loading ? "Creating..." : "Create Member"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit — {editUser.full_name}</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Staff ID</label>
                <input type="text" disabled value={editUser.id_staff || ""} className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-100 text-gray-500 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" name="full_name" defaultValue={editUser.full_name} className="input-premium w-full px-4 py-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                <input type="text" name="whatsapp_number" defaultValue={editUser.whatsapp_number || ""} className="input-premium w-full px-4 py-2.5 rounded-xl text-sm" placeholder="60123456789" />
              </div>
              {editUser.role === "marketer" && leaders.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assign to Leader</label>
                  <select name="leader_id" defaultValue={editUser.leader_id || ""} className="input-premium w-full px-4 py-2.5 rounded-xl text-sm">
                    <option value="">-- No leader --</option>
                    {leaders.map(l => <option key={l.id} value={l.id}>{l.full_name} ({l.id_staff})</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select name="is_active" defaultValue={editUser.is_active ? "true" : "false"} className="input-premium w-full px-4 py-2.5 rounded-xl text-sm">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="btn-premium w-full py-3 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
