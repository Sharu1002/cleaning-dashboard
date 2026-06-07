export function FeedbackSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 border-l-4 border-l-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-slate-200" />
              <div className="h-5 w-36 rounded-lg bg-slate-200" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 space-y-2">
            <div className="h-3 w-full rounded bg-slate-200" />
            <div className="h-3 w-4/5 rounded bg-slate-200" />
            <div className="h-3 w-3/5 rounded bg-slate-200" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-28 rounded-md bg-slate-200" />
            <div className="h-6 w-24 rounded-md bg-slate-200" />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="h-10 w-40 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </>
  );
}
