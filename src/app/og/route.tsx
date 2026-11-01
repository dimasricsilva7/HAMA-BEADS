import { ImageResponse } from "next/og";

export const runtime = "edge";
const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: 76, background: "#071007", color: "#fff", fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 660 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 62, height: 62, borderRadius: 18, background: "#84BD00", alignItems: "center", justifyContent: "center" }}>
              <svg width="44" height="44" viewBox="0 0 64 64">
                <path d="M8 39c8 2 14-1 19-6l8-8c3-3 7-4 11-2l8 5c4 3 4 8 1 11-2 2-5 4-9 4H18c-5 0-8-1-10-4Z" fill="#fff"/>
                <path d="M15 47h34M31 25l3-7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>CROCS SHOP</div>
              <div style={{ display: "flex", fontSize: 14, color: "#c9d4bc" }}>LOJA INDEPENDENTE</div>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 48, fontSize: 64, lineHeight: 1.03, fontWeight: 800, letterSpacing: -2 }}>Encontre seu próximo favorito.</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 28, lineHeight: 1.35, color: "#d8dfd0" }}>Calçados, cores, tamanhos e Jibbitz.</div>
          <div style={{ display: "flex", marginTop: 34, fontSize: 16, color: "#a6bd87" }}>Revendedor independente · Consulte as condições da loja</div>
        </div>
        <div style={{ display: "flex", width: 370, height: 360, alignItems: "center", justifyContent: "center", borderRadius: 34, background: "#12200f", marginLeft: 30 }}>
          <svg width="320" height="270" viewBox="0 0 320 270">
            <path d="M26 166c21 10 43 4 62-12l54-50c20-19 42-22 64-8l78 48c20 12 19 37 4 52-11 12-29 20-49 20H75c-31 0-49-12-49-50Z" fill="#f8f8f4"/>
            <path d="M50 204h220M91 101l17-35M131 91l16-31M172 84l14-24" stroke="#84BD00" strokeWidth="11" strokeLinecap="round"/>
            <path d="M89 165h140" stroke="#a4d63b" strokeWidth="14" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
