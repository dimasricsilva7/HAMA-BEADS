import { RichText } from "./RichText";
import { getSettings } from "@/server/settings";
import { POLICY_PAGES } from "@/lib/settings-defaults";

export async function PolicyPage({ slug }: { slug: keyof typeof POLICY_PAGES }) {
  const s = await getSettings();
  const cfg = POLICY_PAGES[slug];
  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="h-section">{cfg.title}</h1>
      <RichText text={s[cfg.key]} className="mt-6 leading-relaxed text-ink/85" />
    </article>
  );
}

export function policyMetadata(slug: keyof typeof POLICY_PAGES) {
  return { title: POLICY_PAGES[slug].title, alternates: { canonical: `/${slug}` } };
}
