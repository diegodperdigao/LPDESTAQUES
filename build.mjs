/**
 * build.mjs — gera a LP de uma marca (e variante) a partir do template + config.
 *
 *   node build.mjs <marca>            # ex.: node build.mjs jon
 *   node build.mjs <marca> <variante> # ex.: node build.mjs nobru direta
 *
 * Saídas:
 *   dist/<nome>/                  -> deploy (index.html + engine/ + brands/<marca>/)
 *   preview[-<nome>].html         -> arquivo único (CSS+JS+config inline) p/ preview
 *
 * Variante: herda TUDO da base (assets, link de cadastro, Supabase/DB) e
 * sobrescreve só o que B.variants[variante] define (ex.: flow, source).
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'fs';

const brand = process.argv[2] || process.env.BRAND || 'jon';
const variant = process.argv[3] || process.env.VARIANT || '';
const cfgCode = readFileSync(`brands/${brand}/config.js`, 'utf8');

// merge recursivo simples (objetos puros); arrays/escalares sobrescrevem
function deepMerge(base, over) {
  if (Array.isArray(over) || typeof over !== 'object' || over === null) return over;
  const out = Object.assign({}, base);
  for (const k of Object.keys(over)) {
    const bv = base ? base[k] : undefined;
    const ov = over[k];
    out[k] = (bv && typeof bv === 'object' && !Array.isArray(bv) &&
              ov && typeof ov === 'object' && !Array.isArray(ov))
      ? deepMerge(bv, ov) : ov;
  }
  return out;
}

const win = {};
new Function('window', cfgCode)(win);
let B = win.BRAND;
if (!B) throw new Error(`brands/${brand}/config.js não define window.BRAND`);

let outName = brand;
if (variant) {
  const ov = (B.variants || {})[variant];
  if (!ov) throw new Error(`variante "${variant}" não existe em brands/${brand}/config.js (B.variants)`);
  B = deepMerge(B, ov);
  outName = `${brand}-${variant}`;
}
delete B.variants; // não vai pro cliente

// config p/ o cliente: base usa o arquivo linkado; variante injeta o objeto
// já mesclado inline (o config.js linkado não tem o merge da variante).
const configTag = variant
  ? `<script>window.BRAND = ${JSON.stringify(B)};</script>`
  : `<script src="./brands/${brand}/config.js"></script>`;

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fonts = B.fonts || {};
const faces = fonts.faces || [];
const logos = [B.hero?.brandLogo, B.hero?.creatorLogo].filter(Boolean);
const fav = B.meta?.favicon || '';

// origens p/ preconnect (logos externas + google fonts)
const origins = new Set(logos.filter((u) => /^https?:/.test(u)).map((u) => new URL(u).origin));
if (fonts.google) { origins.add('https://fonts.googleapis.com'); origins.add('https://fonts.gstatic.com'); }

// ---- <head> da marca ----
const googleUrl = fonts.google
  ? `https://fonts.googleapis.com/css2?family=${fonts.google}&display=swap`
  : null;

const head = [
  `<title>${esc(B.meta?.title)}</title>`,
  `<meta name="description" content="${esc(B.meta?.description)}" />`,
  `<meta name="theme-color" content="${B.meta?.themeColor || '#000000'}" />`,
  fav && `<link rel="icon" href="${fav}" />`,
  fav && `<link rel="apple-touch-icon" href="${fav}" />`,
  ...[...origins].map((o) => `<link rel="preconnect" href="${o}" crossorigin />`),
  ...logos.map((u) => `<link rel="preload" as="image" fetchpriority="high" href="${u}" />`),
  ...faces.map((f) => `<link rel="preload" as="font" type="font/woff2" href="${f.src}" crossorigin />`),
  googleUrl && `<link rel="preload" as="style" href="${googleUrl}" onload="this.onload=null;this.rel='stylesheet'" />`,
  googleUrl && `<noscript><link rel="stylesheet" href="${googleUrl}" /></noscript>`
].filter(Boolean).join('\n  ');

// ---- <style> da marca (@font-face + tokens) ----
const faceCss = faces.map((f) => `@font-face{font-family:'${f.family}';src:url('${f.src}') format('${f.format || 'woff2'}');font-weight:${f.weight || '400 900'};font-style:${f.style || 'normal'};font-display:swap;}`).join('\n');
const tokenCss = B.tokens ? ':root{' + Object.entries(B.tokens).map(([k, v]) => `${k}:${v};`).join('') + '}' : '';
// CSS customizado opcional por marca (brands/<marca>/style.css)
const brandCssPath = `brands/${brand}/style.css`;
const brandCss = existsSync(brandCssPath) ? readFileSync(brandCssPath, 'utf8') : '';
const brandStyle = (faceCss || tokenCss || brandCss)
  ? `<style>\n${faceCss}\n${tokenCss}\n${brandCss}\n</style>` : '';

const template = readFileSync('index.template.html', 'utf8');
const html = template
  .replace('<!--BRAND_HEAD-->', head)
  .replace('<!--BRAND_STYLE-->', brandStyle)
  .replace('<!--BRAND_CONFIG-->', configTag);

// 1) dist/<nome> — deploy (arquivos linkados; assets sempre em brands/<marca>/)
const dist = `dist/${outName}`;
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(`${dist}/index.html`, html);
cpSync('engine', `${dist}/engine`, { recursive: true });
cpSync(`brands/${brand}`, `${dist}/brands/${brand}`, { recursive: true });

// 2) preview self-contained (CSS+JS+config inline) p/ abrir direto / githack
let preview = html
  .replace('<link rel="stylesheet" href="./engine/engine.css" />',
    `<style>\n${readFileSync('engine/engine.css', 'utf8')}\n</style>`)
  .replace('<script src="./engine/engine.js" defer></script>',
    `<script>\n${readFileSync('engine/engine.js', 'utf8')}\n</script>`);
if (!variant) {
  // base: troca o config linkado pelo inline; variante já está inline
  preview = preview.replace(`<script src="./brands/${brand}/config.js"></script>`,
    `<script>\n${cfgCode}\n</script>`);
}
const previewName = outName === 'jon' ? 'preview.html' : `preview-${outName}.html`;
writeFileSync(previewName, preview);

console.log(`✓ build ${outName} -> dist/${outName}/ + ${previewName}`);
