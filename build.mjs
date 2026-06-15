/**
 * build.mjs — gera a LP de uma marca a partir do template + config.
 *
 *   node build.mjs <marca>        # ex.: node build.mjs superjon
 *
 * Saídas:
 *   dist/<marca>/                 -> deploy (index.html + engine/ + brands/<marca>/)
 *   preview[-<marca>].html        -> arquivo único (CSS+JS+config inline) p/ preview
 *
 * Tudo específico da marca (cores, fontes, textos, assets) vem de
 * brands/<marca>/config.js. O engine é compartilhado.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'fs';

const brand = process.argv[2] || process.env.BRAND || 'superjon';
const cfgCode = readFileSync(`brands/${brand}/config.js`, 'utf8');

const win = {};
new Function('window', cfgCode)(win);
const B = win.BRAND;
if (!B) throw new Error(`brands/${brand}/config.js não define window.BRAND`);

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
  .replace('<!--BRAND_CONFIG-->', `<script src="./brands/${brand}/config.js"></script>`);

// 1) dist/<marca> — deploy (arquivos linkados)
const dist = `dist/${brand}`;
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(`${dist}/index.html`, html);
cpSync('engine', `${dist}/engine`, { recursive: true });
cpSync(`brands/${brand}`, `${dist}/brands/${brand}`, { recursive: true });

// 2) preview self-contained (CSS+JS+config inline) p/ abrir direto / githack
const preview = html
  .replace('<link rel="stylesheet" href="./engine/engine.css" />',
    `<style>\n${readFileSync('engine/engine.css', 'utf8')}\n</style>`)
  .replace(`<script src="./brands/${brand}/config.js"></script>`,
    `<script>\n${cfgCode}\n</script>`)
  .replace('<script src="./engine/engine.js" defer></script>',
    `<script>\n${readFileSync('engine/engine.js', 'utf8')}\n</script>`);
const previewName = brand === 'superjon' ? 'preview.html' : `preview-${brand}.html`;
writeFileSync(previewName, preview);

console.log(`✓ build ${brand} -> dist/${brand}/ + ${previewName}`);
