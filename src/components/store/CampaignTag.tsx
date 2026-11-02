export function CampaignTag({ label = "BLACK FRIDAY", discountPercent }: { label?: string; discountPercent?: number | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex min-h-[24px] items-center rounded-full bg-[#9fd06e] px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#15210b]">{label}</span>
      {discountPercent != null && discountPercent > 0 && (
        <span className="inline-flex min-h-[24px] items-center rounded-full border border-[#4e9825] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#4e9825]">-{Math.min(100, Math.round(discountPercent))}%</span>
      )}
    </span>
  );
}

export function ColorDot({ value, background, size = "sm" }: { value: string; background: string; size?: "sm" | "md" }) {
  const box = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return <span title={value} aria-label={value} className={`${box} inline-block shrink-0 rounded-full border border-black/15`} style={{ background }} />;
}
