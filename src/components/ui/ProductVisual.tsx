import { ShoeArtwork } from "@/components/store/ShoeArtwork";

/** Placeholder original para produtos sem foto cadastrada; substitua pela imagem autorizada no admin. */
export function ProductVisual({
  imageUrl,
  name,
  category = "CLOGS",
  index = 0,
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
        <img src={imageUrl} alt={name} loading={priority ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  const tones: Record<string, number> = { CLOGS: 0, SANDALS: 2, SLIDES: 1, KIDS: 3, JIBBITZ: 4, FOOTWEAR: 0 };
  const tone = (tones[category] ?? index) % 5;
  const backgrounds = ["#ECE7DE", "#E8E8E6", "#EFE6DF", "#E5E8E1", "#E8E6EE"];
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: backgrounds[tone] }} role="img" aria-label={`${name} — arte ilustrativa provisória`}>
      <div className="w-[88%] rotate-[-7deg]"><ShoeArtwork tone={tone}/></div>
      <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Arte ilustrativa</span>
    </div>
  );
}
