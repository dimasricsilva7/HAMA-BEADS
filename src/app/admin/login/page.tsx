import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { Logo } from "@/components/layout/Logo";
import { getSettings } from "@/server/settings";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  const settings = await getSettings();
  return (
    <div className="admin-ui flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo name={settings.store_name || "Sua Loja"} logoUrl={settings.logo_url || null} />
          <p className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-500">Painel administrativo</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
