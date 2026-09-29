import Image from "next/image";
import { PixelArt } from "@/components/ui/PixelArt";

export function Logo({ name, logoUrl, className = "" }: { name: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl) {
    return (
      <span className={`relative block h-9 w-36 ${className}`}>
        <Image src={logoUrl} alt={name} fill sizes="144px" className="object-contain object-left" priority />
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <PixelArt sprite="heart" className="h-7 w-7" />
      <span className="font-display text-lg font-extrabold uppercase leading-none tracking-tight">{name}</span>
    </span>
  );
}
