"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { interesseSchema } from "@/lib/validation";

export type InteresseFormState = { error?: string; success?: boolean };

export async function toggleFavoriteAction(itemId: string) {
  const userId = await getSessionUserId();
  if (!userId) redirect(`/login?redirect=/catalogo/${itemId}`);

  const existing = await prisma.favorite.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId, itemId } });
  }

  revalidatePath(`/catalogo/${itemId}`);
}

export async function sendInteresseAction(
  itemId: string,
  _prevState: InteresseFormState,
  formData: FormData
): Promise<InteresseFormState> {
  const userId = await getSessionUserId();
  if (!userId) redirect(`/login?redirect=/catalogo/${itemId}`);

  const parsed = interesseSchema.safeParse({
    itemId,
    mensagem: formData.get("mensagem"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item não encontrado" };
  if (item.ownerId === userId) {
    return { error: "Você não pode manifestar interesse no seu próprio item" };
  }

  await prisma.interesse.create({
    data: { itemId, autorId: userId, mensagem: parsed.data.mensagem },
  });

  revalidatePath(`/catalogo/${itemId}`);
  return { success: true };
}

export async function responderInteresseAction(
  interesseId: string,
  itemId: string,
  status: "ACEITO" | "RECUSADO"
) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const interesse = await prisma.interesse.findUnique({
    where: { id: interesseId },
    include: { item: true },
  });
  if (!interesse || interesse.item.ownerId !== userId) return;

  await prisma.interesse.update({ where: { id: interesseId }, data: { status } });

  if (status === "ACEITO") {
    await prisma.item.update({ where: { id: itemId }, data: { status: "RESERVADO" } });
  }

  revalidatePath(`/catalogo/${itemId}`);
  revalidatePath("/perfil");
}
