export default function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-block p-6 bg-gray-50 rounded-full mb-4">
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-xl text-gray-600">No surveys available yet</p>
      <p className="text-gray-500 mt-2">Check back soon for updates!</p>
    </div>
  );
}
