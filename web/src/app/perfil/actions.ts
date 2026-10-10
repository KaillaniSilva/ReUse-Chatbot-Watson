"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function marcarComoDoadoAction(itemId: string) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  await prisma.item.updateMany({
    where: { id: itemId, ownerId: userId },
    data: { status: "DOADO" },
  });

  revalidatePath("/perfil");
  revalidatePath(`/catalogo/${itemId}`);
}

export async function excluirItemAction(itemId: string) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  await prisma.item.deleteMany({ where: { id: itemId, ownerId: userId } });

  revalidatePath("/perfil");
  revalidatePath("/catalogo");
}
