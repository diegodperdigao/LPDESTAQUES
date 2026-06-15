/**
 * build.mjs — gera a LP de uma marca a partir do template + config.
 *
 *   node build.mjs <marca>        # ex.: node build.mjs superjon
 *
 * Saídas:
 *   dist/<marca>/                 -> deploy (index.html + engine/ + brands/<marca>/)
 *   preview[-<marca>].html        -> arquivo único (CSS+JS+config inline) p/ preview
 *
 * Cloudflare Pages: build command "node build.mjs <marca>", output "dist/<marca>".
 * Multi-marca: tudo específico fica em brands/<marca>/; o engine é compartilhado.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'fs';

const brand = process.argv[2] || process.env.BRAND || 'superjon';
const cfgCode = readFileSync(`brands/${brand}/config.js`, 'utf8');

// Lê a config (window.BRAND) num sandbox p/ montar o <head> da marca.
const win = {};
new Function('window', cfgCode)(win);
const B = win.BRAND;
if (!B) throw new Error(`brands/${brand}/config.js não define window.BRAND`);

const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const logos = [B.hero?.brandLogo, B.hero?.creatorLogo].filter(Boolean);
const origins = [...new Set(logos.filter((u) => /^https?:/.test(u)).map((u) => new URL(u).origin))];
const fav = B.meta?.favicon || '';

const head = [
  `<title>${esc(B.meta?.title)}</title>`,
  `<meta name="description" content="${esc(B.meta?.description)}" />`,
  `<meta name="theme-color" content="${B.meta?.themeColor || '#000000'}" />`,
  fav && `<link rel="icon" href="${fav}" />`,
  fav && `<link rel="apple-touch-icon" href="${fav}" />`,
  ...origins.map((o) => `<link rel="preconnect" href="${o}" crossorigin />`),
  ...logos.map((u) => `<link rel="preload" as="image" fetchpriority="high" href="${u}" />`)
].filter(Boolean).join('\n  ');

const template = readFileSync('index.template.html', 'utf8');
const html = template
  .replace('<!--BRAND_HEAD-->', head)
  .replace('<!--BRAND_CONFIG-->', `<script src="./brands/${brand}/config.js"></script>`);

// 1) dist/<marca> — deploy (arquivos linkados)
const dist = `dist/${brand}`;
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
writeFileSync(`${dist}/index.html`, html);
cpSync('engine', `${dist}/engine`, { recursive: true });
cpSync(`brands/${brand}`, `${dist}/brands/${brand}`, { recursive: true });

// 2) preview self-contained (tudo inline) p/ abrir direto / githack
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
