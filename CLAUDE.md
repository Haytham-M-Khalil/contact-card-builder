# CLAUDE.md

Guidance for working in this repo. Read this first.

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
lib/           # vendored third-party libs (qrcode-generator, jsPDF, Amiri + Arimo + Readex Pro fonts) + README
.claude/skills/ # project skills for Claude Code (frontend-design)
README.md      # user-facing intro, usage, local run, deploy
LICENSE        # MIT
```

## Roadmap (one commit per step)

The original build (v1: scaffold → form → vCard → QR → PDF → downloads → polish →
GitHub Pages) is shipped; see git history. This is the next round of work, agreed
with the maintainer on 2026-11-16. **Work top to bottom, mark steps ✅ as they ship,
and check in with the maintainer after step 3 before starting the bigger features.**

1. ✅ **Remember the form between visits** — save the form (name, title, phones, email,
   links, accent, card size, layout, output) to `localStorage` and restore it on load.
   Same try/catch pattern as the saved language; the app must still work without it.
   Agreed details: add a **"Clear form"** button that asks for confirmation first,
   and the saved form **survives a language switch** (switching language never
   clears what was typed).
2. ✅ **Company field** — one optional "Company" input. Shown on the card (via
   `layoutCard()`) and written to the vCard as `ORG`, so it lands in the QR too.
   Both languages in the i18n table.
3. ✅ **QR density warning** — warn (don't block) when the vCard makes the QR too dense
   to scan reliably at the chosen card size; suggest fewer links or unticking
   "links in QR". Threshold: a printed QR module under 0.4 mm (`QR_MIN_MODULE_MM`),
   not yet checked with a real scan of a printed card — tune it if the maintainer's
   phone disagrees. *On-screen check (2026-11-16, PDF in Brave):* the warned US card
   with 5 links (0.39 mm modules) only scanned from 250% zoom; the unwarned EU one
   (0.42 mm) scanned from 110%. So the threshold sits about right; a screen is only a
   rough stand-in for print, so keep it until a printed card says otherwise.
   - ✅ *Follow-up from the step-3 check-in (2026-11-16):* `layoutCard()` now tightens
     the contact-line spacing on crowded cards and returns `fits: false` when text
     still runs off the card or into the QR; the same warning bar says so. Cards that
     already fit print exactly as before. Download no longer fails silently when the
     data is too big for any QR. **Step-3 check-in done; step 4 is next** (agreed).
4. ✅ **Test page** — `tests.html`, opened in the browser, runs `tests.js` (a tiny
   runner + tests): `buildVCard` / `escapeVCard` / `normalizeUrl` / `containsArabic`,
   plus `layoutCard` fit, `qrScanCheck` and file names. No toolchain. **Open it and
   check it's all green before committing a change to `app.js`**; add tests for new
   logic (steps 5–6) there.
5. **Back side, one-card PDF only, off by default** — an option that adds a second
   PDF page per card (back: large QR, or the card in the other language). Preview
   gets a Front/Back switch; the back is laid out by `layoutCard()` too. With the
   option off, today's PDF must be unchanged. The full sheet stays front-only (duplex
   alignment can't be verified without a printer).
6. **Logo on the back side** — upload an image, centered on the back. Never on the
   front (crowds the layout) and never in the vCard (bloats the QR). Depends on 5.
7. *Later* — more UI languages via the i18n table, plus a short `CONTRIBUTING.md`.
8. *Later* — work offline on GitHub Pages (manifest + service worker; `file://`
   keeps working as today).

**Decided against (don't re-propose without a new reason):**
- *Import a `.vcf` into the form* — step 1 covers the need; not worth the complexity.
- *Bleed / crop marks on the one-card PDF* — keeps the PDF exactly card-sized. Revisit
  only if a print shop asks for bleed, and then as an option.

**Not blocking:** a physical test print of the full sheet. The page size is verified in
two PDF viewers; the maintainer has no printer and will print when they can.

## How to run locally

Just open `index.html` in a browser (double-click works). For a closer-to-production
check you can serve the folder over http, e.g. `python -m http.server`, then visit
the printed URL.
