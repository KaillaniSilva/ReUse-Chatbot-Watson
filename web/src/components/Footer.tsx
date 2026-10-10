export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-surface">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted">
        <p className="font-semibold text-slate-700">ReUse!</p>
        <p className="mt-1 max-w-xl">
          Plataforma de economia sustentável e consumo consciente. Conectando
          quem quer dar nova vida a itens usados com quem busca qualidade sem
          comprar novo.
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Projeto acadêmico — versão web em Next.js integrada a PostgreSQL via Prisma.
        </p>
      </div>
    </footer>
  );
}
