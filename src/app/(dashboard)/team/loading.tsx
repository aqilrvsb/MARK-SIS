export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-6">
        <div><div className="h-8 w-48 bg-gray-200 rounded mb-2" /><div className="h-4 w-32 bg-gray-100 rounded" /></div>
        <div className="h-10 w-32 bg-indigo-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 h-12 border-b" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-100" />
        ))}
      </div>
    </div>
  );
}
