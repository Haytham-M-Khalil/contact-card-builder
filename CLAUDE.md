# CLAUDE.md

Guidance for working in this repo. Read this first.

## What this is

**Contact Card Builder** — a browser-only web app that turns a simple form
(name, title, one or more labelled phones, email, links) into:

- a **print-ready PDF business card**,
- optionally a **QR code `.png`**, and
- optionally a **`.vcf` contact file**,

with a toggle for **"PDF only" vs "all files"** and a **card-size dropdown**
(US 3.5×2 in and EU/ISO 85×55 mm).

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
  *app around the card* freely, but never position card content with CSS.
- **No CDN fonts or assets.** A new typeface must be vendored into `lib/` as `.woff2`
  (with its license, version and source recorded in `lib/README.md`). Prefer the system
  stack or a single vendored family.
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
lib/           # vendored third-party libs (qrcode-generator, jsPDF, Amiri + Arimo fonts) + README
.claude/skills/ # project skills for Claude Code (frontend-design)
README.md      # user-facing intro, usage, local run, deploy
LICENSE        # MIT
```

## Build roadmap (one commit per step)

> **Status: all steps below are shipped.** The app is feature-complete and live on
> GitHub Pages. This roadmap is kept as a record of how it was built.

1. **Scaffold** repo + docs + license + git. ✅
2. **Form UI + base CSS** — inputs for name, title, phones (label + number), email,
   links; the "PDF only / all files" toggle; the card-size dropdown. No logic yet.
3. **vCard data layer** — read the form → build the vCard string (port of the Python
   `BEGIN:VCARD` logic) + a file-download helper. Test by inspecting the `.vcf`.
4. **QR** — vendor `qrcode-generator`, build the matrix from the vCard, render a
   `.png` download. Test by scanning.
5. **PDF** — vendor `jsPDF`, draw the card (accent bar, name, title, phones, email,
   links) and the QR **as vector squares** (port of the Python `canvas` layout).
   Honor the card-size dropdown.
6. **File toggle + downloads** — wire "PDF only" vs "all files" (PDF + PNG + VCF).
7. **Polish** — add/remove phone & link rows dynamically, basic validation, editable
   accent color, responsive layout.
8. **Finalize README + deploy** to GitHub Pages.

## How to run locally

Just open `index.html` in a browser (double-click works). For a closer-to-production
check you can serve the folder over http, e.g. `python -m http.server`, then visit
the printed URL.
