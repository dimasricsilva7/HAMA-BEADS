export function ShoeArtwork({ tone = 0 }: { tone?: number }) {
  const upper = ["#E8E4DC", "#30343A", "#B8A48E", "#D5C9BD", "#6F766D"][Math.abs(tone) % 5];
  const sole = ["#282725", "#181818", "#5E5146", "#E9E5DF", "#2E3330"][Math.abs(tone) % 5];
  return (
    <svg viewBox="0 0 560 360" role="img" aria-label="Ilustração genérica original de tênis" className="h-full w-full drop-shadow-xl">
      <defs>
        <linearGradient id="sneaker-upper" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor={upper}/></linearGradient>
        <linearGradient id="sneaker-sole" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={sole}/><stop offset="1" stopColor="#101010"/></linearGradient>
      </defs>
      <ellipse cx="280" cy="304" rx="215" ry="24" fill="#111" opacity=".17"/>
      <path d="M58 230 C79 210 105 197 143 191 L213 176 C238 169 255 151 269 132 L293 105 C309 87 327 84 349 98 L414 147 C445 170 478 191 494 218 C506 238 497 264 477 275 C457 286 423 290 384 290 L106 290 C71 290 48 265 58 230Z" fill="url(#sneaker-sole)" stroke="#171717" strokeWidth="6"/>
      <path d="M68 219 C95 196 124 187 164 183 L222 171 C244 166 259 149 274 128 L296 100 C311 84 327 84 347 98 L408 145 C439 167 470 188 482 211 C491 228 481 246 460 252 C423 261 367 254 319 253 L131 253 C98 253 77 243 68 219Z" fill="url(#sneaker-upper)" stroke={upper} strokeWidth="5"/>
      <path d="M80 224 C178 244 333 246 482 222" fill="none" stroke="#777" strokeOpacity=".27" strokeWidth="5"/>
      <path d="M225 172 C243 174 260 183 274 198 M244 154 C266 159 283 169 295 185 M261 136 C282 142 299 152 311 167" fill="none" stroke="#777" strokeOpacity=".65" strokeWidth="7" strokeLinecap="round"/>
      <path d="M220 177 L300 194 M238 158 L315 177 M257 139 L331 160" fill="none" stroke="#777" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round"/>
      <path d="M360 114 C348 144 335 168 323 196" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="5"/>
      <path d="M108 213 C122 205 144 199 165 197" fill="none" stroke="#777" strokeOpacity=".32" strokeWidth="4"/>
    </svg>
  );
}
