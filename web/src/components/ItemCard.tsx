import Link from "next/link";
import { formatNumber, impactForCategory } from "@/lib/impact";

type ItemCardProps = {
  id: string;
  title: string;
  description: string;
  condition: string;
  tipo: "DOACAO" | "TROCA";
  status: "DISPONIVEL" | "RESERVADO" | "DOADO";
  categoryName: string;
  categoryIcon: string;
  categorySlug: string;
  imageUrl?: string | null;
  ownerCity?: string | null;
};

const tipoLabel: Record<ItemCardProps["tipo"], string> = {
  DOACAO: "Doação",
  TROCA: "Troca",
};

const statusStyle: Record<ItemCardProps["status"], string> = {
  DISPONIVEL: "bg-brand-surface text-brand",
  RESERVADO: "bg-amber-50 text-amber-700",
  DOADO: "bg-slate-100 text-slate-500",
};

const statusLabel: Record<ItemCardProps["status"], string> = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  DOADO: "Concluído",
};

export function ItemCard({
  id,
  title,
  description,
  condition,
  tipo,
  status,
  categoryName,
  categoryIcon,
  categorySlug,
  imageUrl,
  ownerCity,
}: ItemCardProps) {
  const impact = impactForCategory(categorySlug);

  return (
    <Link
      href={`/catalogo/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand"
    >
      <div className="relative flex h-40 items-center justify-center bg-brand-surface">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl" aria-hidden="true">
            {categoryIcon}
          </span>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status]}`}
        >
          {statusLabel[status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 font-bold text-slate-900">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{categoryName}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{tipoLabel[tipo]}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{condition}</span>
          {ownerCity ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1">📍 {ownerCity}</span>
          ) : null}
        </div>
        <p className="mt-4 text-xs font-semibold text-brand">
          🌱 Evita ~{formatNumber(impact.co2Kg)} kg de CO₂
        </p>
      </div>
    </Link>
  );
}
