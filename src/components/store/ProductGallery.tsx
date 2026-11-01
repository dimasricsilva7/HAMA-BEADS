"use client";

import Image from "next/image";
import { useState } from "react";

type ImageItem = { url: string; alt?: string };

export default function ProductGallery({ images, name }: { images: ImageItem[]; name: string }) {
  const safeImages = images.filter((image) => /^https:\/\//.test(image.url));
  const [active, setActive] = useState(0);
  if (!safeImages.length) {
    return <div className="grid aspect-square place-items-center rounded-sm bg-[#f6f5f1] text-sm text-[#777]">Imagem indisponível</div>;
  }
  const selected = safeImages[Math.min(active, safeImages.length - 1)];
  return (
    <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
      {safeImages.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:max-h-[620px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
          {safeImages.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagem ${index + 1} de ${safeImages.length}`}
              aria-pressed={active === index}
              className={`relative aspect-square w-[68px] shrink-0 overflow-hidden border bg-white transition ${active === index ? "border-[#333] ring-1 ring-[#333]" : "border-[#e6e6e6] hover:border-[#999]"}`}
            >
              <Image src={image.url} alt={image.alt || name} fill sizes="68px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
      <div className="relative order-1 aspect-square min-w-0 overflow-hidden bg-white sm:order-2">
        <Image
          src={selected.url}
          alt={selected.alt || name}
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="object-contain p-2 sm:p-4"
        />
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 text-[11px] text-[#555]">
            {active + 1} / {safeImages.length}
          </div>
        )}
      </div>
    </div>
  );
}
