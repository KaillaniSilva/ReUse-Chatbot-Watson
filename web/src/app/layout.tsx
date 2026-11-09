import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WatsonAssistantChat } from "@/components/WatsonAssistantChat";
import { getSessionUserId } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReUse! — Economia sustentável e consumo consciente",
  description:
    "Plataforma que conecta quem quer dar nova vida a itens usados com quem busca qualidade sem comprar novo.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const userId = await getSessionUserId();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WatsonAssistantChat key={userId ?? "anon"} />
      </body>
    </html>
  );
}
