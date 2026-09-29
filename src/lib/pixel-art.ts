/**
 * Sprites originais em pixel art (desenhados para este projeto — sem personagens
 * protegidos). Usados como placeholders claramente substituíveis enquanto as fotos
 * reais não são enviadas pelo admin, e como ícones da identidade visual.
 */

export const BEAD_COLORS: Record<string, string> = {
  R: "#E8364F",
  D: "#B4213A",
  W: "#FFFFFF",
  Y: "#FFC53D",
  O: "#FF8A3D",
  P: "#FF7EB6",
  G: "#34C27A",
  L: "#1E8F55",
  K: "#17142E",
  C: "#54D2F0",
  B: "#2F4BFF",
  T: "#B87333",
  S: "#C9CFE0",
  E: "#7A4BFF",
  N: "#6B3E1F",
};

export const SPRITES: Record<string, { name: string; rows: string[] }> = {
  heart: {
    name: "Coração",
    rows: ["..RR...RR..", ".RRRR.RRRR.", "RRWRRRRRRRR", "RWRRRRRRRDR", "RRRRRRRRRDR", ".RRRRRRRDR.", "..RRRRRDR..", "...RRRDR...", "....RDR....", ".....R....."],
  },
  star: {
    name: "Estrela",
    rows: [".....Y.....", "....YYY....", "....YWY....", "YYYYYYYYYYY", ".YYYYYYYYY.", "..YYKYKYY..", "..YYYYYYY..", ".YYYYOYYYY.", ".YYY...YYY.", "YY.......YY"],
  },
  cat: {
    name: "Gatinho",
    rows: [".K........K.", ".KK......KK.", ".KOK....KOK.", ".KOOKKKKOOK.", "KOOOOOOOOOOK", "KOOKOOOOKOOK", "KOOKOOOOKOOK", "KPOOOKKOOOPK", "KOOOOOOOOOOK", ".KOOOOOOOOK.", "..KKKKKKKK.."],
  },
  cherry: {
    name: "Cerejas",
    rows: ["........LL...", ".......L.L...", "......L...L..", ".....L.....L.", "....L......L.", "..RRR....RRR.", ".RRWRR..RRWRR", ".RRRRR..RRRRR", ".RRRDR..RRRDR", "..RRR....RRR."],
  },
  icecream: {
    name: "Sorvete",
    rows: ["....PPP....", "...PPPPP...", "..PPWPPPP..", "..PPPPPPP..", ".NNPNNNPNN.", "..YTYTYTY..", "...TYTYT...", "...YTYTY...", "....TYT....", "....YTY....", ".....T....."],
  },
  flower: {
    name: "Flor",
    rows: ["...PP.PP...", "..PPPPPPP..", "..PPYYYPP..", ".PPPYYYPPP.", "..PPYYYPP..", "..PPPPPPP..", "...PP.PP...", ".....G.....", "..GG.G.....", "...GGG.GG..", ".....GGG...", ".....G....."],
  },
  frog: {
    name: "Sapinho",
    rows: [".GGG...GGG.", "GWWKG.GWWKG", "GWWKGGGWWKG", "GGGGGGGGGGG", "GPGGGGGGGPG", "GGRRRRRRRGG", "GGGRRRRRGGG", ".GGGGGGGGG.", ".LLGGGGGLL.", "LL.GG.GG.LL"],
  },
  rocket: {
    name: "Foguete",
    rows: [".....R.....", "....RRR....", "....WWW....", "...WWCWW...", "...WCCCW...", "...WWCWW...", "...WWWWW...", "..RWWWWWR..", ".RRWWWWWRR.", ".RR.WWW.RR.", ".....O.....", "....OYO....", ".....O....."],
  },
  cactus: {
    name: "Cacto",
    rows: ["....GG.....", "...GGGG....", "...GKGK..G.", ".G.GGGG.GG.", ".GGGPPG.GG.", "..GGGGGGGG.", "...GGGG....", "...GGGG....", ".TTTTTTTT..", "..TTTTTT...", "..TTTTTT..."],
  },
  gem: {
    name: "Diamante",
    rows: ["..CCCCCCC..", ".CWCCBCCCC.", "CWCCBBBCCCC", "CCCCCCCCCCC", ".BCCCCCCCB.", "..BCCCCCB..", "...BCCCB...", "....BCB....", ".....B....."],
  },
  donut: {
    name: "Rosquinha",
    rows: ["...TTTTT...", "..PPPWPPP..", ".PWPPYPPWP.", ".PPP...PPP.", ".PYP...PYP.", ".TPPP.PPPT.", "..TTTTTTT..", "...TTTTT..."],
  },
  gamepad: {
    name: "Controle",
    rows: ["..KKKKKKKKK..", ".KEEEEEEEEEK.", "KEEWEEEEERYEK", "KEWWWEEEGEBEK", "KEEWEEEEEREEK", "KEEEEKKKEEEEK", ".KEEK...KEEK.", "..KK.....KK.."],
  },
  robot: {
    name: "Robô",
    rows: ["....Y....", "....K....", ".KKKKKKK.", ".KSSSSSK.", ".KSCSCSK.", ".KSSSSSK.", ".KSRRRSK.", ".KKKKKKK.", "..KSBSK..", ".KKSSSKK."],
  },
  sun: {
    name: "Solzinho",
    rows: ["....Y.Y....", ".Y..YYY..Y.", "..YYYYYYY..", "..YOOOOOY..", "YYYOKOKOYYY", "..YPOOOPY..", "..YOKKKOY..", "..YYYYYYY..", ".Y..YYY..Y.", "....Y.Y...."],
  },
  bunny: {
    name: "Coelhinho",
    rows: [".W...W.", ".WP.PW.", ".WP.PW.", ".WW.WW.", "WWWWWWW", "WKWWWKW", "WPWPWPW", ".WWWWW."],
  },
  house: {
    name: "Casinha",
    rows: ["....RR.....", "...RRRR.KK.", "..RRRRRRKK.", ".RRRRRRRR..", "RRRRRRRRRR.", ".YYYYYYYY..", ".YCCYYTTY..", ".YCCYYTTY..", ".YYYYYTTY..", "GGGGGGGGGGG"],
  },
};

export type SpriteKey = keyof typeof SPRITES;
export const SPRITE_KEYS = Object.keys(SPRITES) as SpriteKey[];

/** Converte um sprite em pixels posicionados. */
export function spritePixels(key: string) {
  const sprite = SPRITES[key] ?? SPRITES.heart;
  const width = Math.max(...sprite.rows.map((r) => r.length));
  const pixels: { x: number; y: number; color: string }[] = [];
  sprite.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = BEAD_COLORS[ch];
      if (color) pixels.push({ x, y, color });
    })
  );
  return { width, height: sprite.rows.length, pixels };
}

/**
 * SVG de um sprite no estilo "bead": cada pixel é uma peça arredondada com furo.
 * Usado no servidor (placeholders estáticos) e no componente PixelArt.
 */
export function spriteSvg(key: string, opts: { background?: string; board?: boolean; padding?: number; label?: string } = {}) {
  const { width, height, pixels } = spritePixels(key);
  const pad = opts.padding ?? 2;
  const size = Math.max(width, height) + pad * 2;
  const offX = (size - width) / 2;
  const offY = (size - height) / 2;
  const cell = 20;
  const px = size * cell;
  const bg = opts.background ?? "#FFF9F0";
  const board = opts.board
    ? Array.from({ length: size * size }, (_, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        return `<circle cx="${x * cell + cell / 2}" cy="${y * cell + cell / 2}" r="2.2" fill="#17142E" opacity="0.10"/>`;
      }).join("")
    : "";
  const beads = pixels
    .map(
      (p) =>
        `<g transform="translate(${(p.x + offX) * cell} ${(p.y + offY) * cell})"><rect x="1" y="1" width="18" height="18" rx="7" fill="${p.color}"/><rect x="1" y="1" width="18" height="18" rx="7" fill="url(#shine)"/><circle cx="10" cy="10" r="3.4" fill="#000" opacity="0.18"/></g>`
    )
    .join("");
  const label = opts.label
    ? `<rect x="${px - 150}" y="${px - 42}" width="138" height="30" rx="15" fill="#17142E" opacity="0.72"/><text x="${px - 81}" y="${px - 22}" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#fff" text-anchor="middle">${opts.label}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="${px}" height="${px}"><defs><linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${px}" height="${px}" fill="${bg}"/>${board}${beads}${label}</svg>`;
}

/** Ícones monocromáticos 8×8 (identidade pixel). "#" = preenchido. */
export const PIXEL_ICON_ROWS: Record<string, string[]> = {
  heart: [".##.##..", "#######.", "#######.", "#######.", ".#####..", "..###...", "...#....", "........"],
  star: ["...##...", "...##...", "########", ".######.", "..####..", ".##..##.", "##....##", "........"],
  sparkle: ["...#....", "...#....", ".#####..", "...#....", "...#..#.", ".....###", "......#.", "........"],
  palette: ["..####..", ".#....#.", "#.#..#.#", "#......#", "#.#...#.", "#....#..", ".#...#..", "..###..."],
  grid: ["#.#.#.#.", "........", "#.#.#.#.", "........", "#.#.#.#.", "........", "#.#.#.#.", "........"],
  hand: ["..#.#...", ".##.##..", ".##.###.", ".######.", "########", ".######.", "..####..", "..####.."],
  gift: [".#....#.", "..#..#..", "########", "#...#..#", "########", ".#..#.#.", ".#..#.#.", ".######."],
  home: ["...##...", "..####..", ".######.", "########", ".##..##.", ".##..##.", ".##..##.", ".######."],
  clock: ["..####..", ".#.#..#.", "#..#...#", "#..###.#", "#......#", ".#....#.", "..####..", "........"],
  shield: [".######.", "#......#", "#..##..#", "#.####.#", "#..##..#", ".#....#.", "..#..#..", "...##..."],
  pix: ["...##...", "..#..#..", ".#.##.#.", "#.#..#.#", "#.#..#.#", ".#.##.#.", "..#..#..", "...##..."],
  chat: [".######.", "########", "##.#.#.#", "########", ".######.", ".##.....", ".#......", "........"],
  truck: ["........", "#####...", "#####.#.", "#####.##", "########", "########", ".#...#..", "........"],
  download: ["...##...", "...##...", "...##...", ".######.", "..####..", "...##...", "#......#", "########"],
  iron: ["..#####.", ".##...#.", "##....#.", "########", "########", "........", ".#.#.#..", "........"],
  check: [".......#", "......##", ".....##.", "#...##..", "##.##...", ".###....", "..#.....", "........"],
  smile: ["..####..", ".#....#.", "#.#..#.#", "#......#", "#.#..#.#", "#..##..#", ".#....#.", "..####.."],
  puzzle: ["..##....", "..##....", "######..", "######..", "#######.", "######..", "######..", "........"],
};
