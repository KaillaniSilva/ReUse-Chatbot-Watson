import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl" aria-hidden="true">♻️</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted">
        O item ou a página que você procura não existe mais ou foi movido.
      </p>
      <Link
        href="/catalogo"
        className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
      >
        Voltar ao catálogo
      </Link>
    </div>
  );
}
