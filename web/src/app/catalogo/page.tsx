import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ItemCard } from "@/components/ItemCard";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Catálogo — ReUse!" };

type SearchParams = Promise<{ categoria?: string; busca?: string }>;

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categoria, busca } = await searchParams;

  const where: Prisma.ItemWhereInput = {
    status: "DISPONIVEL",
    ...(categoria ? { category: { slug: categoria } } : {}),
    ...(busca
      ? {
          OR: [
            { title: { contains: busca, mode: "insensitive" } },
            { description: { contains: busca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [categorias, itens] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({
      where,
      include: { category: true, owner: { select: { city: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Catálogo de itens</h1>
        <p className="mt-1 text-sm text-muted">
          Explore itens disponíveis para doação ou troca publicados pela comunidade.
        </p>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" action="/catalogo">
        {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
        <input
          type="search"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por título ou descrição..."
          className="min-w-[240px] flex-1 rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
        >
          Buscar
        </button>
      </form>

      <div className="mb-8 flex flex-wrap gap-2">
        <CategoryPill href={buildHref(undefined, busca)} label="Todas" active={!categoria} />
        {categorias.map((cat) => (
          <CategoryPill
            key={cat.id}
            href={buildHref(cat.slug, busca)}
            label={`${cat.icon} ${cat.name}`}
            active={categoria === cat.slug}
          />
        ))}
      </div>

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {itens.length} {itens.length === 1 ? "item encontrado" : "itens encontrados"}
      </p>

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border p-12 text-center text-muted">
          Nenhum item encontrado com esse filtro.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              condition={item.condition}
              tipo={item.tipo}
              status={item.status}
              categoryName={item.category.name}
              categoryIcon={item.category.icon}
              categorySlug={item.category.slug}
              imageUrl={item.imageUrl}
              ownerCity={item.owner.city}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildHref(categoria?: string, busca?: string) {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (busca) params.set("busca", busca);
  const query = params.toString();
  return query ? `/catalogo?${query}` : "/catalogo";
}

function CategoryPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-brand text-white"
          : "border border-brand-border text-slate-600 hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </Link>
  );
}
