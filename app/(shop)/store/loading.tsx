/**
 * Streamed fallback while /store resolves its product and review queries.
 * Without this the browser sits on the previous page until the DB responds.
 */
export default function StoreLoading() {
  return (
    <div className="bg-zinc-950 min-h-svh pt-28 lg:pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-10 lg:mb-14">
          <div className="h-2 w-24 bg-zinc-900 mb-5 animate-pulse" />
          <div className="h-12 w-full max-w-72 bg-zinc-900 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-zinc-800/50 bg-zinc-900/20">
              <div className="aspect-[4/3] bg-zinc-900 animate-pulse" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 w-20 bg-zinc-900 animate-pulse" />
                <div className="h-4 w-full bg-zinc-900 animate-pulse" />
                <div className="h-4 w-2/3 bg-zinc-900 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
