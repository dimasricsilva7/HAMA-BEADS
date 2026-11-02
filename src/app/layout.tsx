import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/env";
import { themeCss } from "@/lib/theme";
import { getSettings } from "@/server/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const storeName = /hama|beads|pegboard|contas|pixel/i.test(s.store_name || "") ? "Calçados & Acessórios" : (s.store_name || "Calçados & Acessórios");
  const title = s.seo_title && !/hama|beads|pegboard|contas|pixel/i.test(s.seo_title) ? s.seo_title : `${storeName} — Calçados e acessórios`;
  const description = s.seo_description && !/hama|beads|pegboard|contas|pixel/i.test(s.seo_description) ? s.seo_description : "Explore calçados e acessórios, compare modelos, cores e tamanhos e confira as condições de compra.";
  const images = ["/og"];
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${storeName}` },
    description,
    applicationName: storeName,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "pt_BR", siteName: storeName, title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FFFFFF", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const css = themeCss(settings);
  return (
    <html lang="pt-BR">
      <head>{css && <style id="theme-tokens">{css}</style>}</head>
      <body>{children}</body>
    </html>
  );
}
