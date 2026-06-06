export function FeedbackSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </div>
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="mt-3 h-3 w-48 rounded bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-4/5 rounded bg-gray-200" />
            <div className="h-3 w-3/5 rounded bg-gray-200" />
          </div>
          <div className="mt-4 flex gap-4">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="h-9 w-36 rounded-lg bg-gray-200" />
          </div>
        </div>
      ))}
    </>
  );
}
