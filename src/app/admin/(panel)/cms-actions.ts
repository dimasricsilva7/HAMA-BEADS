"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { GALLERY_CATEGORIES, PIXEL_ICONS } from "@/lib/domain";
import { SPRITE_KEYS } from "@/lib/pixel-art";
import { refreshStore, withAdmin, withAdminVoid, type ActionResult } from "@/server/admin/guard";
import { bool, int, jsonArray, optStr, str, stringList } from "@/server/admin/forms";

const url = (fd: FormData, k: string) => {
  const v = optStr(fd, k, 500);
  return v && /^(https:\/\/|\/)/.test(v) ? v : null;
};
const asRecord = (v: unknown) => v as Record<string, unknown>;
const sprite = (fd: FormData) => {
  const v = str(fd, "cfg_spriteKey", 20);
  return (SPRITE_KEYS as string[]).includes(v) ? v : undefined;
};
const iconItems = (fd: FormData, k: string) =>
  jsonArray<{ icon?: string; title?: string; text?: string }>(fd, k)
    .filter((i) => i?.title)
    .slice(0, 12)
    .map((i) => ({ icon: (PIXEL_ICONS as readonly string[]).includes(i.icon ?? "") ? i.icon : "star", title: String(i.title).slice(0, 80), text: String(i.text ?? "").slice(0, 240) }));

/** Campos específicos de cada tipo de seção → `config`. */
function parseConfig(type: string, fd: FormData, prev: Record<string, unknown>): Record<string, unknown> {
  const c: Record<string, unknown> = { ...prev };
  switch (type) {
    case "hero":
      c.eyebrow = str(fd, "cfg_eyebrow", 40);
      c.spriteKey = sprite(fd);
      c.stats = jsonArray<{ value?: string; label?: string }>(fd, "cfg_stats").filter((s) => s?.value).slice(0, 4).map((s) => ({ value: String(s.value).slice(0, 24), label: String(s.label ?? "").slice(0, 60) }));
      c.secondaryCtaLabel = str(fd, "cfg_secondaryCtaLabel", 40);
      c.secondaryCtaTarget = str(fd, "cfg_secondaryCtaTarget", 200);
      break;
    case "product_in_use":
    case "final_cta":
      c.spriteKey = sprite(fd);
      break;
    case "video":
      c.desktopVideoUrl = url(fd, "cfg_desktopVideoUrl") ?? "";
      c.posterUrl = url(fd, "cfg_posterUrl") ?? "";
      break;
    case "benefits":
    case "trust":
      c.items = iconItems(fd, "cfg_items");
      break;
    case "how_it_works":
      c.steps = jsonArray<{ title?: string; text?: string }>(fd, "cfg_steps").filter((s) => s?.title).slice(0, 10).map((s) => ({ title: String(s.title).slice(0, 80), text: String(s.text ?? "").slice(0, 240) }));
      c.warning = str(fd, "cfg_warning", 400);
      break;
    case "audience":
      c.items = stringList(fd, "cfg_items").slice(0, 10);
      c.spriteKey = sprite(fd);
      c.tone = str(fd, "cfg_tone", 10) === "accent" ? "accent" : "primary";
      break;
    case "offer":
      c.productId = str(fd, "cfg_productId", 40);
      break;
    case "models_included":
      c.deliveryNote = str(fd, "cfg_deliveryNote", 300);
      c.sprites = stringList(fd, "cfg_sprites").filter((s) => (SPRITE_KEYS as string[]).includes(s)).slice(0, 6);
      break;
    case "complete_kit":
      c.productIds = jsonArray<string>(fd, "cfg_productIds").filter((x) => typeof x === "string");
      break;
    case "library":
      c.productId = str(fd, "cfg_productId", 40);
      c.categories = stringList(fd, "cfg_categories").slice(0, 20);
      break;
  }
  return c;
}

export async function saveSection(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const key = str(fd, "key", 40);
    const before = await db.landingSection.findUniqueOrThrow({ where: { key } });
    const config = parseConfig(before.type, fd, (before.config ?? {}) as Record<string, unknown>);
    const after = await db.landingSection.update({
      where: { key },
      data: {
        active: bool(fd, "active"),
        title: optStr(fd, "title", 200),
        subtitle: optStr(fd, "subtitle", 400),
        body: optStr(fd, "body", 4000),
        imageUrl: url(fd, "imageUrl"),
        videoUrl: url(fd, "videoUrl"),
        ctaLabel: optStr(fd, "ctaLabel", 60),
        ctaTarget: optStr(fd, "ctaTarget", 200),
        config: config as Prisma.InputJsonValue,
      },
    });
    await audit(admin.id, "landing_section_updated", "landingSection", key, { summary: `Seção "${before.label}" atualizada`, before: asRecord(before), after: asRecord(after) });
    refreshStore("landing");
    revalidatePath("/admin/landing");
    return { ok: true, message: "Seção salva. A landing page já foi atualizada." };
  });
}

export async function moveSection(fd: FormData) {
  await withAdminVoid("EDITOR", async (admin) => {
    const key = str(fd, "key", 40);
    const dir = str(fd, "dir", 4) === "up" ? -1 : 1;
    const list = await db.landingSection.findMany({ orderBy: { sortOrder: "asc" }, select: { key: true, label: true } });
    const i = list.findIndex((s) => s.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await db.$transaction(list.map((s, idx) => db.landingSection.update({ where: { key: s.key }, data: { sortOrder: idx + 1 } })));
    await audit(admin.id, "landing_reordered", "landingSection", key, { summary: `Ordem da landing: "${list[j].label}" movida` });
    refreshStore("landing");
    revalidatePath("/admin/landing");
  });
}

export async function toggleSection(fd: FormData) {
  await withAdminVoid("EDITOR", async (admin) => {
    const s = await db.landingSection.findUniqueOrThrow({ where: { key: str(fd, "key", 40) } });
    await db.landingSection.update({ where: { key: s.key }, data: { active: !s.active } });
    await audit(admin.id, "landing_section_updated", "landingSection", s.key, { summary: `Seção "${s.label}" ${s.active ? "desativada" : "ativada"}`, before: { active: s.active }, after: { active: !s.active } });
    refreshStore("landing");
    revalidatePath("/admin/landing");
  });
}

// ───────────── Galeria ─────────────

export async function saveGalleryItem(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const id = optStr(fd, "id", 40);
    const imageUrl = url(fd, "imageUrl");
    if (!imageUrl) return { error: "Envie a imagem ou informe a URL." };
    const category = str(fd, "category", 40);
    const data = {
      title: str(fd, "title", 80) || "Criação",
      category: (GALLERY_CATEGORIES as readonly string[]).includes(category) ? category : "Diversos",
      imageUrl,
      alt: str(fd, "alt", 160),
      sortOrder: int(fd, "sortOrder", 0),
      active: bool(fd, "active"),
      inspiration: bool(fd, "inspiration"),
    };
    if (id) {
      const before = await db.galleryItem.findUniqueOrThrow({ where: { id } });
      const after = await db.galleryItem.update({ where: { id }, data });
      await audit(admin.id, "gallery_updated", "galleryItem", id, { summary: `Galeria: "${after.title}" atualizada`, before: asRecord(before), after: asRecord(after) });
    } else {
      const created = await db.galleryItem.create({ data });
      await audit(admin.id, "gallery_created", "galleryItem", created.id, { summary: `Galeria: "${created.title}" adicionada` });
    }
    refreshStore("gallery");
    revalidatePath("/admin/galeria");
    return { ok: true, message: "Salvo." };
  });
}

export async function deleteGalleryItem(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const g = await db.galleryItem.delete({ where: { id: str(fd, "id", 40) } });
    await audit(admin.id, "gallery_deleted", "galleryItem", g.id, { summary: `Galeria: "${g.title}" removida` });
    refreshStore("gallery");
    revalidatePath("/admin/galeria");
    return { ok: true, message: "Removido." };
  });
}

// ───────────── FAQ ─────────────

export async function saveFaq(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const id = optStr(fd, "id", 40);
    const data = { question: str(fd, "question", 200), answer: str(fd, "answer", 3000), sortOrder: int(fd, "sortOrder", 0), active: bool(fd, "active") };
    if (!data.question || !data.answer) return { error: "Informe pergunta e resposta." };
    if (data.active && data.answer.includes("[PREENCHER]")) return { error: "Complete a resposta (remova [PREENCHER]) antes de ativar." };
    if (id) {
      const before = await db.faq.findUniqueOrThrow({ where: { id } });
      const after = await db.faq.update({ where: { id }, data });
      await audit(admin.id, "faq_updated", "faq", id, { summary: `FAQ: "${after.question}"`, before: asRecord(before), after: asRecord(after) });
    } else {
      const created = await db.faq.create({ data });
      await audit(admin.id, "faq_created", "faq", created.id, { summary: `FAQ criada: "${created.question}"` });
    }
    refreshStore("faq");
    revalidatePath("/admin/faq");
    return { ok: true, message: "Salvo." };
  });
}

export async function deleteFaq(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const f = await db.faq.delete({ where: { id: str(fd, "id", 40) } });
    await audit(admin.id, "faq_deleted", "faq", f.id, { summary: `FAQ removida: "${f.question}"` });
    refreshStore("faq");
    revalidatePath("/admin/faq");
    return { ok: true, message: "Removida." };
  });
}

// ───────────── Avaliações (somente reais) ─────────────

export async function saveReview(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const id = optStr(fd, "id", 40);
    const rating = Math.max(1, Math.min(5, int(fd, "rating", 5)));
    const date = str(fd, "reviewedAt", 10);
    const productId = optStr(fd, "productId", 40);
    const data = {
      name: str(fd, "name", 80),
      text: str(fd, "text", 2000),
      rating,
      photoUrl: url(fd, "photoUrl"),
      videoUrl: url(fd, "videoUrl"),
      productId: productId || null,
      reviewedAt: /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00-03:00`) : null,
      approved: bool(fd, "approved"),
      featured: bool(fd, "featured"),
      sortOrder: int(fd, "sortOrder", 0),
    };
    if (!data.name || !data.text) return { error: "Informe nome e texto da avaliação." };
    if (data.approved && !bool(fd, "confirmReal")) return { error: "Confirme que a avaliação é real e autorizada pelo cliente para publicá-la." };
    if (id) {
      const before = await db.review.findUniqueOrThrow({ where: { id } });
      const after = await db.review.update({ where: { id }, data });
      await audit(admin.id, "review_updated", "review", id, { summary: `Avaliação de ${after.name} ${before.approved !== after.approved ? (after.approved ? "aprovada" : "despublicada") : "atualizada"}`, before: asRecord(before), after: asRecord(after) });
    } else {
      const created = await db.review.create({ data });
      await audit(admin.id, "review_created", "review", created.id, { summary: `Avaliação cadastrada: ${created.name}` });
    }
    refreshStore("reviews");
    revalidatePath("/admin/avaliacoes");
    return { ok: true, message: "Salvo." };
  });
}

export async function deleteReview(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const r = await db.review.delete({ where: { id: str(fd, "id", 40) } });
    await audit(admin.id, "review_deleted", "review", r.id, { summary: `Avaliação removida: ${r.name}` });
    refreshStore("reviews");
    revalidatePath("/admin/avaliacoes");
    return { ok: true, message: "Removida." };
  });
}
