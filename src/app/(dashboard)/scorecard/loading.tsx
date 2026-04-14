export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 h-12 border-b" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-100 px-6 flex items-center gap-4">
            <div className="w-6 h-6 bg-gray-200 rounded" />
            <div className="flex-1 h-4 bg-gray-100 rounded" />
            <div className="w-20 h-6 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
