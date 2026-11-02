import Link from "next/link";

export default function NotFound() {
  return <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
    <span className="grid h-16 w-16 place-items-center rounded-full bg-[#f2f6ec] text-[#548e2e]">
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
    </span>
    <h1 className="mt-5 text-3xl font-extrabold text-[#222]">Página não encontrada</h1>
    <p className="mt-3 text-sm leading-6 text-[#666]">Não encontramos o endereço que você acessou. Volte à loja para continuar navegando.</p>
    <Link href="/" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#84bd45] px-6 text-sm font-extrabold text-[#17230d]">Ir para a loja</Link>
  </div>;
}
