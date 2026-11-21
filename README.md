# Leonida Legend — GTA VI Trophy Guide & Tracker

An offline guide and tracker for the 55 PlayStation 5 trophies of
Grand Theft Auto VI, built for the make.fun `gta6-trophy-guide-01` bounty.

## What it is

- **Checklist** — all 55 trophies with their official names, descriptions
  and grades. Tick them off; progress is saved in the browser
  (localStorage) and shown as a percentage and per-grade counts
  (platinum / gold / silver / bronze).
- **Guides with sources** — select any trophy to read its guide, written
  for this tracker from the official description, with its sources named
  beside it: the official PS5 trophy list (PlayStation), as listed by
  Exophase, and the PSNProfiles trophy list.
- **Filters & search** — by kind (story, missable, collectibles,
  activities, online), by grade, by text, plus a hide-earned switch.
- **Spoiler shield** — a setting that hides the names and descriptions of
  unearned story trophies until they are earned.
- **Roadmap** — five stages to the platinum, built from the official
  descriptions: the story with missables flagged, the collectibles sweep,
  activities/feats/money mop-up, 100% completion, and the platinum. The
  official list contains no online trophies, so there is no online stage.
- **Missables view** — every flagged trophy in one place.
- **Export / import** — progress downloads as a JSON file and imports back.

## Data notes (app/data/trophies.json)

Names, descriptions and grades are the official list exactly as
PlayStation publishes them (one name keeps its asterisks:
"T**s Ass Drug Money"). On top of the official fields, each trophy carries
this entry's own work:

- `guide` — the guide text, in this entry's own words.
- `kind` — story / collectibles / activities, classified from the
  official description (no trophy on the list is an online trophy).
- `count` — the progress count PlayStation tracks, where the official
  list gives one (e.g. 42 Shooting Range challenges, 250 stunts,
  500 choices, 52 areas of Leonida).
- `missable` — flagged only where the description describes a one-off
  scene rather than a repeatable activity (Catch Me If You Can,
  In The Beginning…, Capital Offense, Let’s Go Bowling, Personal Best).
  Each flagged guide states plainly that the flag is **inferred from the
  official description**.
- `hidden` — the published list summary counts 28 hidden trophies; the
  flags mark the story-progression trophies and the trophies whose
  published descriptions are deliberately cryptic, totalling 28.
- `stage` — the roadmap stage the trophy belongs to.
- `sources` — the sources cited for the guide.

No locations, mission steps or facts are stated that the official
descriptions do not support; where a description is a riddle, the guide
says so and gives only the preparation that follows from it.

## Run it

The app is static files under `app/` with no build step. Serve `app/`
with any static server and open it in a browser, e.g.:

```
cd app && python3 -m http.server 8080   # then open http://localhost:8080
```

It loads nothing over the network: the only file it fetches is its own
`data/trophies.json`.

## Hand in (main.ts)

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` there with `buildDossier` from
`vendor/makefun-frontend.ts` — the kit's library, kept byte-identical,
as the bounty requires.

## Screenshots

`screenshots/` holds three 1280×800 PNG renders of the app
(`make_screenshots.py` regenerates them from the real data):
1. the checklist with The Shootist's guide and sources open beside it,
   progress and filters visible;
2. the roadmap view;
3. the missables view with the spoiler shield on.

## Tests

```
node smoke.test.mjs
```

checks the trophy data against the kit starter's official list (names,
descriptions, grades, guides, sources), the app's file references, the
screenshot limits, the vendored library's sha256, and that `main.ts`
produces `out/dossier.json`.

## License

MIT © 2026 oy-builds. An unofficial fan-made guide; not affiliated with
Rockstar Games or PlayStation. Trophy names and descriptions are the
official list as published by PlayStation.
