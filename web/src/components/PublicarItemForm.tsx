"use client";

import { useActionState } from "react";
import { publicarItemAction, type PublicarFormState } from "@/app/publicar/actions";

type Category = { id: string; name: string; icon: string };

export function PublicarItemForm({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState<PublicarFormState, FormData>(
    publicarItemAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Título</span>
        <input
          name="title"
          required
          placeholder="Ex: Jaqueta jeans tamanho M"
          className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Descrição</span>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="Descreva o item, incluindo detalhes relevantes"
          className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Estado de conservação</span>
          <input
            name="condition"
            required
            placeholder="Ex: Seminovo"
            className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</span>
          <select
            name="categoryId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="" disabled>
              Selecione uma categoria
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="flex gap-6">
        <legend className="mb-1.5 text-sm font-medium text-slate-700">Tipo de publicação</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="radio" name="tipo" value="DOACAO" defaultChecked /> Doação
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="radio" name="tipo" value="TROCA" /> Troca
        </label>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">URL da imagem (opcional)</span>
        <input
          name="imageUrl"
          type="url"
          placeholder="https://..."
          className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60"
      >
        {isPending ? "Publicando..." : "Publicar item"}
      </button>
    </form>
  );
}
