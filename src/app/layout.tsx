import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Silkscreen } from "next/font/google";
import { siteUrl } from "@/lib/env";
import { themeCss } from "@/lib/theme";
import { getSettings } from "@/server/settings";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"], display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700", "800"], display: "swap" });
const pixel = Silkscreen({ subsets: ["latin"], variable: "--font-pixel", weight: ["400"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = s.seo_title || s.store_name;
  const description = s.seo_description;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${s.store_name}` },
    description,
    applicationName: s.store_name,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "pt_BR", siteName: s.store_name, title, description, ...(s.og_image_url ? { images: [s.og_image_url] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(s.og_image_url ? { images: [s.og_image_url] } : {}) },
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FFF9F0", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const css = themeCss(settings);
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${pixel.variable}`}>
      <head>{css && <style id="theme-tokens">{css}</style>}</head>
      <body>{children}</body>
    </html>
  );
}
