// Smoke tests for the Leonida Legend trophy guide entry.
// Run: node smoke.test.mjs
// Checks the data against the kit starter's official list, the app's file
// references, the screenshot limits, the vendored library's integrity, and
// that main.ts hands in a dossier.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const kitStarter = join(root, '..', 'kits', 'gta6-trophy-guide-01', 'gta6-trophy-guide-01-kit', 'starter');

let passed = 0;
const failures = [];
function check(label, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${label}`); }
  else { failures.push(label); console.log(`FAIL  ${label}${detail ? ' — ' + detail : ''}`); }
}

// --- trophies.json vs the kit starter's official list -------------------
const official = JSON.parse(readFileSync(join(kitStarter, 'app', 'data', 'trophies.json'), 'utf8')).trophies;
const doc = JSON.parse(readFileSync(join(root, 'app', 'data', 'trophies.json'), 'utf8'));
const mine = doc.trophies;
check('trophies.json parses and holds 55 trophies', Array.isArray(mine) && mine.length === 55, `got ${mine && mine.length}`);

const officialNames = official.map((t) => t.name).sort();
const myNames = mine.map((t) => t.name).sort();
check('exactly the 55 official names', JSON.stringify(officialNames) === JSON.stringify(myNames));

const officialByName = new Map(official.map((t) => [t.name, t]));
check('descriptions and grades match the official list verbatim',
  mine.every((t) => {
    const o = officialByName.get(t.name);
    return o && o.description === t.description && o.grade === t.grade;
  }));

check('every trophy has a non-blank guide', mine.every((t) => typeof t.guide === 'string' && t.guide.trim().length > 0));
check('every trophy cites at least one source', mine.every((t) => Array.isArray(t.sources) && t.sources.length >= 1 && t.sources.every((s) => s.trim())));
check('every guide differs from the starter one-liner (own words)',
  mine.every((t) => t.guide !== officialByName.get(t.name).guide && t.guide.trim().length >= 80));
check('kinds are from the allowed set', mine.every((t) => ['story', 'missable', 'collectibles', 'activities', 'online'].includes(t.kind)));
const gradeCounts = {};
for (const t of mine) gradeCounts[t.grade] = (gradeCounts[t.grade] ?? 0) + 1;
check('grade split is 1 platinum / 2 gold / 6 silver / 46 bronze',
  gradeCounts.platinum === 1 && gradeCounts.gold === 2 && gradeCounts.silver === 6 && gradeCounts.bronze === 46,
  JSON.stringify(gradeCounts));
check('28 trophies flagged hidden (the published hidden total)', mine.filter((t) => t.hidden).length === 28);
check('at least one missable flagged, each saying the flag is inferred',
  mine.some((t) => t.missable) && mine.filter((t) => t.missable).every((t) => /inferred from the official description/.test(t.guide)));

// --- app references stay inside app/ ------------------------------------
const html = readFileSync(join(root, 'app', 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
check('index.html references only files inside app/', refs.length > 0 && refs.every((r) =>
  !/^(https?:)?\/\//.test(r) && !r.startsWith('/') && existsSync(join(root, 'app', r))), refs.join(', '));
const appJs = readFileSync(join(root, 'app', 'app.js'), 'utf8');
check('app.js names no external URL', !/https?:\/\//.test(appJs));

// --- screenshots ----------------------------------------------------------
const shots = readdirSync(join(root, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
check('exactly 3 screenshots, cover first by name', shots.length === 3 && shots[0].startsWith('1-'), shots.join(', '));
for (const f of shots) {
  const buf = readFileSync(join(root, 'screenshots', f));
  const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  let w = 0, h = 0;
  if (isPng) { w = buf.readUInt32BE(16); h = buf.readUInt32BE(20); }
  const long = Math.max(w, h), short = Math.min(w, h);
  check(`${f}: whole PNG, ≤256 KiB, long side ≤1280, short side ≥480`,
    isPng && buf.length <= 262144 && long <= 1280 && short >= 480,
    `${w}x${h}, ${buf.length} bytes`);
}

// --- vendor library is the kit's copy, byte for byte ----------------------
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
check('vendor/makefun-frontend.ts sha256 equals the kit starter copy',
  sha(join(root, 'vendor', 'makefun-frontend.ts')) === sha(join(kitStarter, 'vendor', 'makefun-frontend.ts')));

// --- claim file and license ------------------------------------------------
check('.makefun/owner.json holds the wallet claim',
  readFileSync(join(root, '.makefun', 'owner.json'), 'utf8') === '{"wallet": "7xpK8LwVVh3QD3a1xVMbhgDxUya3wQESHPs9byJshnAU"}');
check('LICENSE is MIT', readFileSync(join(root, 'LICENSE'), 'utf8').includes('MIT License'));

// --- main.ts hands in a dossier ---------------------------------------------
const outDir = join(root, 'out');
execFileSync(process.execPath, ['main.ts'], { cwd: root, env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir }, stdio: 'pipe' });
check('node main.ts writes out/dossier.json', existsSync(join(outDir, 'dossier.json')));
check('out/ carries app/ and screenshots/',
  existsSync(join(outDir, 'app', 'data', 'trophies.json')) && existsSync(join(outDir, 'screenshots', shots[0])));
const dossierSize = statSync(join(outDir, 'dossier.json')).size;
check('dossier.json is at most 1.5 MiB', dossierSize <= 1572864, `${dossierSize} bytes`);
console.log(`\ndossier.json: ${dossierSize} bytes`);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
