import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { InteresseForm } from "@/components/InteresseForm";
import { formatNumber, impactForCategory } from "@/lib/impact";
import { toggleFavoriteAction, responderInteresseAction } from "./actions";

export const dynamic = "force-dynamic";

const tipoLabel = { DOACAO: "Doação", TROCA: "Troca" } as const;
const statusLabel = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  DOADO: "Concluído",
} as const;

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, user] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { id: true, name: true, city: true, createdAt: true } },
        interesses: {
          include: { autor: { select: { name: true, city: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!item) notFound();

  const isOwner = user?.id === item.owner.id;
  const impact = impactForCategory(item.category.slug);

  const isFavorited = user
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_itemId: { userId: user.id, itemId: item.id } },
        })
      )
    : false;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/catalogo" className="text-sm font-medium text-brand hover:underline">
        ← Voltar para o catálogo
      </Link>

      <div className="mt-4 rounded-2xl border border-brand-border bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-surface text-3xl">
              {item.category.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
              <p className="text-sm text-muted">{item.category.name}</p>
            </div>
          </div>

          {user && !isOwner ? (
            <form action={toggleFavoriteAction.bind(null, item.id)}>
              <button
                type="submit"
                aria-label="Favoritar item"
                className={`rounded-full border px-3 py-2 text-lg transition ${
                  isFavorited
                    ? "border-brand bg-brand-surface"
                    : "border-brand-border hover:border-brand"
                }`}
              >
                {isFavorited ? "❤️" : "🤍"}
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
            {tipoLabel[item.tipo]}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
            Estado: {item.condition}
          </span>
          <span className="rounded-full bg-brand-surface px-3 py-1.5 text-brand">
            {statusLabel[item.status]}
          </span>
        </div>

        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="mt-6 max-h-96 w-full rounded-xl object-cover"
          />
        ) : null}

        <p className="mt-6 leading-relaxed text-slate-600">{item.description}</p>

        <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-sm font-bold text-brand">
            🌱 Impacto ao reutilizar este item (estimativa)
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <ImpactStat value={formatNumber(impact.co2Kg)} unit="kg CO₂ evitados" />
            <ImpactStat value={formatNumber(impact.waterL)} unit="litros de água" />
            <ImpactStat value={formatNumber(impact.wasteKg)} unit="kg de lixo" />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Publicado por <span className="font-semibold">{item.owner.name}</span>
          {item.owner.city ? ` · ${item.owner.city}` : ""}
        </div>

        <div className="mt-8 border-t border-brand-border pt-6">
          {isOwner ? (
            <OwnerInteresses interesses={item.interesses} itemId={item.id} />
          ) : user ? (
            item.status === "DISPONIVEL" ? (
              <InteresseForm itemId={item.id} />
            ) : (
              <p className="text-sm text-muted">Este item não está mais disponível.</p>
            )
          ) : (
            <p className="text-sm text-muted">
              <Link href={`/login?redirect=/catalogo/${item.id}`} className="font-semibold text-brand hover:underline">
                Entre na sua conta
              </Link>{" "}
              para favoritar ou manifestar interesse neste item.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ImpactStat({ value, unit }: { value: string; unit: string }) {
  return (
    <div>
      <p className="text-lg font-extrabold text-brand">{value}</p>
      <p className="text-xs text-slate-600">{unit}</p>
    </div>
  );
}

function OwnerInteresses({
  interesses,
  itemId,
}: {
  itemId: string;
  interesses: {
    id: string;
    mensagem: string;
    status: "PENDENTE" | "ACEITO" | "RECUSADO";
    autor: { name: string; city: string | null };
  }[];
}) {
  if (interesses.length === 0) {
    return <p className="text-sm text-muted">Ainda não há interesses neste item.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-700">
        Interesses recebidos ({interesses.length})
      </p>
      <div className="space-y-3">
        {interesses.map((interesse) => (
          <div key={interesse.id} className="rounded-xl border border-brand-border p-4">
            <p className="text-sm font-semibold text-slate-800">
              {interesse.autor.name}
              {interesse.autor.city ? ` · ${interesse.autor.city}` : ""}
            </p>
            <p className="mt-1 text-sm text-muted">{interesse.mensagem}</p>
            {interesse.status === "PENDENTE" ? (
              <div className="mt-3 flex gap-2">
                <form action={responderInteresseAction.bind(null, interesse.id, itemId, "ACEITO")}>
                  <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-light">
                    Aceitar
                  </button>
                </form>
                <form action={responderInteresseAction.bind(null, interesse.id, itemId, "RECUSADO")}>
                  <button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand">
                    Recusar
                  </button>
                </form>
              </div>
            ) : (
              <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {interesse.status === "ACEITO" ? "Aceito" : "Recusado"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
