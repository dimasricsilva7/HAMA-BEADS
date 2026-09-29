"use client";

import { useEffect, useRef, useState } from "react";
import { track, trackOnce } from "@/lib/client/tracking";

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&playsinline=1`;
  const vimeo = url.match(/vimeo\.com\/(\d{5,12})/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/**
 * Vídeo vertical (mobile-first). Arquivo de vídeo: autoplay mudo quando visível,
 * com eventos video_start / 25 / 50 / 75 / complete. YouTube/Vimeo: embed leve.
 */
export function VideoSection({ title, subtitle, mobileUrl, desktopUrl, posterUrl }: { title: string | null; subtitle: string | null; mobileUrl: string; desktopUrl: string | null; posterUrl: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(mobileUrl);
  const [muted, setMuted] = useState(true);
  const [embedOpen, setEmbedOpen] = useState(false);
  const embed = embedUrl(mobileUrl);

  useEffect(() => {
    if (desktopUrl && window.matchMedia("(min-width: 1024px)").matches) setSrc(desktopUrl);
  }, [desktopUrl]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.5 }
    );
    io.observe(v);
    const fired = new Set<number>();
    const onPlay = () => trackOnce("video_start", "video_start", { element: "landing_video" });
    const onTime = () => {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      for (const q of [25, 50, 75]) {
        if (pct >= q && !fired.has(q)) {
          fired.add(q);
          track(`video_${q}`, { element: "landing_video" });
        }
      }
    };
    const onEnd = () => trackOnce("video_complete", "video_complete", { element: "landing_video" });
    v.addEventListener("play", onPlay);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => {
      io.disconnect();
      v.removeEventListener("play", onPlay);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, [src]);

  return (
    <section id="video" className="section pt-4">
      <div className="container-page grid items-center gap-8 lg:grid-cols-[1fr_380px] lg:gap-16">
        <div className="lg:order-2 lg:hidden">
          {title && <h2 className="h-section text-center">{title}</h2>}
          {subtitle && <p className="lead mt-2 text-center">{subtitle}</p>}
        </div>
        <div className="hidden lg:block">
          {title && <h2 className="h-section">{title}</h2>}
          {subtitle && <p className="lead mt-3 max-w-md">{subtitle}</p>}
          <a href="#kits" data-cta="video_cta" className="btn-primary mt-8">
            Escolher meu kit
          </a>
        </div>
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-card border-2 border-ink bg-ink shadow-pixel">
          {embed ? (
            embedOpen ? (
              <iframe src={`${embed}&autoplay=1`} title={title ?? "Vídeo"} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
            ) : (
              <button
                onClick={() => {
                  setEmbedOpen(true);
                  trackOnce("video_start", "video_start", { element: "landing_video_embed" });
                }}
                className="absolute inset-0 grid place-items-center bg-cover bg-center"
                style={posterUrl ? { backgroundImage: `url(${posterUrl})` } : undefined}
                aria-label="Reproduzir vídeo"
              >
                <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-ink shadow-lift">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </button>
            )
          ) : (
            <>
              <video key={src} ref={ref} src={src} poster={posterUrl ?? undefined} muted={muted} playsInline preload="metadata" controls={!muted} className="absolute inset-0 h-full w-full object-cover" aria-label={title ?? "Vídeo do produto"} />
              {muted && (
                <button
                  onClick={() => {
                    setMuted(false);
                    const v = ref.current;
                    if (v) {
                      v.muted = false;
                      v.play().catch(() => {});
                    }
                  }}
                  className="absolute bottom-3 left-1/2 flex min-h-[44px] -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-bold text-ink shadow-lift"
                >
                  🔊 Ativar som
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
