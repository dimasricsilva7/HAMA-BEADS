import Image from "next/image";
import { PixelArt } from "./PixelArt";

const SPRITE_BY_CATEGORY: Record<string, string> = {
  KIT: "heart",
  BEADS: "cherry",
  PEGBOARD: "gem",
  TWEEZERS: "star",
  DIGITAL_MODELS: "rocket",
  ACCESSORY: "flower",
  TOOL: "robot",
  OTHER: "sun",
};
const BG = ["bg-[#FFF1D6]", "bg-[#E4F4FF]", "bg-[#FFE4EF]", "bg-[#E7F8EC]", "bg-[#EFE8FF]"];
const BEADS = ["#E8364F", "#FFC53D", "#2F4BFF", "#34C27A", "#FF7EB6", "#54D2F0", "#FF8A3D", "#7A4BFF"];

/**
 * Imagem do produto. Sem foto cadastrada, mostra um placeholder ilustrativo
 * (pegboard + beads) claramente marcado — substituível pelo admin.
 */
export function ProductVisual({
  imageUrl,
  name,
  category = "KIT",
  index = 0,
  sprite,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 33vw, 100vw",
}: {
  imageUrl?: string | null;
  name: string;
  category?: string;
  index?: number;
  sprite?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`}>
        <Image src={imageUrl} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const spriteKey = sprite ?? (category === "KIT" ? ["heart", "star", "gamepad", "cat"][index % 4] : SPRITE_BY_CATEGORY[category] ?? "sun");
  return (
    <div className={`relative overflow-hidden ${BG[index % BG.length]} ${className}`} role="img" aria-label={`${name} — imagem ilustrativa`}>
      <div className="pegboard absolute inset-0 opacity-70" />
      <div className="absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-[56%] rounded-[18%] bg-white/70 p-[6%] shadow-soft ring-1 ring-black/5">
        <PixelArt sprite={spriteKey} className="h-full w-full text-ink" board />
      </div>
      <div className="absolute inset-x-0 bottom-[7%] flex justify-center gap-[2.5%]" aria-hidden="true">
        {BEADS.map((c, i) => (
          <span key={c} className="block aspect-square w-[6.5%] rounded-[35%] shadow-sm" style={{ background: c, transform: `translateY(${(i % 3) * 3}px)` }} />
        ))}
      </div>
      <span className="absolute right-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-white">Ilustração</span>
    </div>
  );
}
