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
  ['nobru', 'direta']
];

rmSync('dist', { recursive: true, force: true });

const names = [];
for (const t of targets) {
  execSync(`node build.mjs ${t.join(' ')}`, { stdio: 'inherit' });
  names.push(t.join('-'));
}

// índice raiz (só pra QA/navegação)
const items = names.map((n) => `    <li><a href="./${n}/">${n}</a></li>`).join('\n');
writeFileSync('dist/index.html',
  `<!doctype html><html lang="pt-br"><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>LPs</title>
<body style="font-family:system-ui;max-width:560px;margin:40px auto;padding:0 16px">
  <h1>LPs de conversão</h1>
  <ul>
${items}
  </ul>
</body></html>\n`);

console.log(`\n✓ build-all -> dist/ (${names.join(', ')})`);
