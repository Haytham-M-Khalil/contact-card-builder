# `lib/` — vendored third-party libraries

These files are **committed to the repo on purpose** so the app is fully
self-contained: GitHub Pages serves them from this same site, so there's no CDN
dependency and the app works offline. There is **no `npm install`** and no build
step — the browser loads these `.js` files directly via `<script>` tags.

> Empty for now. Each library is downloaded into this folder in the feature step
> that first needs it (see the roadmap in `CLAUDE.md`), then committed.

## Libraries used

| File (planned)        | Library            | Used for                                  | Added in step |
|-----------------------|--------------------|-------------------------------------------|---------------|
| `qrcode.js`           | qrcode-generator   | Building the QR matrix from the vCard text | 4 (QR)        |
| `jspdf.umd.min.js`    | jsPDF              | Generating the PDF; QR drawn as vector squares | 5 (PDF)  |

## Rules for this folder
- **Pin a specific version** when vendoring; record the version and source URL here.
- Don't edit the library files by hand — re-download to upgrade and note the new version.
- Prefer the unminified build where it's small enough to keep things readable while learning.
