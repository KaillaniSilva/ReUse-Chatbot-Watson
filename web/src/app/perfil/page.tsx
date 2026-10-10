import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, sumImpact } from "@/lib/impact";
import { marcarComoDoadoAction, excluirItemAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Meu perfil — ReUse!" };

const statusLabel = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  DOADO: "Concluído",
} as const;

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/perfil");

  const [meusItens, favoritos, meusInteresses] = await Promise.all([
    prisma.item.findMany({
      where: { ownerId: user.id },
      include: { category: true, _count: { select: { interesses: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { item: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interesse.findMany({
      where: { autorId: user.id },
      include: { item: { include: { owner: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const itensDoados = meusItens.filter((item) => item.status === "DOADO");
  const impacto = sumImpact(itensDoados.map((item) => item.category.slug));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {user.email}
          {user.city ? ` · ${user.city}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Membro desde {user.createdAt.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-6">
        <h2 className="text-lg font-bold text-brand">🌱 Seu impacto</h2>
        <p className="mt-1 text-xs text-muted">
          Estimativa com base nos {itensDoados.length} item(ns) que você já doou ou trocou.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-extrabold text-brand">{formatNumber(impacto.co2Kg)}</p>
            <p className="text-xs text-slate-600">kg de CO₂ evitados</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand">{formatNumber(impacto.waterL)}</p>
            <p className="text-xs text-slate-600">litros de água</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand">{formatNumber(impacto.wasteKg)}</p>
            <p className="text-xs text-slate-600">kg de lixo evitados</p>
          </div>
        </div>
      </section>

      <Section title="Meus itens publicados" action={{ href: "/publicar", label: "+ Publicar novo item" }}>
        {meusItens.length === 0 ? (
          <EmptyState text="Você ainda não publicou nenhum item." />
        ) : (
          <div className="space-y-3">
            {meusItens.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border p-4"
              >
                <div>
                  <Link href={`/catalogo/${item.id}`} className="font-semibold text-slate-900 hover:text-brand">
                    {item.category.icon} {item.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {statusLabel[item.status]} · {item._count.interesses} interesse(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.status !== "DOADO" ? (
                    <form action={marcarComoDoadoAction.bind(null, item.id)}>
                      <button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand">
                        Marcar como doado
                      </button>
                    </form>
                  ) : null}
                  <form action={excluirItemAction.bind(null, item.id)}>
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Itens favoritados">
        {favoritos.length === 0 ? (
          <EmptyState text="Você ainda não favoritou nenhum item." />
        ) : (
          <div className="space-y-3">
            {favoritos.map((favorite) => (
              <Link
                key={favorite.id}
                href={`/catalogo/${favorite.item.id}`}
                className="block rounded-xl border border-brand-border p-4 hover:border-brand"
              >
                <p className="font-semibold text-slate-900">
                  {favorite.item.category.icon} {favorite.item.title}
                </p>
                <p className="mt-0.5 text-xs text-muted">{favorite.item.category.name}</p>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Meus interesses enviados">
        {meusInteresses.length === 0 ? (
          <EmptyState text="Você ainda não manifestou interesse em nenhum item." />
        ) : (
          <div className="space-y-3">
            {meusInteresses.map((interesse) => (
              <div key={interesse.id} className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/catalogo/${interesse.item.id}`}
                    className="font-semibold text-slate-900 hover:text-brand"
                  >
                    {interesse.item.title}
                  </Link>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {interesse.status === "PENDENTE"
                      ? "Pendente"
                      : interesse.status === "ACEITO"
                        ? "Aceito"
                        : "Recusado"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Para {interesse.item.owner.name} · &ldquo;{interesse.mensagem}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-sm font-semibold text-brand hover:underline">
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}
