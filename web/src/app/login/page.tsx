import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Entrar — ReUse!" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/perfil");

  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Entrar no ReUse!</h1>
      <p className="mt-1 text-sm text-muted">
        Acesse sua conta para publicar itens e manifestar interesse.
      </p>

      <div className="mt-8 rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
        <LoginForm redirectTo={redirectTo} />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-brand hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
