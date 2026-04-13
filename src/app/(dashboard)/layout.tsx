import { getCurrentUser, logout } from "@/lib/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roleBadge = {
    bod: "bg-purple-100 text-purple-700",
    leader: "bg-blue-100 text-blue-700",
    marketer: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-blue-600">
              MARK-SIS
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              {(user.role === "bod" || user.role === "leader") && (
                <Link href="/team" className="text-gray-600 hover:text-gray-900">
                  Team
                </Link>
              )}
              {user.role === "bod" && (
                <Link href="/settings/columns" className="text-gray-600 hover:text-gray-900">
                  Columns
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleBadge[user.role]}`}>
              {user.role.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <form action={logout}>
              <button className="text-sm text-red-500 hover:text-red-700">
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
