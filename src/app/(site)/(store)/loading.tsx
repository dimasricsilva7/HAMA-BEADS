export default function Loading() {
  return <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center" aria-busy="true" aria-live="polite">
    <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#e6e6e6] border-t-[#84bd45]" aria-hidden="true" />
    <p className="mt-5 text-base font-semibold text-[#333]">Carregando a loja...</p>
    <p className="mt-1 text-sm text-[#777]">Só mais um instante.</p>
  </div>;
}
