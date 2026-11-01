import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Logo PNG para mensagens da loja independente. */
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "transparent", fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "flex", width: 58, height: 58, borderRadius: 16, background: "#84BD00", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <svg width="42" height="42" viewBox="0 0 64 64">
            <path d="M8 39c8 2 14-1 19-6l8-8c3-3 7-4 11-2l8 5c4 3 4 8 1 11-2 2-5 4-9 4H18c-5 0-8-1-10-4Z" fill="#fff"/>
            <path d="M15 47h34M31 25l3-7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: "#222" }}>
          <div style={{ display: "flex", fontSize: 25, fontWeight: 800, letterSpacing: 0.4 }}>CROCS SHOP</div>
          <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: "#648f00", letterSpacing: 1.8 }}>LOJA INDEPENDENTE</div>
        </div>
      </div>
    ),
    { width: 380, height: 72, headers: { "Cache-Control": "public, max-age=604800" } }
  );
}
