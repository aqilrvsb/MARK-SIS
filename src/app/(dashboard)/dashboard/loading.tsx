export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 h-64" />
        <div className="bg-white rounded-xl border p-6 h-64" />
      </div>
    </div>
  );
}
