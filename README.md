# Contact Card Builder

Generate a **print-ready PDF business card**, a **QR code**, and a **`.vcf` contact
file** — entirely in your browser. No backend, no signup, no install. Fill in a short
form, pick a card size, and download.

> 🚧 **Early days.** The repo is scaffolded and features are being built one small,
> testable piece at a time. See the roadmap in [`CLAUDE.md`](CLAUDE.md).

## What it will do

- Form input: name, title, one or more **labelled phone numbers**, email, and links.
- **PDF business card** in standard sizes (US 3.5×2 in and EU/ISO 85×55 mm).
- **QR code** that encodes a vCard, so anyone can scan to save your contact.
- **`.vcf` file** to import the contact directly.
- A toggle for **"PDF only"** vs **"all files"** (PDF + QR `.png` + `.vcf`).

## How it works

- 100% client-side: plain HTML, CSS, and JavaScript — **no build step, no backend.**
- The QR is drawn into the PDF as **vector squares** (crisp at any print size), using
  [jsPDF](https://github.com/parallax/jsPDF) and
  [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), both
  **vendored locally** in [`lib/`](lib/) so the app is self-contained and works offline.

## Run it locally

Clone or download the repo, then **open `index.html` in your browser** — that's it.

For a closer-to-production check, serve the folder over http:

```sh
python -m http.server
```

…then open the URL it prints.

## Deploy (GitHub Pages)

Because it's just static files, you can host it free on GitHub Pages: push to GitHub,
then enable Pages for the repo (deploy from the `main` branch). Detailed steps land in
the final roadmap step.

## License

[MIT](LICENSE) © 2026 Haytham M. R. Khalil
