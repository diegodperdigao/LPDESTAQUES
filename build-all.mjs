/**
 * build-all.mjs — gera as 4 LPs num único dist/ (deploy do Cloudflare Pages).
 *
 *   node build-all.mjs
 *
 * Saída:
 *   dist/jon/ · dist/jon-direta/ · dist/nobru/ · dist/nobru-direta/
 *   dist/index.html  (índice de QA com links pras 4)
 *
 * No Cloudflare Pages: build command = `node build-all.mjs`, output dir = `dist`.
 * As LPs ficam em /jon/, /jon-direta/, /nobru/, /nobru-direta/.
 */
import { execSync } from 'child_process';
import { rmSync, writeFileSync } from 'fs';

const targets = [
  ['jon'],
  ['jon', 'direta'],
  ['nobru'],
  ['nobru', 'direta'],
  ['hudson'],
  ['hudson', 'direta']
];

rmSync('dist', { recursive: true, force: true });

const names = [];
for (const t of targets) {
  execSync(`node build.mjs ${t.join(' ')}`, { stdio: 'inherit' });
  names.push(t.join('-'));
}

// raiz neutra: não expõe as LPs (acesso só pelos links diretos /jon/, /nobru/...)
writeFileSync('dist/index.html',
  `<!doctype html><html lang="pt-br"><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>404</title>
<body style="font-family:system-ui;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#0b0b0c;color:#7a7a7a">
  <p>Página não encontrada.</p>
</body></html>\n`);

console.log(`\n✓ build-all -> dist/ (${names.join(', ')}) + raiz neutra`);
