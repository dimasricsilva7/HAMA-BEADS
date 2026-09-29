import { ImageResponse } from "next/og";
import { spritePixels } from "@/lib/pixel-art";

/** Logo em PNG para e-mails (clientes de e-mail não exibem SVG). */
export function GET() {
  const { pixels } = spritePixels("heart");
  const cell = 7;
  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", background: "transparent" }}>
        <div style={{ display: "flex", position: "relative", width: 11 * cell, height: 10 * cell, marginRight: 14 }}>
          {pixels.map((p, i) => (
            <div key={i} style={{ position: "absolute", left: p.x * cell, top: p.y * cell, width: cell - 1, height: cell - 1, borderRadius: 2, background: p.color }} />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#17142E", letterSpacing: -1 }}>HAMA BEADS</div>
      </div>
    ),
    { width: 400, height: 80, headers: { "Cache-Control": "public, max-age=604800" } }
  );
}
