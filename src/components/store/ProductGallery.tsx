"use client";

import Image from "next/image";
import { useState } from "react";
import { FavoriteButton } from "@/components/store/FavoriteButton";

type ImageItem = { url: string; alt?: string };

export default function ProductGallery({ images, name, productId }: { images: ImageItem[]; name: string; productId: string }) {
  const safeImages = images.filter((image) => /^https:\/\//.test(image.url));
  const [active, setActive] = useState(0);
  if (!safeImages.length) return <div className="grid aspect-square place-items-center rounded-sm bg-[#f6f5f1] text-sm text-[#777]">Imagem indisponível</div>;
  const selected = safeImages[Math.min(active, safeImages.length - 1)];

  async function shareProduct() {
    try {
      if (navigator.share) await navigator.share({ title: name, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Cancelar o compartilhamento não interrompe a navegação.
    }
  }

  return <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
    {safeImages.length > 1 && <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:max-h-[680px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
      {safeImages.map((image, index) => <button key={image.url} type="button" onClick={() => setActive(index)}
        aria-label={`Ver imagem ${index + 1} de ${safeImages.length}`} aria-pressed={active === index}
        className={`relative aspect-square w-[68px] shrink-0 overflow-hidden border bg-white transition ${active === index ? "border-[#333] ring-1 ring-[#333]" : "border-[#e6e6e6] hover:border-[#999]"}`}>
        <Image src={image.url} alt={image.alt || name} fill sizes="68px" className="object-contain p-1" />
      </button>)}
    </div>}
    <div className="relative order-1 aspect-square min-w-0 overflow-hidden bg-[#f7f6f1] sm:order-2">
      <Image src={selected.url} alt={selected.alt || name} fill priority sizes="(min-width:1024px) 55vw,100vw" className="object-contain p-3 sm:p-6" />
      <FavoriteButton productId={productId} className="absolute left-4 top-4" />
      <button type="button" onClick={shareProduct} aria-label="Compartilhar produto"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#222] shadow-sm backdrop-blur transition hover:bg-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" /></svg>
      </button>
      {safeImages.length > 1 && <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] text-[#555]">{active + 1} / {safeImages.length}</div>}
    </div>
  </div>;
}
