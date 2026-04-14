"use client";

import { loginWithStaffId } from "@/lib/actions";
import Link from "next/link";
import { useState } from "react";

export default function StaffLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginWithStaffId(formData);
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
            Your marketing command center.
          </p>
          <p className="text-white/60 mt-4 text-sm leading-relaxed">
            Track 238+ Facebook Ads metrics, manage your team, set KPI targets,
            and get automated alerts — all in one beautiful dashboard.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#faf9ff]">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8">
            <div className="lg:hidden text-3xl font-black text-gradient mb-2">Hack Data</div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
            <p className="text-gray-500 mt-1">For Leaders & Marketers</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Staff ID</label>
              <input
                type="text"
                name="staff_id"
                required
                className="input-premium w-full px-4 py-3 rounded-xl text-center text-lg font-bold tracking-widest uppercase"
                placeholder="ID Staff"
                style={{ letterSpacing: "3px" }}
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

        </div>
      </div>
    </div>
  );
}
