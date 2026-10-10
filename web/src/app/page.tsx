import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REUTILIZAVEIS = [
  { icon: "👕", title: "Roupas e calçados", desc: "Camisetas, casacos e sapatos em bom estado para doar ou trocar." },
  { icon: "🛋️", title: "Móveis e decoração", desc: "Sofás, mesas, cadeiras, quadros e itens de decoração." },
  { icon: "📱", title: "Eletrônicos", desc: "Celulares, notebooks e eletrodomésticos que ainda funcionam." },
  { icon: "📚", title: "Livros e brinquedos", desc: "Livros, jogos, brinquedos e utensílios em geral." },
];

const BENEFICIOS = [
  { icon: "🌱", title: "Menos impacto no planeta", desc: "Cada item reutilizado significa menos produção nova e menos lixo." },
  { icon: "🤝", title: "Comunidade consciente", desc: "Faça parte de uma rede de pessoas que valorizam o consumo responsável." },
  { icon: "💰", title: "Economia real", desc: "Quem doa dá destino útil; quem busca encontra itens de qualidade sem pagar por algo novo." },
];

const PASSOS = [
  { step: "1", title: "Anuncie ou busque", text: "Publique itens que você não usa mais ou pesquise o que precisa no catálogo." },
  { step: "2", title: "Conecte-se", text: "Manifeste interesse e combine a doação ou troca diretamente com a outra pessoa." },
  { step: "3", title: "Reutilize", text: "O item ganha nova vida e você contribui para um consumo mais consciente." },
];

export default async function HomePage() {
  const [totalItens, totalDisponiveis, totalCategorias, totalUsuarios] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { status: "DISPONIVEL" } }),
    prisma.category.count(),
    prisma.user.count(),
  ]);

  const stats = [
    { label: "Itens publicados", value: totalItens },
    { label: "Disponíveis agora", value: totalDisponiveis },
    { label: "Categorias", value: totalCategorias },
    { label: "Pessoas na rede", value: totalUsuarios },
  ];

  return (
    <div>
      <section className="w-full bg-brand px-6 py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Economia sustentável e consumo consciente
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
            Conectamos quem quer dar nova vida a itens usados e quem busca
            qualidade sem comprar novo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/catalogo"
              className="rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand shadow-sm transition hover:opacity-90"
            >
              Ver catálogo
            </Link>
            <Link
              href="/sobre"
              className="rounded-xl border border-white/40 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Saber mais
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold text-brand">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-4/5 max-w-5xl">
        <section className="mt-16">
          <SectionTitle title="O problema que enfrentamos" />
          <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            <p className="leading-relaxed text-slate-600">
              O consumo excessivo e o descarte precoce geram impacto ambiental
              e social. No Brasil, milhões de toneladas de roupas, móveis e
              eletrônicos vão para o lixo todos os anos, enquanto muitas
              pessoas poderiam reutilizá-los.
            </p>
            <div className="mt-4 rounded-xl border-l-4 border-brand bg-brand-surface px-4 py-3 text-sm font-semibold text-brand">
              Exemplo: só de resíduos têxteis, são descartadas mais de 170 mil
              toneladas por ano no Brasil. A maior parte poderia ser
              reutilizada ou reciclada.
            </div>
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle
            title="O que você pode reutilizar no ReUse"
            subtitle="Dê nova vida ao que já existe."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {REUTILIZAVEIS.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle
            title="O que você ganha com o ReUse"
            subtitle="Uma mudança que vai além da economia."
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {BENEFICIOS.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle title="Como funciona em 3 passos" />
          <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
            {PASSOS.map((item) => (
              <div key={item.step} className="mb-5 flex items-start gap-4 last:mb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="my-20 flex justify-center">
          <Link
            href="/sobre"
            className="min-w-[280px] rounded-2xl bg-brand px-10 py-6 text-center shadow-sm transition hover:bg-brand-light"
          >
            <span className="block text-base font-bold text-white">
              Saber mais sobre o projeto
            </span>
            <span className="mt-1 block text-xs text-white/80">
              Missão, impacto e próximos passos
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-2xl">
        {icon}
      </div>
      <p className="font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
