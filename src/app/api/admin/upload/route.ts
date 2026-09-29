import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getCurrentAdmin } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { slugify } from "@/utils/format";

export const dynamic = "force-dynamic";

/**
 * Fallback de upload SOMENTE para desenvolvimento local sem Vercel Blob
 * (salva em public/uploads). Em produção o upload usa /api/admin/blob.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Configure BLOB_READ_WRITE_TOKEN (Vercel Blob)." }, { status: 501 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "arquivo"}.${ext}`;
  const dest = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${key}` });
}
