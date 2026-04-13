import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">MARK-SIS</h1>
        <p className="text-xl text-gray-600 mb-8">
          Marketing Reporting System
        </p>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Manage your Facebook Ads data with role-based access.
          BOD, Leaders, and Marketers — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50"
          >
            Register Company
          </Link>
        </div>
      </div>
    </div>
  );
}
