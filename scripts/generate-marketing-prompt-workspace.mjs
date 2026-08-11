#!/usr/bin/env node
/**
 * Gera HTML editável por categoria — marketing-video-prompts-workspace
 * node scripts/generate-marketing-prompt-workspace.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "marketing-video-prompts-workspace");

const CATEGORIES = [
  {
    id: "fashion",
    labelPt: "Roupa & Moda",
    labelEn: "Fashion & Apparel",
    hints: "frente, costas, modelo a vestir, logótipo, detalhes do tecido",
    examples: "Mini vestido noite · lookbook · provador luxo · street style",
  },
  {
    id: "drinks",
    labelPt: "Bebidas",
    labelEn: "Drinks & Beverages",
    hints: "ângulos da garrafa, consumo, ingredientes, branding",
    examples: "Garrafa hero · pour slow-mo · bar cocktail · ingredientes frescos",
  },
  {
    id: "cars",
    labelPt: "Automóveis",
    labelEn: "Automotive",
    hints: "exterior, interior, detalhes específicos, showroom",
    examples: "Hero exterior · interior cockpit · detalhe roda · noite neon",
  },
  {
    id: "cosmetics",
    labelPt: "Cosméticos",
    labelEn: "Cosmetics & Beauty",
    hints: "embalagem, utilização, branding, textura",
    examples: "Packshot · aplicação skincare · splash creme · espelho vanity",
  },
  {
    id: "websites",
    labelPt: "Sites & Aplicações",
    labelEn: "Websites & Apps",
    hints: "homepage, dashboard, preços, logótipo, UI",
    examples: "Landing hero · dashboard SaaS · mobile app · pricing page",
  },
  {
    id: "food",
    labelPt: "Alimentação",
    labelEn: "Food & Dining",
    hints: "prato hero, restaurante, ingredientes, menu",
    examples: "Prato steam · burger artisan · mesa restaurante · delivery box",
  },
  {
    id: "jewelry",
    labelPt: "Joias",
    labelEn: "Jewelry",
    hints: "packshot, uso, macro detalhe, luxo",
    examples: "Anel macro · colar em modelo · relógio hero · caixa premium",
  },
  {
    id: "realEstate",
    labelPt: "Imobiliário",
    labelEn: "Real Estate",
    hints: "fachada, sala, cozinha, vista, lifestyle",
    examples: "Fachada golden hour · living room · cozinha design · vista varanda",
  },
  {
    id: "gaming",
    labelPt: "Produtos Gaming",
    labelEn: "Gaming Products",
    hints: "periféricos, setup RGB, produto hero, esports",
    examples: "Headset hero · setup desk RGB · controller macro · monitor ad",
  },
];

const SLOT_COUNT = 10;

function slotHtml(cat, n) {
  const num = String(n).padStart(2, "0");
  const idPlaceholder = `${cat.id}_prompt_${num}`;
  return `
  <article class="prompt-slot is-empty" id="slot-${num}" data-slot="${n}">
    <h2>Prompt ${num}</h2>
    <div class="grid-2">
      <div class="field">
        <label for="${cat.id}-id-${n}">id (único)</label>
        <input type="text" id="${cat.id}-id-${n}" name="id" value="${idPlaceholder}" />
        <p class="hint">Ex.: ${cat.id}_hero_pan_${num}</p>
      </div>
      <div class="field">
        <label for="${cat.id}-weight-${n}">weight (prioridade)</label>
        <input type="number" id="${cat.id}-weight-${n}" name="weight" value="10" min="1" max="100" />
        <p class="hint">Maior número = mais provável ser escolhido</p>
      </div>
    </div>
    <div class="field">
      <label for="${cat.id}-durations-${n}">durations (segundos)</label>
      <input type="text" id="${cat.id}-durations-${n}" name="durations" value="4, 6, 10, 15" />
      <p class="hint">Valores válidos: 4 · 6 · 10 · 15 (separados por vírgula)</p>
    </div>
    <div class="field">
      <label for="${cat.id}-storyboard-${n}">storyboard (conceito interno — não visível ao user)</label>
      <textarea id="${cat.id}-storyboard-${n}" name="storyboard" rows="4" placeholder="Descreve o storyboard: abertura, movimento de câmara, clímax, fecho…"></textarea>
    </div>
    <div class="field">
      <label for="${cat.id}-prompt-${n}">prompt (Seedance 2.0 — oculto ao utilizador)</label>
      <textarea class="prompt-body" id="${cat.id}-prompt-${n}" name="prompt" rows="10" placeholder="Prompt completo em inglês (recomendado). Use [Image1] como produto principal e [Image2]…[Image6] como referências. Vertical 9:16, cinematic, smooth motion…"></textarea>
      <p class="hint">Este texto nunca aparece na interface — só a IA usa internamente.</p>
    </div>
  </article>`;
}

function categoryPage(cat) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => slotHtml(cat, i + 1)).join("\n");
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${cat.labelPt} — Prompts Marketing Video</title>
  <link rel="stylesheet" href="../shared/styles.css" />
</head>
<body>
  <div class="wrap">
    <a class="back" href="../index.html">← Todas as categorias</a>

    <header class="hero">
      <p class="meta">category: ${cat.id}</p>
      <h1>${cat.labelPt}</h1>
      <p>${cat.labelEn}</p>
    </header>

    <div class="note">
      Preenche <strong>3 a 10 prompts</strong>. Apaga os slots que não usares (bloco <code>&lt;article class="prompt-slot"&gt;…</code>).
      Referências de imagem: <strong>[Image1]</strong> = principal · <strong>[Image2]–[Image6]</strong> = contexto/branding/ângulos.
    </div>

    <section class="note" style="background:#1a1a1c;border-color:var(--border);color:var(--muted);">
      <strong style="color:var(--text);">Ideias para ${cat.labelPt}</strong><br />
      Refs típicas: ${cat.hints}<br />
      Exemplos de conceitos: ${cat.examples}
    </section>

    <main>
${slots}
    </main>

    <footer>
      Remake Pixel · Vídeos de Marketing com IA · Categoria <code>${cat.id}</code><br />
      Quando terminares, guarda este ficheiro e avisa no chat com o caminho da pasta <code>marketing-video-prompts-workspace</code>.
    </footer>
  </div>
</body>
</html>
`;
}

function indexPage() {
  const cards = CATEGORIES.map(
    (c) => `      <a class="cat-card" href="${c.id}/index.html">
        <strong>${c.labelPt}</strong>
        <span>${c.labelEn} · <code>${c.id}</code></span>
      </a>`,
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prompts — Vídeos de Marketing com IA</title>
  <link rel="stylesheet" href="shared/styles.css" />
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <p class="meta">Remake Pixel · marketing-video-prompts-workspace</p>
      <h1>Vídeos de Marketing com IA</h1>
      <p>Workspace para editar prompts ocultos por categoria. Abre cada secção, preenche os campos e guarda. Depois envia-me o caminho desta pasta para integrar no site.</p>
    </header>

    <div class="note">
      Cada categoria tem até <strong>10 slots</strong> de prompt. Usa entre <strong>3 e 10</strong> por categoria.
      Durações suportadas: <strong>4s · 6s · 10s · 15s</strong> · Formato fixo: <strong>9:16</strong>.
    </div>

    <nav class="cat-grid" aria-label="Categorias">
${cards}
    </nav>

    <footer>
      Caminho sugerido para me enviares depois:<br />
      <code>C:\\Users\\eduar\\OneDrive\\Desktop\\Meu-site-222\\marketing-video-prompts-workspace</code>
    </footer>
  </div>
</body>
</html>
`;
}

async function main() {
  await fs.mkdir(path.join(OUT, "shared"), { recursive: true });
  await fs.writeFile(path.join(OUT, "index.html"), indexPage(), "utf8");

  for (const cat of CATEGORIES) {
    const dir = path.join(OUT, cat.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), categoryPage(cat), "utf8");
    console.log(`✓ ${cat.id}/index.html`);
  }

  console.log(`\nWorkspace pronto: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
