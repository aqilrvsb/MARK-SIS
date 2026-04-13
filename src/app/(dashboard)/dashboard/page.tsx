import { getCurrentUser } from "@/lib/actions";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Get team stats
  const { count: teamCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user.company_id);

  // Get import count
  const { count: importCount } = await supabase
    .from("data_imports")
    .select("*", { count: "exact", head: true });

  // Get ad data count
  const { count: dataCount } = await supabase
    .from("ad_data")
    .select("*", { count: "exact", head: true });

  // Get company name
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", user.company_id)
    .single();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          {company?.name} — Welcome, {user.full_name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500 mb-1">Team Members</p>
          <p className="text-3xl font-bold text-gray-900">{teamCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500 mb-1">Data Imports</p>
          <p className="text-3xl font-bold text-gray-900">{importCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500 mb-1">Ad Records</p>
          <p className="text-3xl font-bold text-gray-900">{dataCount || 0}</p>
        </div>
      </div>

      {/* Role-based info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {(user.role === "bod" || user.role === "leader") && (
            <a
              href="/team"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
            >
              Manage Team
            </a>
          )}
          {user.role === "bod" && (
            <a
              href="/settings/columns"
              className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100"
            >
              Configure Columns
            </a>
          )}
          <a
            href="/dashboard/import"
            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
          >
            Import Data
          </a>
        </div>
      </div>
    </div>
  );
}
