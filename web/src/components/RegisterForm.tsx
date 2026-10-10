"use client";

import { useActionState } from "react";
import { registerAction, type RegisterFormState } from "@/app/cadastro/actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<RegisterFormState, FormData>(
    registerAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome completo" name="name" type="text" autoComplete="name" />
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Cidade (opcional)" name="city" type="text" autoComplete="address-level2" required={false} />
      <Field label="Senha" name="password" type="password" autoComplete="new-password" />
      {state.error ? <p className="text-sm font-medium text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light disabled:opacity-60"
      >
        {isPending ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}
