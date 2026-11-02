"use client";

import { useEffect, useState, type MouseEvent } from "react";

export const FAVORITES_STORAGE_KEY = "footwear_favorites_v1";
const FAVORITES_EVENT = "footwear:favorites-updated";

function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function FavoriteButton({ productId, className = "" }: { productId: string; className?: string }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setFavorite(readFavorites().includes(productId));
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const current = readFavorites();
    const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      setFavorite(next.includes(productId));
      window.dispatchEvent(new Event(FAVORITES_EVENT));
    } catch {
      setFavorite(false);
    }
  }

  return (
    <button type="button" onClick={toggle} aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorite}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#171717] shadow-sm backdrop-blur transition hover:scale-105 ${className}`}>
      <svg viewBox="0 0 24 24" className={`h-[22px] w-[22px] ${favorite ? "fill-[#b21f55] stroke-[#b21f55]" : "fill-none stroke-current"}`}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 5.9l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  );
}
