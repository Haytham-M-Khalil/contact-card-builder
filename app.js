// =============================================================================
//  Contact Card Builder — app logic
//  ---------------------------------------------------------------------------
//  Browser-only. Plain JS, classic <script> (no modules, no build step).
//  Loaded AFTER the vendored libs in lib/ (qrcode-generator, jsPDF).
//
//  Roadmap (one small, testable piece per commit — see CLAUDE.md):
//    2. form UI            3. vCard data layer  ← (this step)
//    4. QR (.png)          5. PDF (vector QR)
//    6. file toggle/downloads                   7. polish
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // 0. Internationalization (English + Arabic). UI strings keyed by data-i18n
  //    attributes in the markup; `t()` reads the current language for strings
  //    built in JS (validation, preview fallback).
  // ---------------------------------------------------------------------------
  var I18N = {
    en: {
      appTitle: "Contact Card Builder",
      tagline: "Make a print-ready business card, QR code, and contact file — all in your browser.",
      formHeading: "Your details",
      legendIdentity: "Identity",
      labelName: "Full name",
      labelTitle: "Title / role",
      legendPhones: "Phone numbers",
      phName: "Robin Doe",
      phTitle: "Product Designer",
      phPhoneLabel: "Label (e.g. WhatsApp)",
      phPhone1: "+1 555 0188",
      phPhone2: "+1 555 0123",
      phEmail: "robin.doe@example.com",
      // Suggestions offered in the phone-label field (free text still allowed).
      phoneLabelPresets: ["WhatsApp", "Mobile", "Work", "Home", "Telegram", "Signal"],
      addPhone: "+ Add phone",
      legendContact: "Contact",
      labelEmail: "Email",
      legendLinks: "Links",
      addLink: "+ Add link",
      labelLinksInQr: "Save links in the QR code and contact file",
      hintLinksInQr: "Links always print on the card. Untick for a simpler QR that older phones scan more reliably.",
      legendAppearance: "Appearance",
      labelAccent: "Accent color",
      legendOutput: "Output",
      optPdfOnly: "PDF only",
      optAllFiles: "All files (PDF + QR + vCard)",
      labelCardSize: "Card size",
      sizeUs: "US business card — 3.5 × 2 in",
      sizeEu: "EU / ISO — 85 × 55 mm",
      btnGenerate: "Generate card",
      previewHeading: "Preview",
      scanCaption: "Scan to save my contact",
      previewNote: "Live preview, drawn from the same layout as the PDF — what you see is what prints. Click “Generate card” to download your files.",
      previewName: "Your Name",
      errName: "Please enter a name.",
      errEmail: "That email doesn't look right.",
    },
    ar: {
      appTitle: "منشئ بطاقة التواصل",
      tagline: "أنشئ بطاقة عمل جاهزة للطباعة ورمز QR وملف جهة اتصال — من متصفحك مباشرة.",
      formHeading: "بياناتك",
      legendIdentity: "الهوية",
      labelName: "الاسم الكامل",
      labelTitle: "المسمى الوظيفي",
      legendPhones: "أرقام الهاتف",
      phName: "فلان الفلاني",
      phTitle: "مصمم منتجات",
      phPhoneLabel: "التسمية (مثل واتساب)",
      phPhone1: "+970500000000",
      phPhone2: "+970511111111",
      phEmail: "flan@example.com",
      phoneLabelPresets: ["واتساب", "موبايل", "عمل", "منزل", "تيليجرام", "سيجنال"],
      addPhone: "+ إضافة هاتف",
      legendContact: "وسائل التواصل",
      labelEmail: "البريد الإلكتروني",
      legendLinks: "الروابط",
      addLink: "+ إضافة رابط",
      labelLinksInQr: "حفظ الروابط في رمز QR وملف جهة الاتصال",
      hintLinksInQr: "تُطبع الروابط على البطاقة دائمًا. ألغِ التحديد للحصول على رمز QR أبسط تقرؤه الهواتف القديمة بسهولة أكبر.",
      legendAppearance: "المظهر",
      labelAccent: "اللون المميز",
      legendOutput: "المخرجات",
      optPdfOnly: "ملف PDF فقط",
      optAllFiles: "كل الملفات (PDF + QR + vCard)",
      labelCardSize: "حجم البطاقة",
      sizeUs: "بطاقة أمريكية — 3.5 × 2 إنش",
      sizeEu: "أوروبية / ISO — 85 × 55 مم",
      btnGenerate: "إنشاء البطاقة",
      previewHeading: "معاينة",
      scanCaption: "امسح لحفظ جهة الاتصال",
      previewNote: "معاينة حية مرسومة بنفس تخطيط ملف PDF — ما تراه هو ما سيُطبع. اضغط «إنشاء البطاقة» لتنزيل ملفاتك.",
      previewName: "اسمك",
      errName: "يرجى إدخال الاسم.",
      errEmail: "يبدو أن البريد الإلكتروني غير صحيح.",
    },
  };

  var currentLang = "en";

  function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
  }

  // ---------------------------------------------------------------------------
  // 1. Read the form into a plain data object.
  //    This is the single source of truth the vCard / QR / PDF are built from.
  // ---------------------------------------------------------------------------
  function readForm() {
    var val = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    var displayName = val("name");

    // Split the full name into given + family for the vCard N field.
    // Convention (matches the original script): the LAST word is the family
    // name, everything before it is the given name(s).
    var parts = displayName.split(/\s+/).filter(Boolean);
    var familyName = parts.length > 1 ? parts[parts.length - 1] : "";
    var givenName = parts.length > 1 ? parts.slice(0, -1).join(" ") : displayName;

    // Phones: read every row, keep only those with an actual number.
    var phones = [];
    document.querySelectorAll("#phone-list .repeat-row").forEach(function (row) {
      var label = row.querySelector(".phone-label");
      var number = row.querySelector(".phone-number");
      label = label ? label.value.trim() : "";
      number = number ? number.value.trim() : "";
      if (number) phones.push({ label: label, number: number });
    });

    // Links: read every row, keep only the non-empty ones.
    var links = [];
    document.querySelectorAll("#link-list .link-url").forEach(function (input) {
      var url = input.value.trim();
      if (url) links.push(url);
    });

    var outputEl = document.querySelector('input[name="output"]:checked');
    var linksInQrEl = document.getElementById("links-in-qr");

    return {
      displayName: displayName,
      givenName: givenName,
      familyName: familyName,
      title: val("title"),
      phones: phones,
      email: val("email"),
      links: links,
      // Links always print on the card; this decides if they also go in the
      // vCard (and so the QR). Fewer URLs = a simpler QR for older scanners.
      linksInVCard: linksInQrEl ? linksInQrEl.checked : true,
      accent: val("accent") || "#732da0",
      output: outputEl ? outputEl.value : "all",
      size: val("card-size") || "us",
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Build the vCard string (vCard 3.0, the source of truth).
  //    Ported from the Python script: plain TEL lines for max import
  //    compatibility across phones and apps. Lines are joined with CRLF.
  // ---------------------------------------------------------------------------

  // Escape a value for a vCard text field per RFC 6350 / 2426:
  // backslash, comma, semicolon, and newlines must be escaped.
  function escapeVCard(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  // Ensure a link has a scheme so it opens as a real URL when saved.
  function normalizeUrl(url) {
    return /^https?:\/\//i.test(url) ? url : "https://" + url;
  }

  function buildVCard(data) {
    var lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      // N: Family;Given;Additional;Prefix;Suffix
      "N:" + escapeVCard(data.familyName) + ";" + escapeVCard(data.givenName) + ";;;",
      "FN:" + escapeVCard(data.displayName),
    ];

    if (data.title) lines.push("TITLE:" + escapeVCard(data.title));

    data.phones.forEach(function (phone) {
      lines.push("TEL;type=CELL:" + escapeVCard(phone.number));
    });

    if (data.email) lines.push("EMAIL;type=INTERNET:" + escapeVCard(data.email));

    if (data.linksInVCard !== false) {
      data.links.forEach(function (link) {
        lines.push("URL:" + escapeVCard(normalizeUrl(link)));
      });
    }

    lines.push("END:VCARD");
    lines.push(""); // trailing CRLF so the file ends with a newline
    return lines.join("\r\n");
  }

  // ---------------------------------------------------------------------------
  // 3. QR code. Build a QR model from the vCard text (the same text the .vcf
  //    holds, so scanning saves the contact), then draw it onto a canvas.
  //    Uses the vendored qrcode-generator library (global `qrcode`).
  // ---------------------------------------------------------------------------

  // typeNumber 0 = auto-pick the smallest size that fits. 'M' error correction
  // matches the original Python script (ERROR_CORRECT_M).
  function buildQrModel(text) {
    if (typeof qrcode === "undefined") {
      throw new Error("qrcode-generator library not loaded (lib/qrcode.js).");
    }
    // Encode bytes as UTF-8 so non-Latin text (e.g. Arabic) scans correctly.
    // The library defaults to a Latin-1 encoder that mangles multi-byte chars.
    if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) {
      qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    }
    var qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr;
  }

  // Draw the QR onto a fresh <canvas>. `scale` is px per module; `margin` is the
  // quiet zone in modules (4 is the spec-recommended minimum for reliable scans).
  function drawQrToCanvas(qr, opts) {
    opts = opts || {};
    var scale = opts.scale || 10;
    var margin = opts.margin != null ? opts.margin : 4;
    var dark = opts.dark || "#1c2230";
    var light = opts.light || "#ffffff";

    var count = qr.getModuleCount();
    var size = (count + margin * 2) * scale;

    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = dark;
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  // ---------------------------------------------------------------------------
  // 4. PDF business card. A browser port of the original Python canvas layout,
  //    drawn with jsPDF (global `window.jspdf`). The QR is drawn as vector
  //    squares (not a pasted image) so it stays crisp at any print size.
  // ---------------------------------------------------------------------------

  // Card dimensions in points (72 pt = 1 inch; 1 mm = 2.83465 pt).
  var CARD_SIZES = {
    us: { w: 252, h: 144 },         // 3.5 x 2 in
    eu: { w: 240.945, h: 155.906 }, // 85 x 55 mm
  };

  function containsArabic(text) {
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0x0750 && c <= 0x077F) ||
          (c >= 0xFB50 && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF)) {
        return true;
      }
    }
    return false;
  }

  function hexToRgb(hex) {
    hex = String(hex || "").replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map(function (ch) { return ch + ch; }).join("");
    }
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // Card colors (the accent comes from the form).
  var CARD_INK = "#1c2230";
  var CARD_GREY = "#73787f";

  // Which font a piece of card text is drawn in. Arabic runs use the embedded
  // Amiri (it has no bold); everything else uses Helvetica. The preview maps
  // "helvetica" to the vendored Arimo, which has identical character widths.
  function cardFont(text, bold) {
    if (containsArabic(text)) return { family: "Amiri", style: "normal" };
    return { family: "helvetica", style: bold ? "bold" : "normal" };
  }

  // Width of `text` in points, measured with jsPDF's own font metrics so the
  // PDF and the preview make exactly the same fitting decisions.
  var measureDoc = null;
  function textWidthPt(text, font, sizePt) {
    if (!measureDoc) measureDoc = new window.jspdf.jsPDF({ unit: "pt" });
    measureDoc.setFont(font.family, font.style);
    return measureDoc.getStringUnitWidth(text) * sizePt;
  }

  // Lay the card out once, in PDF points, as a list of drawing operations.
  // Both outputs draw from this same list: buildPdf() with jsPDF and
  // renderPreview() as an SVG, so the preview matches the PDF by construction.
  // A port of the original Python canvas layout. `qr` may be null (preview
  // fallback), in which case the QR box is still reserved at its real size.
  function layoutCard(data, lang, qr) {
    var size = CARD_SIZES[data.size] || CARD_SIZES.us;
    var W = size.w, H = size.h;
    var acc = data.accent || "#732da0";
    var ops = [];

    // In Arabic the whole card is mirrored: accent bar on the right, QR on the
    // left, text right-aligned.
    var rtl = lang === "ar";
    var M = 14, edge = 18;
    var anchorX = rtl ? W - edge : edge;   // where text starts (the "start" side)
    var align = rtl ? "right" : "left";

    function text(str, x, y, sizePt, bold, color, alignTo) {
      var font = cardFont(str, bold);
      ops.push({ type: "text", text: str, x: x, y: y, size: sizePt,
                 font: font, color: color, align: alignTo || align });
      return font;
    }

    // --- QR: vector squares, vertically centered, on the far side ---
    var qrSize = H * 0.62;
    var qx = rtl ? M : W - M - qrSize;
    var qy = (H - qrSize) / 2 - 4;
    // quiet: white quiet-zone modules inside the QR box, for scannability.
    ops.push({ type: "qr", x: qx, y: qy, size: qrSize, quiet: 2, qr: qr, color: CARD_INK });
    text(t("scanCaption"), qx + qrSize / 2, qy + qrSize + 9, 5.4, false, CARD_GREY, "center");

    // --- Accent bar (right under RTL, left otherwise) ---
    ops.push({ type: "rect", x: rtl ? W - 4 : 0, y: 0, w: 4, h: H, color: acc });

    // Width available to the text column (between the start edge and the QR).
    var textWidth = rtl
      ? anchorX - (qx + qrSize + 10)
      : (qx - 10) - edge;

    // --- Name (auto-shrink to fit the text column) ---
    var nameFont = cardFont(data.displayName, true);
    var nameSize = 13;
    while (nameSize > 9 && textWidthPt(data.displayName, nameFont, nameSize) > textWidth) {
      nameSize -= 0.5;
    }
    var y = M + nameSize;
    text(data.displayName, anchorX, y, nameSize, true, CARD_INK);

    // --- Title ---
    if (data.title) {
      y += 13;
      text(data.title, anchorX, y, 7.6, false, acc);
    }

    // --- Divider ---
    y += 7;
    var dividerLen = Math.min(96, textWidth);
    ops.push({ type: "line", x1: anchorX, y1: y, x2: rtl ? anchorX - dividerLen : anchorX + dividerLen,
               y2: y, width: 0.8, color: acc });

    // --- Contact lines: phones (label + number), email, links ---
    y += 13;
    var step = 11.5;
    data.phones.forEach(function (phone) {
      if (phone.label) {
        var labelFont = text(phone.label, anchorX, y, 6.6, true, acc);
        var offset = textWidthPt(phone.label, labelFont, 6.6) + textWidthPt("  ", labelFont, 6.6);
        text(phone.number, rtl ? anchorX - offset : anchorX + offset, y, 7.0, false, CARD_INK);
      } else {
        text(phone.number, anchorX, y, 7.0, false, CARD_INK);
      }
      y += step;
    });

    if (data.email) { text(data.email, anchorX, y, 7.0, false, CARD_INK); y += step; }
    data.links.forEach(function (link) {
      text(link, anchorX, y, 7.0, false, CARD_INK);
      y += step;
    });

    return { w: W, h: H, ops: ops };
  }

  function buildPdf(data, qr) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF library not loaded (lib/jspdf.umd.min.js).");
    }
    var layout = layoutCard(data, currentLang, qr);
    var doc = new window.jspdf.jsPDF({
      unit: "pt",
      format: [layout.w, layout.h],
      orientation: layout.w >= layout.h ? "landscape" : "portrait",
    });

    layout.ops.forEach(function (op) {
      var c = hexToRgb(op.color);
      if (op.type === "rect") {
        doc.setFillColor(c.r, c.g, c.b);
        doc.rect(op.x, op.y, op.w, op.h, "F");
      } else if (op.type === "line") {
        doc.setDrawColor(c.r, c.g, c.b);
        doc.setLineWidth(op.width);
        doc.line(op.x1, op.y1, op.x2, op.y2);
      } else if (op.type === "text") {
        // jsPDF shapes and right-to-left orders Arabic itself — just pick the
        // font and hand it the raw text.
        doc.setFont(op.font.family, op.font.style);
        doc.setFontSize(op.size);
        doc.setTextColor(c.r, c.g, c.b);
        doc.text(op.text, op.x, op.y, { align: op.align });
      } else if (op.type === "qr") {
        // Drawn as vector squares (not a pasted image) so it stays crisp in print.
        var count = op.qr.getModuleCount();
        var cell = op.size / (count + op.quiet * 2);
        doc.setFillColor(c.r, c.g, c.b);
        for (var r = 0; r < count; r++) {
          for (var col = 0; col < count; col++) {
            if (op.qr.isDark(r, col)) {
              doc.rect(op.x + (col + op.quiet) * cell, op.y + (r + op.quiet) * cell, cell, cell, "F");
            }
          }
        }
      }
    });

    return doc;
  }

  // Draw the same layout into the preview <svg>. Its viewBox is the card in
  // points, so the browser scales every coordinate uniformly — 1 pt in the PDF
  // is the same fraction of the card here.
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SVG_FONTS = {
    helvetica: '"Arimo", Helvetica, Arial, sans-serif',
    Amiri: '"Amiri", "Arimo", serif',
  };
  var SVG_ANCHOR = { left: "start", right: "end", center: "middle" };

  // jsPDF picks its own Arabic letter forms (initial / medial / final, lam-alef)
  // when it writes the PDF. Showing the preview those same pre-shaped characters
  // makes its Arabic look exactly like the printed card.
  function pdfArabicForms(text) {
    var api = window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API;
    return api && api.processArabic ? api.processArabic(text) : text;
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function renderPreview(svg, layout) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + layout.w + " " + layout.h);
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: layout.w, height: layout.h, fill: "#fff" }));

    layout.ops.forEach(function (op) {
      if (op.type === "rect") {
        svg.appendChild(svgEl("rect", { x: op.x, y: op.y, width: op.w, height: op.h, fill: op.color }));
      } else if (op.type === "line") {
        svg.appendChild(svgEl("line", { x1: op.x1, y1: op.y1, x2: op.x2, y2: op.y2,
                                        stroke: op.color, "stroke-width": op.width }));
      } else if (op.type === "text") {
        var el = svgEl("text", {
          x: op.x, y: op.y, fill: op.color,
          "font-size": op.size,
          "font-family": SVG_FONTS[op.font.family],
          "font-weight": op.font.style === "bold" ? 700 : 400,
          "text-anchor": SVG_ANCHOR[op.align],
        });
        el.style.whiteSpace = "pre";      // keep spaces exactly as the PDF draws them
        el.style.fontKerning = "none";    // jsPDF never kerns (e.g. "11" in Arimo)
        el.textContent = op.font.family === "Amiri" ? pdfArabicForms(op.text) : op.text;
        svg.appendChild(el);
      } else if (op.type === "qr") {
        if (!op.qr) {
          // No QR (e.g. too much data to encode): show the reserved box.
          svg.appendChild(svgEl("rect", { x: op.x, y: op.y, width: op.size, height: op.size,
                                          fill: "#eef0f3" }));
          return;
        }
        // One path in module units, scaled into place: no seams between modules.
        var count = op.qr.getModuleCount();
        var cell = op.size / (count + op.quiet * 2);
        var d = "";
        for (var r = 0; r < count; r++) {
          for (var col = 0; col < count; col++) {
            if (op.qr.isDark(r, col)) d += "M" + col + " " + r + "h1v1h-1z";
          }
        }
        var x0 = op.x + op.quiet * cell, y0 = op.y + op.quiet * cell;
        svg.appendChild(svgEl("path", { d: d, fill: op.color,
          transform: "translate(" + x0 + " " + y0 + ") scale(" + cell + ")" }));
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Helpers: a safe file name from the contact's name, and a generic
  //    "download this text/blob as a file" routine reused by every output.
  // ---------------------------------------------------------------------------
  function safeBaseName(displayName) {
    var base = displayName
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9_.\-]/g, "");
    return base || "contact";
  }

  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on the next tick so the download has a chance to start.
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function downloadText(filename, text, mimeType) {
    downloadBlob(filename, new Blob([text], { type: mimeType }));
  }

  // ---------------------------------------------------------------------------
  // 6. Dynamic rows: the "+ Add" buttons append a new phone/link row, and each
  //    row's "×" removes it (keeping at least one row, cleared, so there's
  //    always somewhere to type).
  // ---------------------------------------------------------------------------
  function wireRepeatList(listId, addBtnId) {
    var list = document.getElementById(listId);
    var addBtn = document.getElementById(addBtnId);
    if (!list || !addBtn) return;

    addBtn.addEventListener("click", function () {
      var rows = list.querySelectorAll(".repeat-row");
      var clone = rows[rows.length - 1].cloneNode(true);
      clone.querySelectorAll("input").forEach(function (input) { input.value = ""; });
      list.appendChild(clone);
      var firstInput = clone.querySelector("input");
      if (firstInput) firstInput.focus();
      syncPreview();
    });

    list.addEventListener("click", function (event) {
      var btn = event.target.closest(".row-remove");
      if (!btn) return;
      var row = btn.closest(".repeat-row");
      if (list.querySelectorAll(".repeat-row").length > 1) {
        row.remove();
      } else {
        row.querySelectorAll("input").forEach(function (input) { input.value = ""; });
      }
      syncPreview();
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Live preview. Mirror the form into the preview card as the user types:
  //    name, title, contact lines, accent color, and the card's aspect ratio.
  // ---------------------------------------------------------------------------
  // A clearly-fictional sample shown before the form is touched — one per
  // language so the empty-state card reads as an example in the UI's language.
  // ("فلان الفلاني" is the Arabic "John Doe"; example.com is a reserved test
  // domain; the numbers/handles are obvious placeholders.)
  var SAMPLE = {
    en: {
      displayName: "Robin Doe",
      title: "Product Designer",
      phones: [
        { label: "WhatsApp", number: "+1 555 0188" },
        { label: "Mobile", number: "+1 555 0123" },
      ],
      email: "robin.doe@example.com",
      links: ["linkedin.com/in/your-profile", "github.com/your-username"],
    },
    ar: {
      displayName: "فلان الفلاني",
      title: "مصمم منتجات",
      phones: [
        { label: "واتساب", number: "+970500000000" },
        { label: "موبايل", number: "+970511111111" },
      ],
      email: "flan@example.com",
      links: ["linkedin.com/in/your-profile", "github.com/your-username"],
    },
  };

  // Mirror the form into the preview card as the user types. The preview is
  // drawn from the same layout as the PDF (layoutCard), including a live QR,
  // so what you see is what prints.
  function syncPreview() {
    var card = document.getElementById("card-preview");
    var svg = card && card.querySelector("svg");
    if (!svg) return;
    var data = readForm();

    // Until any field is filled in, show the localized fictional sample.
    var isEmpty = !data.displayName && !data.title && !data.email &&
                  data.phones.length === 0 && data.links.length === 0;
    var view = isEmpty ? SAMPLE[currentLang] : data;
    var name = view.displayName || t("previewName");
    var shown = {
      displayName: name,
      givenName: view.givenName || name,
      familyName: view.familyName || "",
      title: view.title,
      phones: view.phones,
      email: view.email,
      links: view.links,
      linksInVCard: data.linksInVCard,
      accent: data.accent,
      size: data.size,
    };

    // The QR encodes the shown contact, so its density matches the real card.
    // Too much data for a QR code throws; the box is then shown empty.
    var qr = null;
    try { qr = buildQrModel(buildVCard(shown)); } catch (e) { qr = null; }

    renderPreview(svg, layoutCard(shown, currentLang, qr));
  }

  // ---------------------------------------------------------------------------
  // 8. Validation. Show a friendly inline message under a field instead of a
  //    blunt alert: a name is required, and the email (if given) must look valid.
  // ---------------------------------------------------------------------------
  function setFieldError(inputId, message) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var field = input.closest(".field") || input.parentNode;
    var err = field.querySelector(".field-error");
    if (message) {
      if (!err) {
        err = document.createElement("span");
        err.className = "field-error";
        field.appendChild(err);
      }
      err.textContent = message;
      input.setAttribute("aria-invalid", "true");
      input.classList.add("is-invalid");
    } else if (err) {
      err.remove();
      input.removeAttribute("aria-invalid");
      input.classList.remove("is-invalid");
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Returns the id of the first invalid field, or null if everything is valid.
  function firstInvalidField(data) {
    if (!data.displayName) {
      setFieldError("name", t("errName"));
      return "name";
    }
    setFieldError("name", "");

    if (data.email && !isValidEmail(data.email)) {
      setFieldError("email", t("errEmail"));
      return "email";
    }
    setFieldError("email", "");

    return null;
  }

  // ---------------------------------------------------------------------------
  // 9. Wire up the form. "Generate card" always produces the PDF and refreshes
  //    the preview; the PDF-only/all-files toggle decides whether the QR .png
  //    and .vcf are downloaded too.
  // ---------------------------------------------------------------------------
  function handleSubmit(event) {
    event.preventDefault();

    var data = readForm();
    var invalid = firstInvalidField(data);
    if (invalid) {
      var el = document.getElementById(invalid);
      if (el) el.focus();
      return;
    }

    var vcard = buildVCard(data);
    var base = safeBaseName(data.displayName);
    var qr = buildQrModel(vcard);

    var canvas = drawQrToCanvas(qr);

    // The PDF business card is always produced (QR drawn as vector squares).
    buildPdf(data, qr).save(base + "_card.pdf");

    // "All files" additionally downloads the QR .png and the .vcf.
    if (data.output === "all") {
      canvas.toBlob(function (blob) {
        downloadBlob(base + "_QR.png", blob);
      }, "image/png");
      downloadText(base + ".vcf", vcard, "text/vcard;charset=utf-8");
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Language: swap every UI string, flip the document direction, and
  //     remember the choice. The card layout mirrors automatically under
  //     dir="rtl" (flex + logical properties).
  // ---------------------------------------------------------------------------
  function applyLanguage(lang) {
    currentLang = lang === "ar" ? "ar" : "en";
    var dict = I18N[currentLang];
    var html = document.documentElement;
    html.lang = currentLang;
    html.dir = currentLang === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("ccb-lang", currentLang); } catch (e) {}

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    var presets = document.getElementById("phone-labels");
    if (presets) {
      presets.innerHTML = "";
      dict.phoneLabelPresets.forEach(function (label) {
        var option = document.createElement("option");
        option.value = label;
        presets.appendChild(option);
      });
    }
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-ph");
      if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });

    var toggle = document.getElementById("lang-toggle");
    if (toggle) toggle.textContent = currentLang === "en" ? "العربية" : "English";

    // Refresh the preview so the empty-state sample matches the new language.
    syncPreview();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("card-form");
    if (form) {
      form.addEventListener("submit", handleSubmit);
      form.addEventListener("input", syncPreview);
      form.addEventListener("change", syncPreview);
      // Clear a field's error as soon as the user edits it.
      form.addEventListener("input", function (event) {
        if (event.target.id === "name" || event.target.id === "email") {
          setFieldError(event.target.id, "");
        }
      });
    }
    wireRepeatList("phone-list", "add-phone");
    wireRepeatList("link-list", "add-link");

    var saved = null;
    try { saved = localStorage.getItem("ccb-lang"); } catch (e) {}
    applyLanguage(saved || "en");
    var toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        applyLanguage(currentLang === "en" ? "ar" : "en");
      });
    }

    console.log("Contact Card Builder: vCard + QR + PDF ready.");
  });

  // Expose for testing and future steps.
  window.ContactCard = {
    readForm: readForm,
    buildVCard: buildVCard,
    buildQrModel: buildQrModel,
    drawQrToCanvas: drawQrToCanvas,
    layoutCard: layoutCard,
    buildPdf: buildPdf,
    safeBaseName: safeBaseName,
    downloadText: downloadText,
    downloadBlob: downloadBlob,
    applyLanguage: applyLanguage,
  };
})();
