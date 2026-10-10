import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/sobre", label: "Sobre" },
];

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
            R
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Re<span className="text-brand">Use!</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/publicar"
                className="hidden rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-light sm:inline-block"
              >
                Publicar item
              </Link>
              <Link
                href="/perfil"
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
              >
                {user.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 transition hover:text-brand"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-light"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex items-center justify-center gap-6 border-t border-brand-border px-6 py-2 sm:hidden"
      >
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600">
            {link.label}
          </Link>
        ))}
        {user ? (
          <Link href="/publicar" className="text-sm font-semibold text-brand">
            Publicar
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
