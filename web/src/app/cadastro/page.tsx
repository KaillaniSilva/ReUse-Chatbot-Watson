import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata = { title: "Criar conta — ReUse!" };

export default async function CadastroPage() {
  const user = await getCurrentUser();
  if (user) redirect("/perfil");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Criar conta no ReUse!</h1>
      <p className="mt-1 text-sm text-muted">
        Cadastre-se para publicar itens e conectar-se com a comunidade.
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
