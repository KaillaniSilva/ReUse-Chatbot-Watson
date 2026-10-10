export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12" aria-busy="true" aria-live="polite">
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-brand-surface" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-brand-surface" />
        ))}
      </div>
      <span className="sr-only">Carregando itens...</span>
    </div>
  );
}
