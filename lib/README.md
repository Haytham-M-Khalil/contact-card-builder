# `lib/` — vendored third-party libraries

These files are **committed to the repo on purpose** so the app is fully
self-contained: GitHub Pages serves them from this same site, so there's no CDN
dependency and the app works offline. There is **no `npm install`** and no build
step — the browser loads these `.js` files directly via `<script>` tags.

> Libraries are downloaded into this folder in the feature step that first needs
> them (see the roadmap in `CLAUDE.md`), then committed.

## Libraries used

| File                  | Library / version       | Used for                                       | Source |
|-----------------------|-------------------------|------------------------------------------------|--------|
| `qrcode.js`           | qrcode-generator 1.4.4  | Building the QR matrix from the vCard text      | https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js |
| `jspdf.umd.min.js`    | jsPDF 2.5.2             | Generating the PDF; QR drawn as vector squares  | https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js |
| `amiri-font.js`       | Amiri Regular (SIL OFL 1.1), subset | Embedded Arabic font so the PDF can render Arabic | https://github.com/google/fonts/tree/main/ofl/amiri |
| `amiri-regular.woff2` | Amiri Regular (SIL OFL 1.1), Arabic subset | Web font so the live **preview** renders Arabic in the same face as the PDF | https://cdn.jsdelivr.net/fontsource/fonts/amiri@latest/arabic-400-normal.woff2 |
| `readex-pro-latin-wght.woff2`, `readex-pro-arabic-wght.woff2` | Readex Pro (SIL OFL 1.1, see `readex-pro-OFL.txt`) via @fontsource-variable/readex-pro 5.3.0, variable weight 160–700, Latin + Arabic subsets | The app's own **UI font** (not the card), with matching Latin and Arabic designs | https://cdn.jsdelivr.net/npm/@fontsource-variable/readex-pro@5.3.0/files/readex-pro-latin-wght-normal.woff2 (and `-arabic-`) |
| `arimo-regular.woff2`, `arimo-bold.woff2` | Arimo (Apache-2.0) via @fontsource/arimo 5.2.8, Latin subset | Preview stand-in for the PDF's Helvetica — identical character widths, so preview lines are exactly as long as printed ones | https://cdn.jsdelivr.net/npm/@fontsource/arimo@5.2.8/files/arimo-latin-400-normal.woff2 (and `-700-`) |

`amiri-font.js` is a jsPDF font module: `Amiri-Regular.ttf` was subset (Latin + Arabic
+ presentation forms) with `fonttools`, base64-encoded, and wrapped so it registers
itself as the `Amiri` font on every jsPDF document. To regenerate: subset the TTF, then
base64-encode it into the same wrapper.

`amiri-regular.woff2` is the browser-side counterpart, loaded via `@font-face` in
`style.css` so the preview card matches the PDF. The preview feeds it the same
pre-shaped letter forms jsPDF prints (`jsPDF.API.processArabic`), so its Arabic looks
exactly like the PDF's. A `unicode-range` limits it to Arabic script.

`arimo-*.woff2` are only used on the preview card. The PDF uses jsPDF's built-in
Helvetica; Arimo has the same character widths, so name fitting, label offsets and
line lengths in the preview match the PDF exactly.

`readex-pro-*.woff2` style the app around the card — labels, inputs, buttons — in both
languages. They are never used on the card itself, so they can't affect the PDF match.
The OFL text ships alongside as `readex-pro-OFL.txt`, as the license requires.

**Arabic shaping is handled by jsPDF itself** (it shapes contextual forms and applies
right-to-left ordering inside `doc.text`), so we just pass raw Arabic — no separate
shaper library is needed.

## Rules for this folder
- **Pin a specific version** when vendoring; record the version and source URL here.
- Don't edit the library files by hand — re-download to upgrade and note the new version.
- Prefer the unminified build where it's small enough to keep things readable while learning.
