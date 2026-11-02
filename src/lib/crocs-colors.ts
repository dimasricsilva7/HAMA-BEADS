/** Conversão de nomes oficiais de cores Crocs para swatches consistentes. */
const BASE_COLORS: [RegExp, string][] = [
  [/black|noir|onyx/, "#202124"],
  [/summit white|white|chalk|bone|ivory|milk|cream|almost white|snow|alabaster|parchment/, "#f2f0e8"],
  [/carbon|charcoal|elephant|slate|grey|gray|concrete|microchip|fog|smoke|pewter|graphite|storm|shark/, "#74787b"],
  [/navy|deep navy|midnight|ink|blue black/, "#172b4d"],
  [/cobalt|royal blue|bright cobalt|blue bolt|electric blue/, "#0877c9"],
  [/blue|aqua|arctic|sky|ice|teal|tide|pool|turquoise|lagoon|peacock|water|ocean/, "#36a9d6"],
  [/mint|sea glass|mint tint|apple ice|turbo teal|jade/, "#5cc9ad"],
  [/olive|army green|field green|grass green|green ivy|crocs green|moss|leaf|sage|cargo|tac green|aloe|fern|lime|citrus/, "#7c9b42"],
  [/pink caramel|pink milk|candy pink|ballerina|blush|ballet|rose|pink|bubble|dragon fruit|raspberry|guava|coral/, "#e99ab4"],
  [/red|cherry|flame|heritage red|tomato|pepper|dark cherry/, "#c83947"],
  [/orange|orangesicle|sunstone|tangerine|papaya|mango/, "#ed8a35"],
  [/yellow|lemon|sunshine|golden|butter|buttercream|banana|citron/, "#e8cc55"],
  [/purple moon|purple|plum|violet|lilac|lavender|grape|cassis|frosted grape|dreamscape/, "#9879b5"],
  [/brown|cocoa|chocolate|coffee|espresso|sepia|chestnut|cognac|caramel|chai|taupe|sand|stone|mushroom|latte|fawn|almond|frappe|frappé|truffle|walnut|copper/, "#92745c"],
  [/silver|chrome|metallic|champagne/, "#b8b9bd"],
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function hashHue(value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}

export function crocsColorHex(value: string) {
  const name = normalize(value);
  const match = BASE_COLORS.find(([pattern]) => pattern.test(name));
  return match?.[1] ?? `hsl(${hashHue(name)} 48% 56%)`;
}

export function crocsColorBackground(value: string) {
  const parts = value.split(/[\/|+&]/).map((part) => part.trim()).filter(Boolean);
  const multi = "conic-gradient(#e64b70 0 25%, #e8c44d 25% 50%, #42a77a 50% 75%, #3478c7 75% 100%)";

  if (parts.some((part) => normalize(part) === "multi")) {
    const base = parts.find((part) => normalize(part) !== "multi");
    return base
      ? `linear-gradient(135deg, ${crocsColorHex(base)} 0 34%, transparent 34%), ${multi}`
      : multi;
  }

  if (parts.length > 1) {
    return `linear-gradient(135deg, ${crocsColorHex(parts[0])} 0 50%, ${crocsColorHex(parts[1])} 50% 100%)`;
  }

  return crocsColorHex(value);
}

export function isColorOption(name: string) {
  const key = normalize(name).replace(/[^a-z]/g, "");
  return key === "cor" || key === "color" || key === "colour" || key === "colorway" || key === "tonalidade";
}

export function productColorOptions(variants: { options: { name: string; value: string }[] }[]) {
  return [...new Set(variants.flatMap((variant) =>
    variant.options.filter((option) => isColorOption(option.name)).map((option) => option.value.trim()).filter(Boolean)
  ))];
}
