"use client";

import { registerCompany } from "@/lib/actions";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    // Auto-generate full_name from company name
    formData.set("full_name", formData.get("company_name") as string);
    const result = await registerCompany(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 animated-gradient relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 mesh-gradient-overlay" />
        {/* Particles */}
        <div className="particle particle-1" style={{ top: "20%", left: "15%" }} />
        <div className="particle particle-2" style={{ top: "60%", left: "25%" }} />
        <div className="particle particle-3" style={{ top: "40%", right: "20%" }} />
        <div className="particle particle-4" style={{ top: "75%", right: "30%" }} />
        <div className="particle particle-5" style={{ top: "30%", left: "60%" }} />
        <div className="particle particle-1" style={{ top: "85%", left: "45%" }} />
        <div className="particle particle-2" style={{ top: "15%", right: "15%" }} />
        <div className="particle particle-4" style={{ top: "50%", left: "40%" }} />

        <div className="relative z-10 text-white max-w-md">
          <div className="text-4xl font-black tracking-tight mb-4 text-glow">Hack Data</div>
          <p className="text-xl font-light text-white/90 mb-8 text-glow">
            The marketing intelligence platform that transforms your Facebook Ads data into actionable insights.
          </p>
          <div className="space-y-4 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg">&#9776;</div>
              <span>238+ metrics from Facebook Ads Manager</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg">&#9733;</div>
              <span>KPI targets with real-time scoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg">&#9888;</div>
              <span>Automated alerts for budget & performance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-lg">&#128101;</div>
              <span>Team management with role-based access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#faf9ff]">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8">
            <div className="lg:hidden text-3xl font-black text-gradient mb-2">Hack Data</div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 mt-1">Start tracking your marketing performance</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                name="company_name"
                required
                className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                placeholder="Your Company Sdn Bhd"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                placeholder="Min 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-3 px-4 text-white font-bold rounded-xl disabled:opacity-50 text-sm"
            >
              {loading ? "Creating account..." : "Get Started Free"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 font-semibold hover:text-pink-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
