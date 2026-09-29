import Link from "next/link";
import type { Settings } from "@/server/settings";
import { Logo } from "./Logo";
import { PixelIcon } from "@/components/ui/PixelArt";

export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function Footer({ s }: { s: Settings }) {
  const wa = s.whatsapp ? whatsappLink(s.whatsapp) : null;
  const socials = [
    ["Instagram", s.instagram_url],
    ["TikTok", s.tiktok_url],
    ["Facebook", s.facebook_url],
    ["YouTube", s.youtube_url],
  ].filter(([, url]) => url && /^https:\/\//.test(url));
  const hasContact = wa || s.contact_email || s.contact_phone;

  return (
    <footer className="mt-auto bg-ink pb-28 pt-12 text-white/80 lg:pb-12">
      <div className="pixel-border -mt-12 mb-12 h-1.5" aria-hidden="true" />
      <div className="container-page grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="text-white">
          <Logo name={s.store_name} logoUrl={s.logo_url || null} />
          {s.store_tagline && <p className="mt-3 max-w-xs text-sm text-white/70">{s.store_tagline}</p>}
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <PixelIcon name="pix" className="h-4 w-4 text-success" /> Pagamento via PIX
          </p>
        </div>
        <nav aria-label="Loja">
          <p className="eyebrow text-white">Loja</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/#kits" className="hover:text-white">Kits</Link></li>
            <li><Link href="/loja" className="hover:text-white">Todos os produtos</Link></li>
            <li><Link href="/#faq" className="hover:text-white">Perguntas frequentes</Link></li>
            <li><Link href="/acompanhar" className="hover:text-white">Acompanhar pedido</Link></li>
          </ul>
        </nav>
        <nav aria-label="Políticas">
          <p className="eyebrow text-white">Políticas</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/politica-de-privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link href="/termos" className="hover:text-white">Termos de uso</Link></li>
            <li><Link href="/trocas-e-devolucoes" className="hover:text-white">Trocas e devoluções</Link></li>
            <li><Link href="/cookies" className="hover:text-white">Cookies</Link></li>
          </ul>
        </nav>
        {(hasContact || socials.length > 0) && (
          <div>
            <p className="eyebrow text-white">Atendimento</p>
            <ul className="mt-3 space-y-2 text-sm">
              {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a></li>}
              {s.contact_email && <li><a href={`mailto:${s.contact_email}`} className="break-all hover:text-white">{s.contact_email}</a></li>}
              {s.contact_phone && <li>{s.contact_phone}</li>}
              {s.support_hours && <li className="text-white/60">{s.support_hours}</li>}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                {socials.map(([label, url]) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center rounded-full bg-white/10 px-3 hover:bg-white/20">{label}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="container-page mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
        {s.footer_text && <p className="mb-2">{s.footer_text}</p>}
        <p>
          © {new Date().getFullYear()} {s.company_name || s.store_name}
          {s.company_document ? ` · CNPJ ${s.company_document}` : ""}
          {s.address ? ` · ${s.address}` : ""}
        </p>
      </div>
    </footer>
  );
}
