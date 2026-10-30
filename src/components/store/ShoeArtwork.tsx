export function ShoeArtwork({ tone = 0 }: { tone?: number }) {
  const upper = ["#E8E4DC", "#30343A", "#B8A48E", "#D5C9BD", "#6F766D"][Math.abs(tone) % 5];
  const sole = ["#282725", "#181818", "#5E5146", "#E9E5DF", "#2E3330"][Math.abs(tone) % 5];
  return (
    <svg viewBox="0 0 560 360" role="img" aria-label="Ilustração genérica de calçado" className="h-full w-full drop-shadow-xl">
      <defs>
        <linearGradient id="shoe-upper" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor={upper}/></linearGradient>
        <linearGradient id="shoe-sole" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sole}/><stop offset="1" stopColor="#101010"/></linearGradient>
      </defs>
      <ellipse cx="280" cy="304" rx="215" ry="24" fill="#111" opacity=".17"/>
      <path d="M68 222 C88 166 128 120 194 88 C241 65 287 77 331 108 L431 177 C464 199 478 233 461 260 C448 281 421 290 389 290 L113 290 C78 290 56 264 68 222Z" fill="url(#shoe-sole)" stroke="#171717" strokeWidth="6"/>
      <path d="M80 209 C100 162 134 122 196 88 C241 63 285 76 329 105 L421 170 C449 190 457 215 443 236 C430 253 408 260 380 260 L123 260 C91 260 68 240 80 209Z" fill="url(#shoe-upper)" stroke={upper} strokeWidth="5"/>
      <path d="M97 211 C161 237 253 242 337 232 C384 226 416 214 441 197" fill="none" stroke="#777" strokeOpacity=".26" strokeWidth="5"/>
      {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={164 + i * 27} cy={145 + (i % 2) * 14} rx="7" ry="12" transform={`rotate(26 ${164 + i * 27} ${145 + (i % 2) * 14})`} fill="#777" opacity=".48" />)}
      <path d="M116 168 C88 131 78 99 106 86 C133 74 153 101 153 131" fill="none" stroke={upper} strokeWidth="18" strokeLinecap="round"/>
      <path d="M116 168 C88 131 78 99 106 86 C133 74 153 101 153 131" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  );
}
