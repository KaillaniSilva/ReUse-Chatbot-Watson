import { prisma } from "@/lib/prisma";
import { authorizeAssistantRequest } from "@/lib/assistant";

export const dynamic = "force-dynamic";

// GET /api/assistant/actions/items/summary — resumo dos anúncios do usuário (somente leitura)
export async function GET(request: Request) {
  const auth = authorizeAssistantRequest(request);
  if (auth instanceof Response) return auth;

  const itens = await prisma.item.findMany({
    where: { ownerId: auth.userId },
    select: { title: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  const count = (s: string) => itens.filter((i) => i.status === s).length;
  const disponiveis = count("DISPONIVEL");
  const pausados = count("PAUSADO");
  const reservados = count("RESERVADO");
  const doados = count("DOADO");

  const message =
    itens.length === 0
      ? "Você ainda não publicou nenhum anúncio no ReUse."
      : `Você tem ${itens.length} anúncio(s): ${disponiveis} disponível(is), ${pausados} pausado(s), ${reservados} reservado(s) e ${doados} doado(s).`;

  return Response.json({
    ok: true,
    total: itens.length,
    disponiveis,
    pausados,
    reservados,
    doados,
    titulos: itens.slice(0, 5).map((i) => i.title).join(", "),
    message,
  });
}
