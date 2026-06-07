#!/usr/bin/env node
/**
 * 5 criativos estáticos Instagram (1080×1350, 4:5) — Remake Pixel
 * Composição HTML + screenshot (fotos reais do site, tipografia limpa).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "frontend/public/images");
const OUT = path.join(ROOT, "marketing/instagram-ads");
const W = 1080;
const H = 1350;

async function toDataUrl(filePath) {
  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function loadAssets() {
  const paths = {
    founder: path.join(IMG, "founder.jpg"),
    generate: path.join(IMG, "generate.jpg"),
    hero: path.join(IMG, "hero-bg.jpg"),
    dashboard: path.join(IMG, "dashboard-mockup.jpg"),
    motion: path.join(IMG, "motion.jpg"),
    posters: path.join(IMG, "posters.jpg"),
    s1: path.join(IMG, "padrao-covers/men_luxury.jpg"),
    s2: path.join(IMG, "padrao-covers/men_underwater.jpg"),
    s3: path.join(IMG, "artistic-covers/anime_ghibli.jpg"),
    s4: path.join(IMG, "padrao-covers/men_darkhero.jpg"),
  };
  const assets = {};
  for (const [k, p] of Object.entries(paths)) {
    assets[k] = await toDataUrl(p);
  }
  return assets;
}

const ADS = [
  {
    id: "01-transformacao",
    name: "Transformação foto → arte",
    html: (assets) => `
<div class="ad">
  <div class="bg" style="background-image:url('${assets.founder}')"></div>
  <div class="grad"></div>
  <div class="split">
    <div class="half before"><img src="${assets.founder}" alt=""/></div>
    <div class="half after"><img src="${assets.generate}" alt=""/></div>
    <div class="split-label before-l">Original</div>
    <div class="split-label after-l">Com IA</div>
  </div>
  <div class="content">
    <p class="brand">Remake Pixel</p>
    <h1>A tua foto.<br/>Outro nível.</h1>
    <p class="sub">Retoque e estilos em segundos — identidade preservada.</p>
    <p class="cta">50 créditos grátis · remakepix.com</p>
  </div>
</div>`,
  },
  {
    id: "02-estilos",
    name: "96 estilos prontos",
    html: (assets) => `
<div class="ad ad--grid">
  <div class="grad"></div>
  <div class="grid">
    <img src="${assets.s1}" alt=""/><img src="${assets.s2}" alt=""/>
    <img src="${assets.s3}" alt=""/><img src="${assets.s4}" alt=""/>
  </div>
  <div class="content content--bottom">
    <p class="eyebrow">Estúdio IA</p>
    <h1>96 estilos.<br/>Um clique.</h1>
    <p class="sub">Retrato, moda, editorial, anime — sem prompt técnico.</p>
    <p class="cta">remakepix.com</p>
  </div>
</div>`,
  },
  {
    id: "03-creditos",
    name: "CTA créditos grátis",
    html: (assets) => `
<div class="ad ad--minimal">
  <div class="bg" style="background-image:url('${assets.hero}')"></div>
  <div class="grad grad--strong"></div>
  <div class="content content--center">
    <div class="mark">R<span class="dot">.</span></div>
    <p class="eyebrow">Novo na Remake Pixel</p>
    <h1>50 créditos<br/><span class="accent">grátis</span></h1>
    <p class="sub">Cria imagens, edita fotos e experimenta estilos.<br/>Sem mensalidade obrigatória.</p>
    <div class="pill">remakepix.com</div>
  </div>
</div>`,
  },
  {
    id: "04-estudio",
    name: "Estúdio completo",
    html: (assets) => `
<div class="ad ad--ui">
  <div class="grad"></div>
  <div class="ui-shot"><img src="${assets.dashboard}" alt=""/></div>
  <div class="content">
    <p class="brand">Remake Pixel</p>
    <h1>Estúdio IA<br/>num só sítio.</h1>
    <ul class="features">
      <li>Gerar &amp; editar</li>
      <li>Vídeo &amp; pôsteres</li>
      <li>Ferramentas Pro</li>
    </ul>
    <p class="cta">Começa grátis → remakepix.com</p>
  </div>
</div>`,
  },
  {
    id: "05-video-poster",
    name: "Vídeo e pôsteres",
    html: (assets) => `
<div class="ad ad--dual">
  <div class="grad"></div>
  <div class="dual">
    <div class="dual-card"><img src="${assets.motion}" alt=""/><span>Vídeo IA</span></div>
    <div class="dual-card"><img src="${assets.posters}" alt=""/><span>Pôsteres</span></div>
  </div>
  <div class="content content--bottom">
    <p class="brand">Remake Pixel</p>
    <h1>Do conceito<br/>ao post.</h1>
    <p class="sub">Clips curtos, pôsteres profissionais e imagens para redes.</p>
    <p class="cta">remakepix.com · 50 créditos grátis</p>
  </div>
</div>`,
  },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0B0B0C; }
.ad { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: 'Inter Tight', system-ui, sans-serif; color: #F4F1EA; }
.bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(2px) brightness(0.35); transform: scale(1.05); }
.grad { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,11,12,0.55) 0%, rgba(11,11,12,0.2) 35%, rgba(11,11,12,0.92) 72%, #0B0B0C 100%); pointer-events: none; }
.grad--strong { background: linear-gradient(180deg, rgba(11,11,12,0.7) 0%, rgba(11,11,12,0.5) 40%, rgba(11,11,12,0.95) 100%); }
.split { position: absolute; top: 120px; left: 48px; right: 48px; height: 520px; display: flex; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
.half { flex: 1; position: relative; overflow: hidden; }
.half img { width: 100%; height: 100%; object-fit: cover; }
.half.after { border-left: 2px solid rgba(168,85,247,0.6); }
.split-label { position: absolute; top: 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 6px 12px; border-radius: 6px; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); }
.before-l { left: 16px; color: #9CA3AF; }
.after-l { right: 16px; color: #C4B5FD; }
.content { position: absolute; left: 48px; right: 48px; bottom: 56px; z-index: 2; }
.content--bottom { bottom: 52px; }
.content--center { top: 50%; left: 48px; right: 48px; bottom: auto; transform: translateY(-50%); text-align: center; }
.brand { font-size: 13px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #A855F7; margin-bottom: 12px; }
.eyebrow { font-size: 12px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #8A8A8E; margin-bottom: 14px; }
h1 { font-size: 56px; font-weight: 700; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 16px; }
.accent { color: #C4B5FD; }
.sub { font-size: 22px; line-height: 1.45; color: #9CA3AF; font-weight: 400; max-width: 92%; }
.cta { margin-top: 28px; font-size: 15px; font-weight: 600; letter-spacing: 0.06em; color: #E9D5FF; }
.ad--grid .grid { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 3px; opacity: 0.85; }
.ad--grid .grid img { width: 100%; height: 100%; object-fit: cover; }
.ad--grid h1 { font-size: 52px; }
.mark { font-size: 88px; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 8px; }
.mark .dot { color: #9333EA; }
.pill { display: inline-block; margin-top: 32px; padding: 14px 32px; border-radius: 999px; background: linear-gradient(135deg, #7C3AED, #9333EA); font-size: 16px; font-weight: 600; letter-spacing: 0.08em; box-shadow: 0 8px 32px rgba(124,58,237,0.45); }
.ad--ui .ui-shot { position: absolute; top: 80px; left: 40px; right: 40px; height: 580px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.45); }
.ad--ui .ui-shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.ad--ui .content { bottom: 48px; }
.features { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 8px; padding: 0; }
.features li { font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 8px; background: rgba(124,58,237,0.2); border: 1px solid rgba(168,85,247,0.35); color: #DDD6FE; letter-spacing: 0.04em; }
.ad--dual .dual { position: absolute; top: 100px; left: 40px; right: 40px; display: flex; gap: 16px; height: 480px; }
.dual-card { flex: 1; border-radius: 16px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.1); }
.dual-card img { width: 100%; height: 100%; object-fit: cover; }
.dual-card span { position: absolute; bottom: 0; left: 0; right: 0; padding: 14px; font-size: 14px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; background: linear-gradient(transparent, rgba(0,0,0,0.85)); }
`;

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const assets = await loadAssets();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  });

  const manifest = [];

  for (const ad of ADS) {
    const page = await context.newPage();
    const body = ad.html(assets);
    await page.setContent(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${CSS}</style></head><body>${body}</body></html>`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(400);
    const pngPath = path.join(OUT, `ig-ad-${ad.id}.png`);
    const jpgPath = path.join(OUT, `ig-ad-${ad.id}.jpg`);
    await page.screenshot({ path: pngPath, type: "png" });
    await page.close();
    manifest.push({ id: ad.id, title: ad.name, png: pngPath, jpg: jpgPath });
    console.log("OK", pngPath);
  }

  await browser.close();

  const readme = `# Remake Pixel — 5 anúncios Instagram (1080×1350)

Formato: **4:5** (feed Instagram / Meta Ads). Export @2x para nitidez em mobile.

| Ficheiro | Conceito | Copy principal |
|----------|----------|----------------|
| ig-ad-01-transformacao | Antes/depois | A tua foto. Outro nível. |
| ig-ad-02-estilos | Grid estilos | 96 estilos. Um clique. |
| ig-ad-03-creditos | CTA créditos | 50 créditos grátis |
| ig-ad-04-estudio | UI estúdio | Estúdio IA num só sítio |
| ig-ad-05-video-poster | Vídeo + pôsteres | Do conceito ao post |

**URL:** https://remakepix.com  
**Registo:** 50 créditos grátis (ajustar se a oferta mudar)

## Meta Ads
- Colocação: Instagram Feed, Stories (recorte central), Explore
- Texto primário sugerido (PT): ver captions abaixo

### Ad 01
Primário: A mesma foto. Um estilo completamente novo. Experimenta no estúdio — 50 créditos grátis para começar.
Headline: A tua foto, outro nível
CTA: Registar

### Ad 02
Primário: 96 looks prontos: retrato, moda, editorial, anime. Escolhe, gera, publica.
Headline: Estilos prontos em 1 clique
CTA: Experimentar grátis

### Ad 03
Primário: 50 créditos grátis. Sem mensalidade obrigatória. Imagens, edição e vídeo num só estúdio.
Headline: Começa com 50 créditos
CTA: Criar conta

### Ad 04
Primário: Gerar, editar, vídeo e pôsteres — tudo em remakepix.com. Feito para criadores e marcas.
Headline: Estúdio IA completo
CTA: Ver estúdio

### Ad 05
Primário: Do clip ao pôster: conteúdo para Instagram e anúncios, sem sair do estúdio.
Headline: Vídeo e pôsteres com IA
CTA: Começar grátis
`;
  await fs.writeFile(path.join(OUT, "README.md"), readme);
  await fs.writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
