import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceHtml = path.join(rootDir, 'index.html');
const distDir = path.join(rootDir, 'dist');
const distHtml = path.join(distDir, 'index.html');

const pageHtml = await fs.readFile(sourceHtml, 'utf8');
const pagesHtml = pageHtml.replace(
  '<script src="./dist/app.js"></script>',
  '<script src="./app.js"></script>',
);

await fs.mkdir(distDir, { recursive: true });
await fs.writeFile(distHtml, pagesHtml, 'utf8');
await fs.writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');
