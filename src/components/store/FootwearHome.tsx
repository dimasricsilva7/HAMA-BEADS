"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type MiniProduct = { id:string; name:string; slug:string; sku:string; priceCents:number; listPriceCents:number|null; imageUrl:string|null; badge:string|null; category:string; stockStatus:string; shortDescription:string|null };
const categoryNames: Record<string,string> = {
  CLOGS:"Clogs", SANDALS:"Sandálias", SLIDES:"Slides", FOOTWEAR:"Calçados", JIBBITZ:"Pins e enfeites", ACCESSORIES:"Acessórios", KIDS:"Infantil", KIT:"Calçados", BEADS:"Acessórios", PEGBOARD:"Acessórios", TWEEZERS:"Acessórios", DIGITAL_MODELS:"Acessórios", ACCESSORY:"Acessórios", TOOL:"Acessórios", OTHER:"Outros"
};
const money = (c:number) => (c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function ShoeIllustration() {
  return <svg viewBox="0 0 560 360" role="img" aria-label="Ilustração original de um clog" className="h-full w-full drop-shadow-2xl">
    <defs><linearGradient id="shoe" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#F4F0E9"/><stop offset="1" stopColor="#C7C3BC"/></linearGradient><linearGradient id="sole" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#383838"/><stop offset="1" stopColor="#111"/></linearGradient></defs>
    <ellipse cx="278" cy="300" rx="220" ry="28" fill="#000" opacity=".3"/>
    <path d="M70 218 C88 170 120 126 188 91 C234 67 280 76 324 108 L427 179 C464 205 477 240 464 264 C453 284 427 291 393 291 L113 291 C78 291 58 266 70 218Z" fill="url(#sole)" stroke="#080808" strokeWidth="7"/>
    <path d="M80 206 C97 161 129 121 191 87 C238 62 284 74 328 105 L423 171 C449 190 457 213 446 232 C436 249 415 257 385 257 L122 257 C89 257 69 239 80 206Z" fill="url(#shoe)" stroke="#A8A39A" strokeWidth="6"/>
    <path d="M100 212 C152 230 236 239 325 233 C372 230 409 219 440 200" fill="none" stroke="#B6B0A7" strokeWidth="5" opacity=".8"/>
    {Array.from({length:8},(_,i)=><ellipse key={i} cx={157+i*27} cy={151+(i%2)*13} rx="8" ry="13" transform={`rotate(27 ${157+i*27} ${151+(i%2)*13})`} fill="#77736D" opacity=".75"/>)}
    <path d="M115 167 C83 117 82 91 112 81 C137 74 151 99 151 129" fill="none" stroke="#B3AEA6" strokeWidth="18" strokeLinecap="round"/>
    <path d="M115 167 C83 117 82 91 112 81 C137 74 151 99 151 129" fill="none" stroke="#E7E3DC" strokeWidth="10" strokeLinecap="round"/>
  </svg>;
}

function ProductCard({p}:{p:MiniProduct}) {
  const discount = p.listPriceCents && p.listPriceCents > p.priceCents ? Math.round((1-p.priceCents/p.listPriceCents)*100) : null;
  return <article className="group overflow-hidden rounded-[22px] border border-[#e8e5df] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <Link href={`/produto/${p.slug}`} className="relative block aspect-square overflow-hidden bg-[#f4f2ed]">
      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"/> : <div className="grid h-full place-items-center bg-gradient-to-br from-[#f4f2ed] to-[#e7e3db]"><div className="w-[78%]"><ShoeIllustration/></div><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#777]">Imagem a cadastrar</span></div>}
      {p.badge && <span className="absolute left-3 top-3 rounded-full bg-[#151515] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">{p.badge}</span>}
      {discount && <span className="absolute right-3 top-3 rounded-full bg-[#df4c3b] px-3 py-1.5 text-[11px] font-extrabold text-white">-{discount}%</span>}
    </Link>
    <div className="p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8c877f]">{categoryNames[p.category] ?? "Calçados"}</p>
      <Link href={`/produto/${p.slug}`} className="mt-1 block min-h-11 text-[14px] font-semibold leading-5 text-[#191919] hover:underline">{p.name}</Link>
      {p.shortDescription && <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-[#77736d]">{p.shortDescription}</p>}
      <div className="mt-4 flex items-end justify-between gap-2">
        <div><p className="text-lg font-extrabold text-[#151515]">{money(p.priceCents)}</p>{p.listPriceCents && p.listPriceCents>p.priceCents && <p className="text-xs text-[#96918a] line-through">{money(p.listPriceCents)}</p>}</div>
        <Link href={`/produto/${p.slug}`} className="rounded-full border border-[#1b1b1b] px-4 py-2 text-xs font-bold text-[#171717] transition hover:bg-[#171717] hover:text-white">Ver produto</Link>
      </div>
    </div>
  </article>;
}

export default function FootwearHome({products,storeName}:{products:MiniProduct[];storeName:string}) {
  const [search,setSearch] = useState("");
  const filtered = useMemo(()=>products.filter(p=>`${p.name} ${categoryNames[p.category] ?? ""}`.toLowerCase().includes(search.toLowerCase())),[products,search]);
  const arrivals = filtered.slice(0,4);
  const deals = filtered.filter(p=>p.listPriceCents && p.listPriceCents>p.priceCents).slice(0,4);
  const clogs = filtered.filter(p=>["CLOGS","FOOTWEAR","KIT"].includes(p.category)).slice(0,4);
  const sandals = filtered.filter(p=>["SANDALS","SLIDES"].includes(p.category)).slice(0,4);
  const section = (id:string,title:string,subtitle:string,list:MiniProduct[]):ReactNode => <section id={id} className="mx-auto max-w-[1380px] px-4 py-12 sm:px-7 lg:px-10 lg:py-16"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a16b56]">{storeName}</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#181818] sm:text-3xl">{title}</h2><p className="mt-2 max-w-xl text-sm text-[#77736d]">{subtitle}</p></div><Link href="/loja" className="shrink-0 text-xs font-bold uppercase tracking-wide text-[#181818] underline underline-offset-4">Ver todos</Link></div>{list.length?<div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{list.map(p=><ProductCard key={p.id} p={p}/>)}</div>:<div className="rounded-2xl border border-dashed border-[#d7d2ca] bg-white px-5 py-10 text-center"><p className="font-semibold text-[#37332e]">Vitrine pronta para receber produtos</p><p className="mt-1 text-sm text-[#858077]">Cadastre produtos, fotos e preços no painel administrativo.</p><Link href="/admin/produtos/novo" className="mt-4 inline-flex rounded-full bg-[#181818] px-5 py-3 text-xs font-bold text-white">Cadastrar primeiro produto</Link></div>}</section>;
  return <div className="min-h-screen bg-[#fbfaf7] text-[#171717]">
    <div className="bg-[#171717] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[.16em] text-white sm:text-xs">Conforto para acompanhar todos os seus passos</div>
    <div className="mx-auto max-w-[1380px] px-4 pt-5 sm:px-7 lg:px-10">
      <div className="flex flex-col gap-2 rounded-[28px] bg-[#ece8e0] px-6 py-10 sm:px-10 lg:min-h-[460px] lg:flex-row lg:items-center lg:justify-between lg:px-16">
        <div className="relative z-10 max-w-[540px]">
          <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#95614d]">Nova coleção · conforto diário</p>
          <h1 className="mt-4 text-4xl font-black leading-[.98] tracking-[-.045em] text-[#191919] sm:text-6xl">Seu ritmo.<br/>Seu conforto.<br/><span className="text-[#9b6650]">Seu estilo.</span></h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#625d55] sm:text-base">Encontre modelos versáteis para acompanhar sua rotina, com praticidade, leveza e personalidade.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/loja" className="rounded-full bg-[#171717] px-7 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-[#9b6650]">Explorar coleção</Link><a href="#ofertas" className="rounded-full border border-[#292722] px-7 py-3.5 text-xs font-extrabold uppercase tracking-wide text-[#222]">Ver ofertas</a></div>
          <p className="mt-7 text-[10px] font-medium uppercase tracking-[.15em] text-[#837d73]">Compra segura · PIX · Atendimento ao cliente</p>
        </div>
        <div className="relative mx-auto mt-6 flex aspect-[1.35] w-full max-w-[540px] items-center justify-center lg:mt-0"><div className="absolute h-[78%] w-[78%] rounded-full bg-[#d4c8b8]"/><div className="relative w-full rotate-[-8deg]"><ShoeIllustration/></div><span className="absolute bottom-1 right-2 rounded-full bg-white/80 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#676057]">Arte ilustrativa original</span></div>
      </div>
    </div>
    <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-3 px-4 py-8 sm:grid-cols-4 sm:px-7 lg:px-10">
      {[["#clogs","Clogs","Modelos para o dia a dia"],["#sandalias","Sandálias & slides","Leves e práticos"],["#infantil","Infantil","Para pequenos passos"],["#acessorios","Acessórios","Personalize seu estilo"]].map(([href,title,sub])=><a key={href} href={href} className="rounded-2xl border border-[#e9e5de] bg-white p-4 transition hover:-translate-y-1 hover:shadow-md sm:p-5"><span className="text-[9px] font-bold uppercase tracking-wider text-[#a16b56]">Explorar</span><span className="mt-2 block text-sm font-extrabold sm:text-base">{title}</span><span className="mt-1 block text-[11px] text-[#817b72]">{sub}</span></a>)}
    </div>
    <div className="mx-auto max-w-[1380px] px-4 sm:px-7 lg:px-10"><div className="flex items-center gap-3 rounded-2xl border border-[#e9e5de] bg-white px-4 py-3"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por produto ou categoria" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a6a098]"/></div></div>
    {section("novidades","Novidades","Descubra os produtos recém-chegados à coleção.",arrivals)}
    <div className="mx-4 overflow-hidden rounded-[26px] bg-[#25231f] px-6 py-8 text-white sm:mx-7 sm:px-10 lg:mx-auto lg:max-w-[1300px] lg:px-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d7b8a5]">Escolha o seu próximo favorito</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Conforto que combina com você.</h2><p className="mt-2 text-sm text-white/65">Explore os modelos e encontre seu ajuste ideal.</p></div><Link href="/loja" className="inline-flex w-fit rounded-full bg-white px-6 py-3 text-xs font-extrabold uppercase tracking-wide text-[#181818]">Ver coleção completa</Link></div></div>
    {section("clogs","Clogs e modelos clássicos","Praticidade, conforto e versatilidade para a rotina.",clogs)}
    {section("sandalias","Sandálias e slides","Opções leves para diferentes momentos do dia.",sandals)}
    {section("ofertas","Ofertas em destaque","Preços promocionais configurados no catálogo da loja.",deals)}
    {section("infantil","Infantil","Modelos infantis cadastrados no catálogo.",filtered.filter(p=>p.category==="KIDS").slice(0,4))}
    {section("acessorios","Acessórios e personalização","Detalhes que deixam cada escolha com a sua cara.",filtered.filter(p=>["JIBBITZ","ACCESSORIES","ACCESSORY"].includes(p.category)).slice(0,4))}
    <div className="mx-auto grid max-w-[1380px] gap-3 px-4 pb-12 sm:grid-cols-3 sm:px-7 lg:px-10"><div className="rounded-2xl bg-[#eee9e1] p-5"><b className="text-sm">Pagamento protegido</b><p className="mt-1 text-xs text-[#716b62]">PIX processado pelo parceiro de pagamento.</p></div><div className="rounded-2xl bg-[#eee9e1] p-5"><b className="text-sm">Acompanhe seu pedido</b><p className="mt-1 text-xs text-[#716b62]">Consulte o status da compra pela área de pedidos.</p></div><div className="rounded-2xl bg-[#eee9e1] p-5"><b className="text-sm">Atendimento</b><p className="mt-1 text-xs text-[#716b62]">Consulte os canais oficiais de atendimento da loja.</p></div></div>
  </div>;
}
