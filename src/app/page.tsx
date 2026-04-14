import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0818] text-white overflow-hidden">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="orb-2 absolute top-[50%] right-[10%] w-[400px] h-[400px] bg-pink-500/12 rounded-full blur-[100px]" />
        <div className="orb-3 absolute bottom-[10%] left-[40%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="orb-4 absolute top-[30%] right-[35%] w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tight text-gradient-animated">Hack Data</div>
        <div className="flex gap-4">
          <Link href="/login" className="btn-premium px-5 py-2 text-sm font-bold rounded-lg">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 pt-16 pb-32 max-w-7xl mx-auto">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-6 tracking-wide backdrop-blur-sm">
            MARKETING INTELLIGENCE PLATFORM
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
            Turn Facebook Ads
            <br />
            <span className="text-gradient-animated text-glow">into Growth</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Import 238+ metrics from Facebook Ads Manager. Track team performance.
            Set KPI targets. Get automated alerts. All in one beautiful dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-premium px-8 py-3.5 text-sm font-bold rounded-xl pulse-glow">
              Get Started Free
            </Link>
            <Link href="/login" className="px-8 py-3.5 text-sm font-semibold rounded-xl border border-white/15 hover:bg-white/5 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
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
      <footer className="relative z-10 px-8 py-8">
        <div className="gradient-accent-line mb-8" />
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/30">
          <span className="text-gradient">Hack Data Marketing Intelligence</span>
          <span>Built for performance marketers</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="feature-card-glass rounded-2xl p-6 group cursor-default">
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gradient">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/55 transition-colors duration-300">{desc}</p>
    </div>
  );
}
