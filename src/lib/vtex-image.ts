/**
 * Redimensiona imagens hospedadas no VTEX Img antes de enviá-las ao navegador.
 * O CDN do VTEX aceita /arquivos/ids/{id}-{largura}-{altura}/arquivo.
 * URLs de outros provedores permanecem inalteradas.
 */
export function resizeVtexImage(src: string, width: number, height = width): string {
  if (!src || !Number.isFinite(width) || !Number.isFinite(height)) return src;
  try {
    const url = new URL(src);
    if (!url.hostname.toLowerCase().endsWith(".vteximg.com.br")) return src;
    const match = url.pathname.match(/^(\/arquivos\/ids\/)(\d+)(?:-\d+-\d+)?(\/.*)$/i);
    if (!match) return src;
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    url.pathname = `${match[1]}${match[2]}-${w}-${h}${match[3]}`;
    return url.toString();
  } catch {
    return src;
  }
}
