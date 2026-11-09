import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/itens?categoria=<slug>&busca=<texto> — itens disponíveis (somente dados públicos)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria") ?? undefined;
  const busca = searchParams.get("busca") ?? undefined;

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

  const itens = await prisma.item.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      condition: true,
      imageUrl: true,
      tipo: true,
      status: true,
      createdAt: true,
      category: { select: { name: true, slug: true, icon: true } },
      owner: { select: { name: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ total: itens.length, itens });
}
