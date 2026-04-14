export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-purple-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-purple-500 border-r-pink-500 animate-spin" />
        </div>
        <p className="text-sm text-purple-300 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
