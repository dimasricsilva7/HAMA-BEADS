import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/webp", "image/jpeg", "image/png", "image/avif", "image/svg+xml", "image/gif", "video/mp4", "video/webm", "video/quicktime", "application/pdf", "application/zip"];

/**
 * Upload direto do navegador para o Vercel Blob (sem passar o arquivo pela função,
 * permitindo vídeos grandes). Somente administradores autenticados recebem token.
 */
export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "blob_not_configured" }, { status: 501 });
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const admin = await getCurrentAdmin();
        if (!admin) throw new Error("unauthorized");
        await audit(admin.id, "media_upload_started", "media", null, { summary: `Upload: ${pathname}` });
        return { allowedContentTypes: ALLOWED, maximumSizeInBytes: 200 * 1024 * 1024, addRandomSuffix: true, tokenPayload: JSON.stringify({ adminId: admin.id }) };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "erro";
    return NextResponse.json({ error: message }, { status: message === "unauthorized" ? 401 : 400 });
  }
}
