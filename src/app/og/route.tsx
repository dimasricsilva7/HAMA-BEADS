import { ImageResponse } from "next/og";
import { spritePixels } from "@/lib/pixel-art";

const size = { width: 1200, height: 630 };

/** Imagem Open Graph padrão, usada quando Admin → Configurações → SEO não define uma imagem. */
export function GET() {
  const { width, height, pixels } = spritePixels("heart");
  const cell = 34;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF9F0", alignItems: "center", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#2F4BFF", letterSpacing: 6 }}>HAMA BEADS</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: "#17142E", lineHeight: 1.02, marginTop: 18 }}>Transforme pequenas peças em grandes criações.</div>
          <div style={{ display: "flex", fontSize: 30, color: "#625E7A", marginTop: 24 }}>Kits completos para criar Pixel Art em casa</div>
        </div>
        <div style={{ display: "flex", position: "relative", width: width * cell, height: height * cell, marginLeft: 40 }}>
          {pixels.map((p, i) => (
            <div key={i} style={{ position: "absolute", left: p.x * cell, top: p.y * cell, width: cell - 4, height: cell - 4, borderRadius: 12, background: p.color }} />
          ))}
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
