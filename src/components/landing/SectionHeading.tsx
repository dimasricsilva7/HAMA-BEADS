export function SectionHeading({ eyebrow, title, subtitle, align = "center", tone = "text-primary" }: { eyebrow?: string | null; title?: string | null; subtitle?: string | null; align?: "center" | "left"; tone?: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className={`eyebrow ${tone}`}>{eyebrow}</p>}
      {title && <h2 className="h-section mt-2">{title}</h2>}
      {subtitle && <p className="lead mt-3">{subtitle}</p>}
    </div>
  );
}
