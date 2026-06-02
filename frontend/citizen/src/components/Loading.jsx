export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-4 text-center animate-pulse">
          Loading surveys...
        </p>
      </div>
    </div>
  );
}
