import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Analytics } from "@/components/providers/Analytics";
import { CookieBanner } from "@/components/providers/CookieBanner";
import { assignmentMap } from "@/lib/experiments";
import { currentAssignments } from "@/server/catalog";
import { getSettings, isOn, trackingIds } from "@/server/settings";

/** Providers da loja e do checkout (carrinho, analytics, consentimento). O admin não usa. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, assignments] = await Promise.all([getSettings(), currentAssignments()]);
  const ids = trackingIds(settings);
  const bannerEnabled = isOn(settings.cookie_banner_enabled);
  return (
    <CartProvider>
      {children}
      <CartDrawer />
      <Analytics metaPixelIds={ids.metaPixelIds} gaId={ids.gaId} bannerEnabled={bannerEnabled} experiments={assignmentMap(assignments)} />
      {bannerEnabled && <CookieBanner />}
    </CartProvider>
  );
}
