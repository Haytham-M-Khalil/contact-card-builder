# CLAUDE.md

Guidance for working in this repo. Read this first.

> **Status (2026-11-17): finished and on hold.** The live site is complete. The
> maintainer doesn't plan new features; the expected reason to come back is a
> **real test print** that shows something to fix (see
> [Fixing print issues](#fixing-print-issues)). Don't start the on-hold roadmap
> items (6–8) unless the maintainer asks.

## What this is

**Contact Card Builder** — a browser-only web app that turns a simple form
(name, title, company, one or more labelled phones, email, links) into:

- a **print-ready PDF business card**,
- optionally a **QR code `.png`**, and
- optionally a **`.vcf` contact file**,

with a toggle for **"PDF only" vs "all files"**, a **card-size dropdown**
(US 3.5×2 in and EU/ISO 85×55 mm), and a **PDF-layout dropdown**: one card per page
(for a print shop) or a full sheet of 10 cards with cut marks for printing at home
(US cards on Letter, EU cards on A4; a gap between columns and accent-bar bleed make
hand cutting forgiving — `layoutSheet()` / `drawBleed()` in `app.js`).

It is a browser re-implementation of the desktop Python script that originally
produced these files (vCard → QR → PDF). The `.vcf` is the **source of truth**;
the QR encodes the exact same vCard text.

The UI is **bilingual (English + Arabic)** with a language toggle. Arabic flips the
whole layout to right-to-left and renders in the vendored **Amiri** font, in both the
PDF and the live preview. The preview is drawn from the **same layout** as the PDF:
`layoutCard()` in `app.js` computes every element once, in PDF points, and both
`buildPdf()` (jsPDF) and `renderPreview()` (an SVG whose viewBox is the card in points)
draw that list — so what you see is what prints.

## Hard constraints

- **Browser-only.** No backend, no server code, no database.
- **No build step, no bundler, no Node toolchain.** You never need `npm install`
  to run or ship this. Open `index.html` and it works.
- **Hostable free on GitHub Pages** as plain static files.
- Third-party libraries are **vendored** into `lib/` (committed, served by Pages),
  not loaded from a CDN. See `lib/README.md`.

## Conventions

- Plain **HTML / CSS / JS**. No framework. **2-space indentation.**
- **Classic `<script>` tags** (not ES modules), so the app also works when opened
  directly via `file://`. Libraries load **before** `app.js`.
- App logic lives in `app.js`; styles in `style.css`; markup in `index.html`.
- Vendored libs are **pinned to a version** and documented in `lib/README.md`.
- **vCard for max import compatibility:** plain `TEL` lines (mirrors the original
  Python script). The QR encodes the exact vCard string.
- **Commit after each small, testable feature** with a short imperative message
  (e.g. `feat: build the vCard string from the form`).
- Keep it approachable — this is a first open-source / learning project; favor
  clear, readable code over clever code.

## Design work

For any visual / UI change, load the project skill **`frontend-design`**
(`.claude/skills/frontend-design/`, vendored unmodified from
[anthropics/skills](https://github.com/anthropics/skills), Apache-2.0). Its guidance
applies within these project rules, which win on conflict:

- **The card preview must keep matching the PDF.** Change the card only in
  `layoutCard()` in `app.js`; both the PDF and the preview draw from it. Restyle the
  *app around the card* freely, but never position card content with CSS. New card
  content must keep `layoutCard()`'s `fits` flag honest (it drives the "doesn't fit"
  warning), and must not change cards that already fit.
- **No CDN fonts or assets.** A new typeface must be vendored into `lib/` as `.woff2`
  (with its license, version and source recorded in `lib/README.md`). The app UI uses
  **Readex Pro** (one family, Latin + Arabic); don't add another UI family.
- **The UI never uses the accent color.** App chrome is neutral ink/paper (light and
  dark via `prefers-color-scheme`); the accent appears only on the card and swatches.
- **Bilingual + RTL.** Every layout must work in English and Arabic: use logical
  properties (`inline-start/end`, `margin-inline-*`), never hard-coded left/right, and
  add any new UI text to both languages in the i18n table in `app.js`.
- **The accent color is user-editable** — the UI must look right with any accent, so
  don't build the palette around the default purple.
- Quality floor: responsive to phone width, visible keyboard focus,
  `prefers-reduced-motion` respected, WCAG AA contrast.
- Check changes in a real browser in both languages and both card sizes before committing.

## Project structure

```
index.html     # markup; loads style.css, then vendored libs, then app.js
style.css      # all styles
app.js         # all app logic (vCard, QR, PDF, i18n, live preview)
tests.html     # dev page: open in a browser to run tests.js against app.js
tests.js       # tiny test runner + tests (uses window.ContactCard)
favicon.svg    # tab icon (the header logo on a pixel grid); apple-touch-icon.png for phones
lib/           # vendored third-party libs (qrcode-generator, jsPDF, Amiri + Arimo + Readex Pro fonts) + README
docs/          # README assets (screenshot.png)
.claude/skills/ # project skills for Claude Code (frontend-design)
README.md      # user-facing intro, usage, local run, deploy
LICENSE        # MIT
```

## Roadmap (one commit per step)

The original build (v1: scaffold → form → vCard → QR → PDF → downloads → polish →
GitHub Pages) shipped first; see git history. A second round was agreed with the
maintainer on 2026-11-16. Steps 1–5 shipped; **6–8 are on hold** (maintainer,
2026-11-17).

1. ✅ **Remember the form between visits** — the whole form is saved to
   `localStorage` and restored on load (same try/catch pattern as the saved language;
   the app still works without storage). **"Clear form"** asks for confirmation first,
   and switching language never clears what was typed.
2. ✅ **Company field** — optional; shown on the card (via `layoutCard()`) and written
   to the vCard as `ORG`, so it lands in the QR too.
3. ✅ **QR density warning** — warns (never blocks) when a printed QR module would be
   under 0.4 mm (`QR_MIN_MODULE_MM`) at the chosen card size, and suggests fewer links
   or unticking "links in QR". `layoutCard()` also tightens the contact-line spacing on
   crowded cards and returns `fits: false` when text still runs off the card or into
   the QR; the same warning bar says so. Cards that already fit print exactly as before.
   *On-screen check (2026-11-16, PDF in Brave):* the warned US card with 5 links
   (0.39 mm modules) only scanned from 250% zoom; the unwarned EU one (0.42 mm) from
   110%. The threshold seems about right, but no printed card has been scanned yet.
4. ✅ **Test page** — `tests.html` runs `tests.js` (a tiny runner + tests) in the
   browser: vCard building and escaping, URLs, Arabic detection, `layoutCard` fit,
   `qrScanCheck`, the back side and file names. **Open it and check it's all green
   before committing a change to `app.js`**, and add tests for new logic there.
5. ✅ **Back side, one-card PDF only, off by default** — "Back of the card"
   (`back: "none" | "qr" | "other"`, saved with the form) adds a second PDF page.
   `layoutCard(data, lang, qr, "back")` lays it out; `hasBack()` gates page 2, the
   preview's Front/Back switch (it flips the card) and the `card-2-sided_…` file name.
   The full sheet stays front-only (duplex alignment can't be verified without a
   printer). With the back blank, every PDF is byte-identical to before.
   - *Large QR* (`layoutBack()`): centered QR, bigger modules than the front's, accent
     bar on the far edge (a card turns over like a page).
   - *Card in the other language* (maintainer's spec, 2026-11-17): 3 optional fields
     (name / title / company in the other language; empty → the front's text). Phone
     labels are translated through `PHONE_LABELS` pairs; custom ones print as
     "Phone"/"هاتف" unless already in the back's script. The back gets **its own QR**
     from the back's details (`backCardData()` → `buildVCard()`), so scanning it saves
     the contact in the back's language; the `.vcf` and QR `.png` downloads stay the
     front's. The UI language decides the front's, so the language toggle swaps each
     filled pair and known labels (`swapCardLanguages()`).

**On hold (2026-11-17) — start only if the maintainer asks:**

6. *Logo on the back side* — upload an image for the back. Never on the front (crowds
   the layout) and never in the vCard (bloats the QR). Undecided if it comes back: a
   4th "Back of the card" option (logo alone, centered) or a logo beside the large QR,
   and a fixed size or a size choice. A logo would also need its own `localStorage`
   key, so a full storage quota can't stop the form from being saved.
7. *More UI languages* via the i18n table, plus a short `CONTRIBUTING.md`. A new
   right-to-left script would also need a vendored card font (as Amiri is for Arabic).
8. *Work offline on GitHub Pages* (manifest + service worker). Judged low value: the
   app needs nothing from the network once loaded, and `file://` already works
   offline. A service worker would also keep serving old versions after a push.

**Decided against (don't re-propose without a new reason):**
- *Import a `.vcf` into the form* — step 1 covers the need; not worth the complexity.
- *Bleed / crop marks on the one-card PDF* — keeps the PDF exactly card-sized. Revisit
  only if a print shop asks for bleed, and then as an option.

## Fixing print issues

Nothing has been printed on paper yet (the maintainer had no printer); page and card
sizes were checked only in PDF viewers. When a print happens, check:

- **Full sheet** (Letter / A4, 10 cards): printed at "Actual size" (100%)? A card
  that's the wrong size is almost always the print dialog's "Fit to page", not the
  code. Do the cut marks line up, and is the column gap wide enough to cut by hand?
  Knobs in `app.js`: `SHEET_COLUMN_GAP` (17 pt ≈ 6 mm between columns; rows touch on
  purpose), `SHEET_BLEED` (5.67 pt = 2 mm of accent bar past the card edge),
  `SHEET_MIN_MARGIN` (28 pt ≈ 10 mm from the paper edge; home printers can't print to
  the edge), and the mark `offset` / `len` in `drawCutMarks()`.
- **QR scan**: compare the US card with 5 links (warned as dense, 0.39 mm modules)
  with the EU card holding the same details (not warned, 0.42 mm). If the warned one
  scans easily, lower `QR_MIN_MODULE_MM`; if the unwarned one struggles, raise it.
- **Text near the edges**: contact lines stop at the card's 14 pt (~5 mm) margin `M` in
  `layoutCard()`, because print shops only promise to cut within ~3 mm.

Any change to the card goes through `layoutCard()` only (see Design work). Before
committing, open `tests.html` (all green), and make sure cards that weren't meant to
change still produce the same PDF: build it from the last commit (`git archive HEAD`)
and from the working tree, then compare the bytes, ignoring the `/CreationDate` and
`/ID` lines.

## How to run locally

Just open `index.html` in a browser (double-click works). For a closer-to-production
check you can serve the folder over http, e.g. `python -m http.server`, then visit
the printed URL.
