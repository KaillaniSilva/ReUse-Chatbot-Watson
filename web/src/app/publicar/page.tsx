import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PublicarItemForm } from "@/components/PublicarItemForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Publicar item — ReUse!" };

export default async function PublicarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/publicar");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Publicar um item</h1>
      <p className="mt-1 text-sm text-muted">
        Preencha os dados abaixo para disponibilizar um item para doação ou troca.
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <PublicarItemForm categories={categories} />
      </div>
    </div>
  );
}
