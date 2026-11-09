import { prisma } from "@/lib/prisma";
import { authorizeAssistantRequest } from "@/lib/assistant";

export const dynamic = "force-dynamic";

// POST /api/assistant/actions/items/pause — pausa todos os anúncios disponíveis do usuário
export async function POST(request: Request) {
  const auth = authorizeAssistantRequest(request);
  if (auth instanceof Response) return auth;

  const result = await prisma.item.updateMany({
    where: { ownerId: auth.userId, status: "DISPONIVEL" },
    data: { status: "PAUSADO" },
  });

  return Response.json({
    ok: true,
    alterados: result.count,
    message: result.count === 0 ? "Você não tem anúncios disponíveis para pausar." : `${result.count} anúncio(s) pausado(s). Eles não aparecem mais no catálogo até você reativá-los.`,
  });
}
