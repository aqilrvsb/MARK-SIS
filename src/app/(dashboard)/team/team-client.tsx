"use client";

import { createTeamMember, deleteTeamMember } from "@/lib/actions";
import { UserProfile } from "@/lib/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentUser: UserProfile;
  members: UserProfile[];
  leaders: UserProfile[];
}

export default function TeamClient({ currentUser, members, leaders }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const roleBadge: Record<string, string> = {
    bod: "bg-purple-100 text-purple-700",
    leader: "bg-blue-100 text-blue-700",
    marketer: "bg-green-100 text-green-700",
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await createTeamMember(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const result = await deleteTeamMember(userId);
    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  // Group members
  const bods = members.filter((m) => m.role === "bod");
  const leaderList = members.filter((m) => m.role === "leader");
  const marketers = members.filter((m) => m.role === "marketer");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">{members.length} members</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
              <input
                type="text"
                name="id_staff"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-bold tracking-wider"
                placeholder="e.g. ESL-001 or ESM-001"
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {currentUser.role === "bod" && <option value="leader">Leader</option>}
                <option value="marketer">Marketer</option>
              </select>
            </div>
            {currentUser.role === "bod" && leaders.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Leader (for marketers)
                </label>
                <select
                  name="leader_id"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No leader --</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Member"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Staff ID</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Leader</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              {currentUser.role === "bod" && (
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => {
              const leader = leaders.find((l) => l.id === member.leader_id);
              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">{member.id_staff || "—"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleBadge[member.role]}`}>
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{leader?.full_name || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold ${member.is_active ? "text-green-600" : "text-red-500"}`}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {currentUser.role === "bod" && (
                    <td className="px-6 py-4 text-right">
                      {member.id !== currentUser.id && (
                        <button
                          onClick={() => handleDelete(member.id, member.full_name)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
