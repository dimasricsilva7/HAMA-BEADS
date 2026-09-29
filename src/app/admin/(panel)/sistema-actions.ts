"use server";

import { revalidatePath } from "next/cache";
import type { AdminRole } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { SETTING_DEFAULTS } from "@/lib/settings-defaults";
import { refreshStore, withAdmin, type ActionResult } from "@/server/admin/guard";
import { bool, optStr, str } from "@/server/admin/forms";

const HEX = /^#[0-9a-f]{6}$/i;
const VALIDATORS: Record<string, (v: string) => string | null> = {
  theme_primary: (v) => (HEX.test(v) ? null : "Cor primária inválida (use #RRGGBB)"),
  theme_secondary: (v) => (HEX.test(v) ? null : "Cor secundária inválida"),
  theme_accent: (v) => (HEX.test(v) ? null : "Cor de destaque inválida"),
  theme_ink: (v) => (HEX.test(v) ? null : "Cor do texto inválida"),
  theme_background: (v) => (HEX.test(v) ? null : "Cor de fundo inválida"),
  meta_pixel_id: (v) => (!v || v.split(/[\s,;]+/).filter(Boolean).every((x) => /^\d{5,20}$/.test(x)) ? null : "IDs do Meta Pixel: só números, separados por vírgula"),
  ga_id: (v) => (!v || /^G-[A-Z0-9]{4,15}$/.test(v) ? null : "ID do GA4 no formato G-XXXXXXX"),
  email_recovery_delay_minutes: (v) => (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 1440 ? null : "Tempo do lembrete entre 1 e 1440 minutos"),
  shipping_flat_cents: (v) => (/^\d{1,7}$/.test(v) ? null : "Frete inválido"),
  pix_expiration_minutes: (v) => (/^\d+$/.test(v) && Number(v) >= 5 && Number(v) <= 1440 ? null : "Validade do PIX entre 5 e 1440 minutos"),
};
const URL_KEYS = ["logo_url", "favicon_url", "og_image_url", "instagram_url", "tiktok_url", "facebook_url", "youtube_url"];
const BOOL_KEYS = ["email_confirmation_enabled", "email_recovery_enabled", "email_shipping_enabled", "sticky_cta_enabled", "require_cpf", "meta_pixel_enabled", "meta_capi_enabled", "ga_enabled", "cookie_banner_enabled"];

/** Salva somente as chaves presentes no formulário (cada aba envia as suas). */
export async function saveSettings(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("ADMIN", async (admin) => {
    const keys = String(fd.get("__keys") ?? "").split(",").filter((k) => k in SETTING_DEFAULTS);
    const current = Object.fromEntries((await db.setting.findMany({ where: { key: { in: keys } } })).map((r) => [r.key, String(r.value)]));
    const changes: { key: string; before: string; after: string }[] = [];
    for (const key of keys) {
      let value = BOOL_KEYS.includes(key) ? String(bool(fd, key)) : str(fd, key, key.startsWith("policy_") ? 30_000 : 2000);
      if (key === "shipping_flat_cents") {
        const n = Number(value.replace(/[R$\s.]/g, "").replace(",", "."));
        value = Number.isFinite(n) && n >= 0 ? String(Math.round(n * 100)) : "x";
      }
      if (key === "ga_id") value = value.toUpperCase();
      if (key.startsWith("theme_") && value && !value.startsWith("#")) value = `#${value}`;
      if (URL_KEYS.includes(key) && value && !/^(https:\/\/|\/)/.test(value)) return { error: `URL inválida em ${key} (use https://).` };
      const err = VALIDATORS[key]?.(value);
      if (err) return { error: err };
      const before = current[key] ?? SETTING_DEFAULTS[key];
      if (before === value) continue;
      await db.setting.upsert({ where: { key }, update: { value, updatedBy: admin.email }, create: { key, value, updatedBy: admin.email } });
      changes.push({ key, before, after: value });
    }
    if (changes.length) {
      await audit(admin.id, "settings_updated", "settings", null, {
        summary: `Configurações alteradas: ${changes.map((c) => c.key).join(", ")}`,
        before: Object.fromEntries(changes.map((c) => [c.key, c.key.startsWith("policy_") ? `${c.before.length} caracteres` : c.before])),
        after: Object.fromEntries(changes.map((c) => [c.key, c.key.startsWith("policy_") ? `${c.after.length} caracteres` : c.after])),
      });
      refreshStore("settings");
    }
    return { ok: true, message: changes.length ? `${changes.length} configuração(ões) salva(s).` : "Nada foi alterado." };
  });
}

export async function saveTemplate(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("ADMIN", async (admin) => {
    const id = optStr(fd, "id", 40);
    const data = { channel: str(fd, "channel", 10) === "EMAIL" ? "EMAIL" : "WHATSAPP", name: str(fd, "name", 80) || "Modelo", body: str(fd, "body", 3000), active: bool(fd, "active") };
    if (!data.body) return { error: "Escreva a mensagem." };
    if (id) await db.messageTemplate.update({ where: { id }, data });
    else await db.messageTemplate.create({ data });
    await audit(admin.id, "template_saved", "messageTemplate", id, { summary: `Modelo de mensagem "${data.name}" salvo` });
    revalidatePath("/admin/configuracoes");
    return { ok: true, message: "Modelo salvo." };
  });
}

// ───────────── Usuários (somente OWNER) ─────────────

export async function saveAdminUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("OWNER", async (admin) => {
    const id = optStr(fd, "id", 40);
    const email = str(fd, "email", 160).toLowerCase();
    const role = (["OWNER", "ADMIN", "EDITOR"].includes(str(fd, "role", 10)) ? str(fd, "role", 10) : "EDITOR") as AdminRole;
    const password = String(fd.get("password") ?? "");
    const active = bool(fd, "active");
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "E-mail inválido." };
    if (password && password.length < 12) return { error: "A senha precisa ter pelo menos 12 caracteres." };
    if (id === admin.id && (role !== "OWNER" || !active)) return { error: "Você não pode remover seu próprio acesso de proprietário." };
    if (id) {
      const before = await db.adminUser.findUniqueOrThrow({ where: { id } });
      await db.adminUser.update({ where: { id }, data: { email, name: str(fd, "name", 80) || email, role, active, ...(password ? { passwordHash: await hashPassword(password) } : {}) } });
      if (!active || password) await db.adminSession.deleteMany({ where: { adminId: id } });
      await audit(admin.id, "admin_user_updated", "adminUser", id, { summary: `Usuário ${email} atualizado${password ? " (senha redefinida)" : ""}`, before: { role: before.role, active: before.active, email: before.email }, after: { role, active, email } });
    } else {
      if (!password) return { error: "Defina uma senha inicial (12+ caracteres)." };
      const created = await db.adminUser.create({ data: { email, name: str(fd, "name", 80) || email, role, active, passwordHash: await hashPassword(password) } });
      await audit(admin.id, "admin_user_created", "adminUser", created.id, { summary: `Usuário criado: ${email} (${role})` });
    }
    revalidatePath("/admin/usuarios");
    return { ok: true, message: "Usuário salvo." };
  });
}

export async function changeOwnPassword(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("EDITOR", async (admin) => {
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("next") ?? "");
    if (next.length < 12) return { error: "A nova senha precisa ter pelo menos 12 caracteres." };
    if (!(await verifyPassword(current, admin.passwordHash))) return { error: "Senha atual incorreta." };
    await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
    await audit(admin.id, "password_changed", "adminUser", admin.id, { summary: "Senha alterada" });
    return { ok: true, message: "Senha alterada." };
  });
}

/** Envia um e-mail de teste (confirmação de compra com dados de exemplo) para o admin logado. */
export async function sendTestEmail(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return withAdmin("ADMIN", async (admin) => {
    const { deliver, emailProvider } = await import("@/lib/email/provider");
    const { brandFromSettings } = await import("@/lib/email");
    const { purchaseConfirmationEmail, pixRecoveryEmail } = await import("@/emails/templates");
    const { getSettingsFresh } = await import("@/server/settings");
    const { siteUrl } = await import("@/lib/env");
    const { SAMPLE_ORDER } = await import("@/emails/sample");
    if (emailProvider() === "none") return { error: "Configure RESEND_API_KEY e EMAIL_FROM na Vercel para enviar e-mails." };
    const b = brandFromSettings(await getSettingsFresh());
    const url = `${siteUrl()}/pedido/${SAMPLE_ORDER.orderNumber}?t=exemplo`;
    const tpl = String(fd.get("type")) === "PIX_RECOVERY" ? pixRecoveryEmail(b, SAMPLE_ORDER, url) : purchaseConfirmationEmail(b, SAMPLE_ORDER, url);
    const r = await deliver({ to: admin.email, subject: `[TESTE] ${tpl.subject}`, html: tpl.html, text: tpl.text });
    await audit(admin.id, "email_test", "settings", null, { summary: `E-mail de teste para ${admin.email}: ${r.ok ? "enviado" : r.error}` });
    return r.ok ? { ok: true, message: `E-mail de teste enviado para ${admin.email}.` } : { error: r.error };
  });
}
