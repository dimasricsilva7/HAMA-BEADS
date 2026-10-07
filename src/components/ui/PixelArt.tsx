import { PIXEL_ICON_ROWS, spritePixels } from "@/lib/pixel-art";

/** Sprite em pixel art renderizado como "beads" (SVG inline, sem requisições). */
export function PixelArt({ sprite, className = "", title, board = false }: { sprite: string; className?: string; title?: string; board?: boolean }) {
  const { width, height, pixels } = spritePixels(sprite);
  const size = Math.max(width, height);
  const offX = (size - width) / 2;
  const offY = (size - height) / 2;
  return (
    <svg viewBox={`0 0 ${size * 10} ${size * 10}`} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {board &&
        Array.from({ length: size * size }, (_, i) => (
          <circle key={`b${i}`} cx={(i % size) * 10 + 5} cy={Math.floor(i / size) * 10 + 5} r={1.1} fill="currentColor" opacity={0.12} />
        ))}
      {pixels.map((p, i) => (
        <g key={i} transform={`translate(${(p.x + offX) * 10} ${(p.y + offY) * 10})`}>
          <rect x={0.5} y={0.5} width={9} height={9} rx={3.4} fill={p.color} />
          <circle cx={5} cy={5} r={1.7} fill="#000" opacity={0.16} />
        </g>
      ))}
    </svg>
  );
}

/** Ícone 8×8 monocromático (usa currentColor). */
export function PixelIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const rows = PIXEL_ICON_ROWS[name] ?? PIXEL_ICON_ROWS.star;
  return (
    <svg viewBox="0 0 8 8" className={className} aria-hidden="true" shapeRendering="crispEdges">
      {rows.flatMap((row, y) => [...row].map((ch, x) => (ch === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null)))}
    </svg>
  );
}
