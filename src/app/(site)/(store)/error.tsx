"use client";

import { useEffect } from "react";
import { PixelArt } from "@/components/ui/PixelArt";

/** Falha ao montar a página (ex.: banco demorando para acordar): tenta de novo sozinho, uma vez. */
export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    const key = "hb_auto_retry";
    let tried = false;
    try {
      tried = Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 30_000;
      if (!tried) sessionStorage.setItem(key, String(Date.now()));
    } catch {
      /* ignore */
    }
    if (!tried) {
      const t = setTimeout(() => window.location.reload(), 1500);
      return () => clearTimeout(t);
    }
  }, []);
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <PixelArt sprite="heart" className="w-16" />
      <p className="mt-4 font-display text-xl font-extrabold">Só um instante, estamos carregando a loja…</p>
      <button onClick={() => (reset(), window.location.reload())} className="btn-primary mt-6">
        Tentar de novo
      </button>
    </div>
  );
}
