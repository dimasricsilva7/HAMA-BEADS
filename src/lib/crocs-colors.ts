/** Nomes de cor encontrados nos SKUs oficiais Crocs Brasil; tons aproximados para swatches. */
const SPECIAL_COLORS: Record<string, string> = {
  "ATMOSPHERE": "#91a7b9",
  "ATMOSPHERE CHROME": "#aebbc3",
  "BOBA": "#c3aa91",
  "BLUE GREY": "#6f8598",
  "BUBBLE": "#f3a5c7",
  "BUBBLE ICE": "#dcecf3",
  "COBBLESTONE": "#a29f98",
  "DREAMSCAPE": "#8978b5",
  "DULCE": "#b78d80",
  "HYDRANGEA": "#9b86c4",
  "DUSTY OLIVE": "#8b906d",
  "DIGITAL RASPBERRY": "#c34f83",
  "DIGITAL VIOLET": "#8867b4",
  "ELECTRIC SUNSTONE": "#e98435",
  "GALAXY": "#665b82",
  "GLAM GLITTER": "#c3a8b8",
  "GLOW GREEN": "#8bbd45",
  "GOLDEN LIGHT": "#d6b55f",
  "GRAPEBERRY": "#8d548b",
  "GREEN BURST": "#5eaa53",
  "GREEN SLIME": "#83ba42",
  "HYDRANGEA": "#9b86c4",
  "LAVA": "#a43c35",
  "LUNAR DUSK": "#756b7c",
  "MARINA": "#6fa9c3",
  "MAUVE": "#b08a9d",
  "MAUVE MIST": "#c2a8b9",
  "MIRAGE": "#c5bba9",
  "MOONLIGHT": "#d4d3df",
  "MOTH": "#968b7c",
  "OXYGEN": "#98a9a6",
  "POND": "#6fa4a4",
  "QUARTZ": "#ccbfc9",
  "STARFISH": "#e17e4c",
  "STUCCO": "#b4ab9e",
  "SUMMIT CHROME": "#b9c2c5",
};

const BASE_COLORS: [RegExp, string][] = [
  [/black|noir|onyx/, "#202124"],
  [/summit white|pearl white|white|chalk|bone|ivory|milk|cream|almost white|snow|alabaster|parchment/, "#f2f0e8"],
  [/carbon|charcoal|elephant|slate|grey|gray|concrete|microchip|fog|smoke|pewter|graphite|storm|shark/, "#74787b"],
  [/navy|deep navy|midnight|ink|blue black/, "#172b4d"],
  [/cobalt|royal blue|bright cobalt|blue bolt|electric blue|sapphire|elite blue/, "#0877c9"],
  [/blue|aqua|arctic|sky|ice|teal|tide|pool|turquoise|lagoon|peacock|water|ocean|marina/, "#36a9d6"],
  [/mint|sea glass|mint tint|apple ice|turbo teal|jade/, "#5cc9ad"],
  [/olive|army green|field green|grass green|green ivy|crocs green|moss|leaf|sage|cargo|tac green|aloe|fern|lime|citrus|khaki/, "#7c9b42"],
  [/pink caramel|pink milk|candy pink|ballerina|blush|ballet|rose|pink|bubble|dragon fruit|raspberry|guava|coral|powder pink|barely pink|quiet rose/, "#e99ab4"],
  [/red|cherry|flame|heritage red|tomato|pepper|dark cherry|lava/, "#c83947"],
  [/orange|orangesicle|sunstone|tangerine|papaya|mango|starfish/, "#ed8a35"],
  [/yellow|lemon|sunshine|golden|butter|buttercream|banana|citron/, "#e8cc55"],
  [/purple moon|purple|plum|violet|lilac|lavender|grape|cassis|frosted grape|dreamscape|orchid|hydragea/, "#9879b5"],
  [/brown|cocoa|chocolate|coffee|espresso|sepia|chestnut|cognac|caramel|chai|taupe|sand|stone|mushroom|latte|fawn|almond|frappe|frappé|truffle|walnut|copper|linen|sandstone|stucco/, "#92745c"],
  [/silver|chrome|metallic|champagne|steel/, "#b8b9bd"],
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
  const key = normalize(value).toUpperCase();
  const special = SPECIAL_COLORS[key];
  if (special) return special;
  const match = BASE_COLORS.find(([pattern]) => pattern.test(normalize(value)));
  return match?.[1] ?? `hsl(${hashHue(normalize(value))} 48% 56%)`;
}

export function crocsColorBackground(value: string) {
  const parts = value.split(/[\/|+&]/).map((part) => part.trim()).filter(Boolean);
  const multi = "conic-gradient(#e64b70 0 25%, #e8c44d 25% 50%, #42a77a 50% 75%, #3478c7 75% 100%)";
  if (parts.some((part) => normalize(part) === "multi")) {
    const base = parts.find((part) => normalize(part) !== "multi");
    return base ? `linear-gradient(135deg, ${crocsColorHex(base)} 0 34%, transparent 34%), ${multi}` : multi;
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
    variant.options.filter((option) => isColorOption(option.name))
      .map((option) => option.value.trim())
      .filter((value) => value && !/classic lined clog/i.test(value))
  ))];
}
