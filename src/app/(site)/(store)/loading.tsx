export default function Loading() {
  return (
    <div className="container-page space-y-4 py-10" aria-busy="true" aria-label="Carregando">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-ink/5" />
      <div className="h-5 w-1/2 animate-pulse rounded-xl bg-ink/5" />
      <div className="grid gap-3 pt-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-card bg-ink/5" />)}
      </div>
    </div>
  );
}
