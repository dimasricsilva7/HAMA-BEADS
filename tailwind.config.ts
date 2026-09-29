import type { Config } from "tailwindcss";

/** Tokens do design system — cores vêm de CSS vars (editáveis no admin, em canais RGB). */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: token("primary"),
        secondary: token("secondary"),
        accent: token("accent"),
        ink: token("ink"),
        bg: token("bg"),
        surface: token("surface"),
        muted: token("muted"),
        line: token("line"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
        pixel: ["var(--font-pixel)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        bead: "1.25rem",
        card: "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(23 20 46 / 0.06), 0 8px 24px -8px rgb(23 20 46 / 0.12)",
        lift: "0 2px 4px rgb(23 20 46 / 0.06), 0 16px 40px -12px rgb(23 20 46 / 0.22)",
        pixel: "0 4px 0 0 rgb(var(--c-ink) / 1)",
        "pixel-sm": "0 3px 0 0 rgb(var(--c-ink) / 1)",
      },
      maxWidth: { page: "72rem" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(0.9)" }, "60%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        slidein: { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        slideup: { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
      },
      animation: {
        rise: "rise .5s cubic-bezier(.2,.7,.2,1) both",
        pop: "pop .35s ease-out",
        float: "float 5s ease-in-out infinite",
        slidein: "slidein .28s cubic-bezier(.2,.7,.2,1)",
        slideup: "slideup .28s cubic-bezier(.2,.7,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
