"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", scope: "ui", message: error.message, digest: error.digest }));
  }, [error]);
  return <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
    <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f2f6ec] text-[#548e2e]">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8v4m0 4h.01" /><circle cx="12" cy="12" r="9" /></svg>
    </span>
    <h1 className="mt-4 text-2xl font-extrabold">Algo não saiu como esperado</h1>
    <p className="mt-3 text-sm text-muted">Tente novamente em instantes. Se o problema continuar, fale com o nosso atendimento.</p>
    <div className="mt-6 flex gap-2"><button onClick={reset} className="btn-primary">Tentar novamente</button><Link href="/" className="btn-light">Início</Link></div>
  </div>;
}
