"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { itemSchema } from "@/lib/validation";

export type PublicarFormState = { error?: string };

export async function publicarItemAction(
  _prevState: PublicarFormState,
  formData: FormData
): Promise<PublicarFormState> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?redirect=/publicar");

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    condition: formData.get("condition"),
    imageUrl: formData.get("imageUrl"),
    tipo: formData.get("tipo"),
    categoryId: formData.get("categoryId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const item = await prisma.item.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      condition: parsed.data.condition,
      imageUrl: parsed.data.imageUrl || null,
      tipo: parsed.data.tipo,
      categoryId: parsed.data.categoryId,
      ownerId: userId,
    },
  });

  revalidatePath("/catalogo");
  revalidatePath("/perfil");
  redirect(`/catalogo/${item.id}`);
}
