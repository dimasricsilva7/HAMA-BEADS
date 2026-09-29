import Image from "next/image";
import { spritePixels } from "@/lib/pixel-art";

/**
 * Pegboard LED: foto real (quando cadastrada no admin) ou ilustração de uma placa
 * escura com o desenho aceso — claramente marcada como ilustração.
 */
export function LedBoard({ imageUrl, sprite = "heart", className = "", label = true, sizes = "(min-width: 1024px) 40vw, 90vw" }: { imageUrl?: string | null; sprite?: string; className?: string; label?: boolean; sizes?: string }) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-ink ${className}`}>
        <Image src={imageUrl} alt="Pegboard LED com app" fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  const { width, height, pixels } = spritePixels(sprite);
  const size = 16;
  const offX = Math.floor((size - width) / 2);
  const offY = Math.floor((size - height) / 2);
  const lit = new Map(pixels.map((p) => [`${p.x + offX},${p.y + offY}`, p.color]));
  return (
    <div className={`relative overflow-hidden bg-[#0d0b1e] ${className}`} role="img" aria-label="Ilustração do Pegboard LED com o desenho aceso">
      <div className="absolute inset-[7%] rounded-[10%] bg-[#161331] p-[4%] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.06)]">
        <div className="grid h-full w-full gap-[2.2%]" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: size * size }, (_, i) => {
            const c = lit.get(`${i % size},${Math.floor(i / size)}`);
            return (
              <span
                key={i}
                className="aspect-square rounded-full"
                style={c ? { background: c, boxShadow: `0 0 6px 1px ${c}, 0 0 14px 2px ${c}66` } : { background: "rgba(255,255,255,0.07)" }}
              />
            );
          })}
        </div>
      </div>
      {label && <span className="absolute right-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">Ilustração</span>}
    </div>
  );
}
