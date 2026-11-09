import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/categorias — categorias com a quantidade de itens disponíveis
export async function GET() {
  const categorias = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      icon: true,
      _count: { select: { items: { where: { status: "DISPONIVEL" } } } },
    },
  });

  return Response.json(
    categorias.map(({ _count, ...c }) => ({ ...c, itensDisponiveis: _count.items }))
  );
}
