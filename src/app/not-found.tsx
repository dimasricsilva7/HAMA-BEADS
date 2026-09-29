import Link from "next/link";
import { PixelArt } from "@/components/ui/PixelArt";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <PixelArt sprite="frog" className="w-24" />
      <h1 className="mt-4 font-display text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-3 text-muted">Essa peça não encaixa aqui. Que tal voltar e escolher seu kit?</p>
      <Link href="/" className="btn-primary mt-6">Ir para a loja</Link>
    </div>
  );
}
