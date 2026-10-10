"use client";

import { useActionState } from "react";
import { sendInteresseAction, type InteresseFormState } from "@/app/catalogo/[id]/actions";

export function InteresseForm({ itemId }: { itemId: string }) {
  const action = sendInteresseAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState<InteresseFormState, FormData>(
    action,
    {}
  );

  if (state.success) {
    return (
      <p className="rounded-xl bg-brand-surface px-4 py-3 text-sm font-semibold text-brand">
        Interesse enviado! A pessoa que publicou o item poderá ver sua mensagem.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="mensagem"
        required
        rows={3}
        placeholder="Escreva uma mensagem para quem publicou o item..."
        className="w-full rounded-lg border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand"
      />
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60"
      >
        {isPending ? "Enviando..." : "Tenho interesse"}
      </button>
    </form>
  );
}
