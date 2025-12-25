export default function LoadingBar() {
  return (
    <div className="w-full h-1 bg-gray-200 overflow-hidden rounded">
      <div className="h-full w-1/3 bg-black animate-loading-bar" />
    </div>
  );
}
