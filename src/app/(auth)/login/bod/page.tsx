"use client";

import { login } from "@/lib/actions";
import Link from "next/link";
import { useState } from "react";

export default function BODLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
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
          <div className="text-5xl font-black tracking-tight mb-6 text-glow">Hack Data</div>
          <p className="text-2xl font-light text-white/90 leading-relaxed text-glow">
            Company Admin Portal
          </p>
          <p className="text-white/60 mt-4 text-sm leading-relaxed">
            Manage your entire marketing team, configure KPI targets,
            set up alert rules, and oversee all campaign performance.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#faf9ff]">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8">
            <div className="lg:hidden text-3xl font-black text-gradient mb-2">Hack Data</div>
            <h1 className="text-2xl font-bold text-gray-900">Company Login</h1>
            <p className="text-gray-500 mt-1">For Board of Directors</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                placeholder="admin@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-3 px-4 text-white font-bold rounded-xl disabled:opacity-50 text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Staff member?{" "}
            <Link href="/login" className="text-purple-600 font-semibold hover:text-pink-500 transition-colors">
              Staff Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
