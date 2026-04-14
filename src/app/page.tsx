import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white overflow-hidden">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tight text-gradient">MARK-SIS</div>
        <div className="flex gap-4">
          <Link href="/login" className="btn-premium px-5 py-2 text-sm font-bold rounded-lg">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 pt-16 pb-32 max-w-7xl mx-auto">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 tracking-wide">
            MARKETING INTELLIGENCE PLATFORM
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
            Turn Facebook Ads
            <br />
            <span className="text-gradient">into Growth</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Import 238+ metrics from Facebook Ads Manager. Track team performance.
            Set KPI targets. Get automated alerts. All in one beautiful dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-premium px-8 py-3.5 text-sm font-bold rounded-xl">
              Get Started Free
            </Link>
            <Link href="/login" className="px-8 py-3.5 text-sm font-semibold rounded-xl border border-white/20 hover:bg-white/5 transition">
              View Demo
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          <FeatureCard
            icon="&#9776;"
            title="238+ Metrics"
            desc="Import every Facebook Ads column — campaigns, adsets, ads, insights, creatives, and link previews."
          />
          <FeatureCard
            icon="&#128101;"
            title="Team Hierarchy"
            desc="BOD sees everything. Leaders see their team. Marketers see their own data. Role-based access built in."
          />
          <FeatureCard
            icon="&#127919;"
            title="KPI Targets"
            desc="Set CPA, ROAS, CTR goals per marketer. Auto-score performance as Excellent, Good, Warning, or Danger."
          />
          <FeatureCard
            icon="&#9888;"
            title="Smart Alerts"
            desc="Get notified when CPA spikes, budget depletes, or campaigns stop spending. Never miss a problem."
          />
          <FeatureCard
            icon="&#128200;"
            title="Funnel Tracking"
            desc="Visualize Impression to Click to Lead to Purchase with conversion rates and drop-off at each step."
          />
          <FeatureCard
            icon="&#128279;"
            title="Client Sharing"
            desc="Generate read-only dashboard links for clients. Professional reporting without giving account access."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/40">
          <span>MARK-SIS Marketing Intelligence</span>
          <span>Built for performance marketers</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-indigo-500/30 transition-all duration-300 group">
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}
