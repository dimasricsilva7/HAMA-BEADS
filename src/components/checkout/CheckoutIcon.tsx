import type { SVGProps } from "react";

export type CheckoutIconName = "shield-check" | "lock" | "truck" | "pix" | "wallet" | "check-circle";

const common: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function CheckoutIcon({
  name,
  className = "h-5 w-5",
}: {
  name: CheckoutIconName;
  className?: string;
}) {
  return (
    <svg {...common} className={className}>
      {name === "shield-check" && <>
        <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>}
      {name === "lock" && <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v3" />
      </>}
      {name === "truck" && <>
        <path d="M3 6h11v11H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="7.5" cy="19" r="1.8" />
        <circle cx="17.5" cy="19" r="1.8" />
      </>}
      {name === "pix" && <>
        <path d="m8.2 3.8 3.8 3.8 3.8-3.8a2.1 2.1 0 0 0-3-3L12 1.6 11.2.8a2.1 2.1 0 0 0-3 3Z" transform="translate(0 3)" />
        <path d="m8.2 20.2 3.8-3.8 3.8 3.8a2.1 2.1 0 0 1-3 3L12 22.4l-.8.8a2.1 2.1 0 0 1-3-3Z" transform="translate(0 -1)" />
        <path d="m3.8 8.2 3.8 3.8-3.8 3.8a2.1 2.1 0 0 1-3-3l.8-.8-.8-.8a2.1 2.1 0 0 1 3-3Z" transform="translate(3 0)" />
        <path d="m20.2 8.2-3.8 3.8 3.8 3.8a2.1 2.1 0 0 0 3-3l-.8-.8.8-.8a2.1 2.1 0 0 0-3-3Z" transform="translate(-1 0)" />
        <path d="M10 12h4" />
      </>}
      {name === "wallet" && <>
        <rect x="3" y="5" width="18" height="15" rx="2.5" />
        <path d="M3 9h18" />
        <path d="M16 14h2" />
        <path d="M6 5V3h12v2" />
      </>}
      {name === "check-circle" && <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>}
    </svg>
  );
}
