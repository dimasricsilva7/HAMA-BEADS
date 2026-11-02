export function Logo({ name, className = "" }: { name: string; logoUrl?: string | null; className?: string }) {
  const legacyName = /hama|beads|pegboard|contas|pixel/i.test(name);
  const displayName = legacyName ? "Calçados & Acessórios" : (name.trim() || "Calçados & Acessórios");
  return <span className={`flex items-center gap-2.5 ${className}`}>
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#84bd45] text-white">
      <svg viewBox="0 0 32 32" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 19c3 .3 5.1-.6 7.1-2.4l3.1-3c1.4-1.3 3-1.4 4.7-.4l6.2 3.6c1.6.9 1.9 2.5 1.1 4-.7 1.2-1.9 1.8-3.5 1.8H10c-2.5 0-4.1-1-5-3.6Z" />
        <path d="M8 24.5h16M14.7 12.8l1.4-3" />
      </svg>
    </span>
    <span className="font-sans text-[15px] font-extrabold leading-none tracking-tight text-[#202020] sm:text-[17px]">{displayName}</span>
  </span>;
}
