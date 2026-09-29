import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { PixelIcon } from "@/components/ui/PixelArt";
import { getSettings } from "@/server/settings";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-14 items-center justify-between sm:h-16">
          <Link href="/" aria-label="Voltar à loja">
            <Logo name={s.store_name} logoUrl={s.logo_url || null} />
          </Link>
          <p className="flex items-center gap-1.5 text-xs font-bold text-success sm:text-sm">
            <PixelIcon name="shield" className="h-4 w-4" /> Compra segura
          </p>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/politica-de-privacidade" className="hover:underline">Privacidade</Link>
          <Link href="/termos" className="hover:underline">Termos</Link>
          <Link href="/trocas-e-devolucoes" className="hover:underline">Trocas e devoluções</Link>
        </nav>
        <p className="mt-2">© {new Date().getFullYear()} {s.company_name || s.store_name}</p>
      </footer>
    </div>
  );
}
