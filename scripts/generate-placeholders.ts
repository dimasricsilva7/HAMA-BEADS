/**
 * Gera os placeholders estáticos (public/placeholders/*.svg) a partir dos sprites.
 * São imagens ilustrativas, claramente substituíveis pelo admin por fotos reais.
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { SPRITE_KEYS, spriteSvg } from "../src/lib/pixel-art";

const dir = path.join(process.cwd(), "public", "placeholders");
mkdirSync(dir, { recursive: true });
const BACKGROUNDS = ["#FFF1D6", "#E4F4FF", "#FFE4EF", "#E7F8EC", "#EFE8FF", "#FFF9F0"];
SPRITE_KEYS.forEach((key, i) => {
  writeFileSync(path.join(dir, `${key}.svg`), spriteSvg(key, { board: true, background: BACKGROUNDS[i % BACKGROUNDS.length], label: "Ilustração" }));
});
console.log(`${SPRITE_KEYS.length} placeholders gerados em public/placeholders`);
