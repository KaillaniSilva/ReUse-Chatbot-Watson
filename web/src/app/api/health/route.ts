import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/health — status do backend e da conexão com o banco
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, service: "reuse-backend", database: "up", time: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, service: "reuse-backend", database: "down" }, { status: 503 });
  }
}
