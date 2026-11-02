"use client";

import { useEffect } from "react";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    const key = "footwear_auto_retry";
    let tried = false;
    try {
      tried = Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 30_000;
      if (!tried) sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // Retry manual remains available without sessionStorage.
    }
    if (!tried) {
      const timer = window.setTimeout(() => window.location.reload(), 1500);
      return () => window.clearTimeout(timer);
    }
  }, []);
  return <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
    <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f2f6ec] text-[#548e2e]">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8v4m0 4h.01" /><circle cx="12" cy="12" r="9" /></svg>
    </span>
    <h1 className="mt-5 text-2xl font-extrabold text-[#222]">Não foi possível carregar a loja</h1>
    <p className="mt-2 text-sm leading-6 text-[#666]">Ocorreu uma falha temporária. Tente novamente.</p>
    <button onClick={() => { reset(); window.location.reload(); }} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#84bd45] px-6 text-sm font-extrabold text-[#17230d]">Tentar novamente</button>
  </div>;
}
