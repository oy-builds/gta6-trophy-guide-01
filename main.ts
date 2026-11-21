// Leonida Legend — entry program for the gta6-trophy-guide-01 bounty
// (Node 22, standard library only).
//
// The guide itself is the static web app in app/ (index.html, style.css,
// app.js and data/trophies.json — no build step, nothing fetched from the
// network when it runs). This program hands the entry in: it copies app/
// and screenshots/ into the output directory and writes dossier.json
// there with buildDossier from the vendored make.fun library, which must
// stay byte-identical to the kit's copy because the scorer rebuilds the
// dossier with its own and compares the two.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits for this bounty, so a dossier
// this program writes is one the scorer accepts: at most 4 screenshots of
// at most 256 KiB each, at most 993 files and 48 MiB under app/, and the
// dossier text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
