import { prisma } from "@/lib/prisma";
import { authorizeAssistantRequest } from "@/lib/assistant";

export const dynamic = "force-dynamic";

// POST /api/assistant/actions/items/reactivate — reativa todos os anúncios pausados do usuário
export async function POST(request: Request) {
  const auth = authorizeAssistantRequest(request);
  if (auth instanceof Response) return auth;

  const result = await prisma.item.updateMany({
    where: { ownerId: auth.userId, status: "PAUSADO" },
    data: { status: "DISPONIVEL" },
  });

  return Response.json({
    ok: true,
    alterados: result.count,
    message: result.count === 0 ? "Você não tem anúncios pausados para reativar." : `${result.count} anúncio(s) reativado(s). Eles voltaram para o catálogo.`,
  });
}
