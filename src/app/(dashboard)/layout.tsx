import { getCurrentUser, logout } from "@/lib/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    // Don't redirect here — middleware handles auth.
    // If user profile not found, sign out and redirect to login
    const supabase = await (await import("@/lib/supabase-server")).createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const roleBadge: Record<string, string> = {
    bod: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    leader: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    marketer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col flex-shrink-0 fixed h-full z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/dashboard" className="text-xl font-black tracking-tight text-gradient">
            MARK-SIS
          </Link>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${roleBadge[user.role]}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 mb-2">Overview</p>
          <NavLink href="/dashboard" label="Dashboard" icon="&#9632;" />
          <NavLink href="/dashboard/reports" label="Reports" icon="&#9776;" />
          <NavLink href="/dashboard/compare" label="Compare" icon="&#8644;" />

          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 mt-5 mb-2">Analytics</p>
          <NavLink href="/scorecard" label="Scorecard" icon="&#9733;" />
          <NavLink href="/creatives" label="Creatives" icon="&#9998;" />
          <NavLink href="/dashboard/funnel" label="Funnel" icon="&#9660;" />
          <NavLink href="/dashboard/health" label="Health" icon="&#9829;" />

          {(user.role === "bod" || user.role === "leader") && (
            <>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 mt-5 mb-2">Manage</p>
              <NavLink href="/team" label="Team" icon="&#128101;" />
              <NavLink href="/dashboard/import" label="Import Data" icon="&#8682;" />
            </>
          )}

          {user.role === "bod" && (
            <>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 mt-5 mb-2">Settings</p>
              <NavLink href="/settings/kpi" label="KPI Targets" icon="&#127919;" />
              <NavLink href="/settings/alerts" label="Alerts" icon="&#9888;" />
              <NavLink href="/settings/brands" label="Brands" icon="&#9881;" />
              <NavLink href="/settings/columns" label="Columns" icon="&#9783;" />
              <NavLink href="/settings/clients" label="Client Sharing" icon="&#128279;" />
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <form action={logout}>
            <button className="w-full text-left sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <span>&#8592;</span>
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} prefetch={true} className="sidebar-link">
      <span className="text-base w-5 text-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
