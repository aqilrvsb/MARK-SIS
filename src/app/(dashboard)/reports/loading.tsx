export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="bg-white rounded-xl border p-4 flex gap-4 mb-6">
        <div className="h-8 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-3 h-16" />
        ))}
      </div>
      <div className="bg-white rounded-xl border h-64" />
    </div>
  );
}
