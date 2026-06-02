export default function TopBar({ title }) {
  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-bg sticky top-0 z-10">
      <div className="flex items-center">
        <span className="text-sm font-medium text-text-primary">{title}</span>
      </div>
    </div>
  );
}
