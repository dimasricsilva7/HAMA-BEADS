import Image from "next/image";

export function Logo({ name, logoUrl, className = "" }: { name: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl) {
    return (
      <span className={`relative block h-9 w-36 ${className}`}>
        <Image src={logoUrl} alt={name} fill sizes="144px" className="object-contain object-left" priority />
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 14.5c2.3.3 4.1-.4 5.6-1.8l2.1-2c1.3-1.2 2.3-1.4 3.8-.6l4.6 2.6c1.1.6 1.5 1.8 1 2.9-.4 1-1.3 1.7-2.5 1.7H7.2c-2 0-3.3-.8-3.7-2.8Z"/>
          <path d="M4.5 18h14.2M12 8.5l1.3-2.2"/>
        </svg>
      </span>
      <span className="font-display text-base font-extrabold leading-none tracking-tight text-ink sm:text-lg">{name}</span>
    </span>
  );
}
