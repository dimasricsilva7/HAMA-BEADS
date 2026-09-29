"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsent, setConsent, track } from "@/lib/client/tracking";

/** Consentimento de cookies de medição/marketing (LGPD). Cookies essenciais não dependem dele. */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(getConsent() === null), []);
  if (!show) return null;
  const choose = (v: "granted" | "denied") => {
    setConsent(v);
    track("cookie_consent", { props: { choice: v } });
    setShow(false);
  };
  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-lift sm:bottom-5" role="dialog" aria-label="Preferências de cookies">
      <p className="text-sm leading-relaxed text-ink">
        Usamos cookies essenciais para a loja funcionar e, com a sua permissão, cookies de medição e marketing para melhorar nossos anúncios.{" "}
        <Link href="/cookies" className="font-semibold text-primary underline">
          Saiba mais
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => choose("granted")} className="min-h-[44px] flex-1 rounded-xl bg-ink px-4 text-sm font-bold text-white">
          Aceitar
        </button>
        <button onClick={() => choose("denied")} className="min-h-[44px] flex-1 rounded-xl border-2 border-line px-4 text-sm font-bold">
          Somente essenciais
        </button>
      </div>
    </div>
  );
}
