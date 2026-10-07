import { PIXEL_ICON_ROWS, SPRITES } from "@/lib/pixel-art";

/**
 * Sprite em pixel art no estilo "beads". Servido como SVG em cache (/px/<sprite>.svg):
 * uma imagem leve em vez de centenas de elementos no HTML da página.
 */
export function PixelArt({ sprite, className = "", title, board = false }: { sprite: string; className?: string; title?: string; board?: boolean }) {
  const key = sprite in SPRITES ? sprite : "heart";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/px/${key}${board ? "-b" : ""}.svg`} width={100} height={100} alt={title ?? ""} aria-hidden={title ? undefined : true} className={className} draggable={false} decoding="async" />
  );
}

const iconPaths = new Map<string, string>();
/** Um único <path> por ícone (em vez de um <rect> por pixel): HTML bem menor. */
function iconPath(name: string) {
  const cached = iconPaths.get(name);
  if (cached) return cached;
  const rows = PIXEL_ICON_ROWS[name] ?? PIXEL_ICON_ROWS.star;
  const d = rows.flatMap((row, y) => [...row].map((ch, x) => (ch === "#" ? `M${x} ${y}h1v1h-1z` : ""))).join("");
  iconPaths.set(name, d);
  return d;
}

/** Ícone 8×8 monocromático (usa currentColor). */
export function PixelIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={className} aria-hidden="true" shapeRendering="crispEdges">
      <path d={iconPath(name)} fill="currentColor" />
    </svg>
  );
}
