import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sobre — ReUse!" };

export default async function SobrePage() {
  const [totalDoados, categorias] = await Promise.all([
    prisma.item.count({ where: { status: "DOADO" } }),
    prisma.category.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto w-4/5 max-w-4xl py-14">
      <div className="rounded-2xl bg-brand px-8 py-10 text-center text-white shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight">Sobre o ReUse!</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Conheça a missão, o impacto e os próximos passos da nossa plataforma.
        </p>
      </div>

      <Block title="Nossa missão">
        <p className="leading-relaxed text-slate-600">
          Reduzir o desperdício e o impacto ambiental promovendo a
          reutilização de produtos em bom estado. Queremos ser a ponte entre
          quem tem itens para doar ou trocar e quem busca consumo mais
          consciente e acessível.
        </p>
        <Highlight>
          Em uma frase: dar nova vida ao que já existe, em vez de produzir e
          descartar sem necessidade.
        </Highlight>
      </Block>

      <Block title="Como o ReUse funciona">
        <p className="leading-relaxed text-slate-600">
          O ReUse é uma plataforma onde você pode publicar itens que não usa
          mais ou buscar itens de segunda mão no catálogo. Tudo em um só
          lugar, com foco em simplicidade e confiança entre os usuários.
        </p>
        <BulletList
          label="O que já é possível fazer na plataforma:"
          items={[
            "Criar uma conta e publicar itens com descrição e estado de conservação",
            "Buscar e filtrar itens por categoria no catálogo",
            "Manifestar interesse em um item e combinar diretamente com quem publicou",
            "Favoritar itens e acompanhar suas publicações e interesses no seu perfil",
          ]}
        />
      </Block>

      <Block title="Impacto que buscamos">
        <p className="leading-relaxed text-slate-600">
          Menos produtos novos fabricados, menos lixo, mais vida útil para
          cada objeto. Cada item reutilizado é um passo em direção a um
          consumo mais sustentável.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatBox label="Itens já doados" value={totalDoados} />
          {categorias.map((categoria) => (
            <StatBox
              key={categoria.id}
              label={categoria.name}
              value={categoria._count.items}
            />
          ))}
        </div>
      </Block>

      <Block title="Visão e próximos passos">
        <p className="leading-relaxed text-slate-600">
          Queremos que o ReUse se torne referência em reutilização e consumo
          consciente no Brasil: um lugar onde doar, trocar e buscar itens
          usados seja simples, seguro e gratificante.
        </p>
        <p className="mt-3 leading-relaxed text-slate-600">
          Nesta fase, entregamos a versão web da plataforma com catálogo,
          publicação de itens, favoritos e manifestação de interesse — tudo
          integrado a um banco de dados PostgreSQL via Prisma. Nas próximas
          etapas, o plano é evoluir mensagens diretas entre usuários e
          avaliação de reputação na comunidade.
        </p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
      <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border-l-4 border-brand bg-brand-surface px-4 py-3 text-sm font-semibold text-brand">
      {children}
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-brand-surface px-4 py-3 text-center">
      <p className="text-xl font-extrabold text-brand">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}
