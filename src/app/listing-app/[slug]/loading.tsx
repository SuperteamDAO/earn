export default function Loading() {
  return (
    <div className="w-full animate-pulse">
      <div className="h-48 w-full rounded-lg bg-slate-200" />
      <div className="mt-6 space-y-4">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}
