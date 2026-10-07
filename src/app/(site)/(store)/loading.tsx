import { PixelArt } from "@/components/ui/PixelArt";

/** Carregando: visível (nunca parece página em branco) enquanto o servidor monta a página. */
export default function Loading() {
  return (
    <div className="container-page flex min-h-[100svh] flex-col items-center justify-center py-16 text-center" aria-busy="true" aria-live="polite">
      <PixelArt sprite="heart" className="w-16 animate-pulse" />
      <p className="mt-4 font-display text-xl font-extrabold">Separando as continhas…</p>
      <p className="mt-1 text-sm text-muted">Só um instante.</p>
    </div>
  );
}
