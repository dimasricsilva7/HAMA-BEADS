"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LookupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/order-lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: fd.get("orderNumber"), email: fd.get("email") }) });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Não encontramos o pedido.");
          router.push(json.url);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Não encontramos o pedido.");
          setLoading(false);
        }
      }}
    >
      <div>
        <label htmlFor="orderNumber" className="label">Número do pedido</label>
        <input id="orderNumber" name="orderNumber" required placeholder="HB-2026-00001" className="input uppercase" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" inputMode="email" />
      </div>
      {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Buscando…" : "Ver meu pedido"}
      </button>
    </form>
  );
}
