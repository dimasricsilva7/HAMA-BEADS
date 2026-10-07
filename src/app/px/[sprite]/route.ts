import { SPRITES, spritePixels } from "@/lib/pixel-art";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return Object.keys(SPRITES).flatMap((k) => [{ sprite: `${k}.svg` }, { sprite: `${k}-b.svg` }]);
}

/**
 * Sprite "bead" como arquivo SVG em cache (em vez de centenas de elementos no HTML).
 * /px/heart.svg · /px/heart-b.svg (com os pinos do pegboard ao fundo)
 */
export async function GET(_: Request, { params }: { params: Promise<{ sprite: string }> }) {
  const { sprite } = await params;
  const m = sprite.match(/^([a-z0-9]+)(-b)?\.svg$/);
  if (!m || !(m[1] in SPRITES)) return new Response("not found", { status: 404 });
  const board = Boolean(m[2]);
  const { width, height, pixels } = spritePixels(m[1]);
  const size = Math.max(width, height);
  const offX = (size - width) / 2;
  const offY = (size - height) / 2;
  const pins = board
    ? Array.from({ length: size * size }, (_, i) => `<circle cx="${(i % size) * 10 + 5}" cy="${Math.floor(i / size) * 10 + 5}" r="1.1" fill="#17142E" opacity=".12"/>`).join("")
    : "";
  const beads = pixels
    .map((p) => `<use href="#b" x="${(p.x + offX) * 10}" y="${(p.y + offY) * 10}" fill="${p.color}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * 10} ${size * 10}"><defs><g id="b"><rect x=".5" y=".5" width="9" height="9" rx="3.4"/><circle cx="5" cy="5" r="1.7" fill="#000" opacity=".16"/></g></defs>${pins}${beads}</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400" } });
}
