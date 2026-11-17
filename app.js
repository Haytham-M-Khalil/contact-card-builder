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
      labelCompany: "Company",
      legendPhones: "Phone numbers",
      phName: "Robin Doe",
      phTitle: "Product Designer",
      phCompany: "Maple & Moss Studio",
      phPhoneLabel: "Label",
      phPhone1: "+1 555 0188",
      phPhone2: "+1 555 0123",
      phEmail: "robin.doe@example.com",
      // Suggestions offered in the phone-label field (free text still allowed).
      phoneLabelPresets: ["WhatsApp", "Mobile", "Work", "Home", "Telegram", "Signal"],
      // A custom phone label, on the bilingual back (translatePhoneLabel).
      phoneFallback: "Phone",
      addPhone: "+ Add phone",
      legendContact: "Email and links",
      labelEmail: "Email",
      labelLinks: "Links",
      addLink: "+ Add link",
      labelLinksInQr: "Save links in the QR code and contact file",
      hintLinksInQr: "Links always print on the card. Untick for a simpler QR that older phones scan more reliably.",
      labelAccent: "Accent color",
      colorPurple: "Purple",
      colorNavy: "Navy",
      colorBlue: "Blue",
      colorTeal: "Teal",
      colorGreen: "Green",
      colorCrimson: "Crimson",
      colorAmber: "Amber",
      colorGraphite: "Graphite",
      colorCustom: "Custom color",
      legendOutput: "Print and download",
      labelFiles: "Files",
      optPdfOnly: "PDF only",
      optAllFiles: "PDF + QR + vCard",
      labelCardSize: "Card size",
      sizeUs: "US business card — 3.5 × 2 in",
      sizeEu: "EU / ISO — 85 × 55 mm",
      labelPdfLayout: "PDF layout",
      layoutSingle: "One card per page",
      layoutSheet: "Full sheet of cards",
      hintSingle: "Exact card size, ready to send to a print shop.",
      // {count} and {paper} are filled in by updateLayoutHint().
      hintSheet: "{count} cards on one {paper} page, with cut marks. Print at Actual size (100%), then cut along the marks.",
      // The back of the card (one card per page only).
      labelCardBack: "Back of the card",
      backNone: "Blank (front only)",
      backQr: "Large QR code",
      backOther: "Card in Arabic",
      // The back's own text, shown with "Card in Arabic".
      labelOtherName: "Name in Arabic",
      labelOtherTitle: "Title / role in Arabic",
      labelOtherCompany: "Company in Arabic",
      hintOtherFields: "Leave a field empty to print the front's text. Phone labels are translated, and custom ones print as \u201cهاتف\u201d (Phone).",
      backOverflow: "On the back, some details are too close to the card's edge or the QR code to print safely. Shorten the name, title or company there, or remove a line.",
      hintBackPage: "Adds a second page to the PDF for the back. Ask the print shop to print both sides.",
      hintBackSheet: "The full sheet prints the front only. Choose one card per page to print the back.",
      // The Front / Back switch under the preview card.
      sideSwitch: "Side shown in the preview",
      sideFront: "Front",
      sideBack: "Back",
      previewFrontAria: "Preview of the front of the card",
      previewBackAria: "Preview of the back of the card",
      // The download button names exactly what it downloads.
      btnDownloadPdf: "Download PDF",
      btnDownloadAll: "Download PDF, QR and vCard",
      previewHeading: "Preview",
      scanCaption: "Scan to save my contact",
      previewNote: "Drawn from the same layout as the PDF, so what you see is what prints.",
      // The rulers around the preview card: its real width and height.
      rulerUsWidth: "3.5 in",
      rulerUsHeight: "2 in",
      rulerEuWidth: "85 mm",
      rulerEuHeight: "55 mm",
      previewName: "Your Name",
      errName: "Please enter a name.",
      errEmail: "That email doesn't look right.",
      // The form is remembered in this browser between visits (saveForm).
      noteSaved: "Your details are saved in this browser, so they're still here next time.",
      // QR density warning: one opening + one piece of advice.
      // Card warnings (updateWarnings): content that doesn't fit, then the QR.
      cardOverflow: "Some details are too close to the card's edge or the QR code to print safely. Remove a line or shorten a long one.",
      qrDense: "The QR code is very dense and may not scan at this card size.",
      qrTooBig: "There's more here than a QR code can hold.",
      qrAdviceLinks: "Remove a link, or untick \u201cSave links in the QR code and contact file\u201d. Links still print on the card.",
      qrAdviceOther: "Try fewer phone numbers or shorter details.",
      btnClearForm: "Clear form",
      confirmClearForm: "Clear the form? This also deletes the details saved in this browser.",
    },
    ar: {
      appTitle: "منشئ بطاقة التواصل",
      tagline: "أنشئ بطاقة عمل جاهزة للطباعة ورمز QR وملف جهة اتصال — من متصفحك مباشرة.",
      formHeading: "بياناتك",
      legendIdentity: "الهوية",
      labelName: "الاسم الكامل",
      labelTitle: "المسمى الوظيفي",
      labelCompany: "الشركة",
      legendPhones: "أرقام الهاتف",
      phName: "فلان الفلاني",
      phTitle: "مصمم منتجات",
      phCompany: "استوديو الريشة",
      phPhoneLabel: "التسمية",
      phPhone1: "+970500000000",
      phPhone2: "+970511111111",
      phEmail: "flan@example.com",
      phoneLabelPresets: ["واتساب", "موبايل", "عمل", "منزل", "تيليجرام", "سيجنال"],
      phoneFallback: "هاتف",
      addPhone: "+ إضافة هاتف",
      legendContact: "البريد والروابط",
      labelEmail: "البريد الإلكتروني",
      labelLinks: "الروابط",
      addLink: "+ إضافة رابط",
      labelLinksInQr: "حفظ الروابط في رمز QR وملف جهة الاتصال",
      hintLinksInQr: "تُطبع الروابط على البطاقة دائمًا. ألغِ التحديد للحصول على رمز QR أبسط تقرؤه الهواتف القديمة بسهولة أكبر.",
      labelAccent: "اللون المميز",
      colorPurple: "بنفسجي",
      colorNavy: "كحلي",
      colorBlue: "أزرق",
      colorTeal: "تركوازي",
      colorGreen: "أخضر",
      colorCrimson: "قرمزي",
      colorAmber: "كهرماني",
      colorGraphite: "رمادي فحمي",
      colorCustom: "لون مخصص",
      legendOutput: "الطباعة والتنزيل",
      labelFiles: "الملفات",
      optPdfOnly: "ملف PDF فقط",
      optAllFiles: "PDF و QR و vCard",
      labelCardSize: "حجم البطاقة",
      sizeUs: "بطاقة أمريكية — 3.5 × 2 إنش",
      sizeEu: "أوروبية / ISO — 85 × 55 مم",
      labelPdfLayout: "تخطيط ملف PDF",
      layoutSingle: "بطاقة واحدة في كل صفحة",
      layoutSheet: "ورقة كاملة من البطاقات",
      hintSingle: "بالمقاس الفعلي للبطاقة، جاهز لإرساله إلى المطبعة.",
      hintSheet: "{count} بطاقات على صفحة {paper} واحدة مع علامات القص. اطبعها بالحجم الفعلي (100%) ثم قُصّ على العلامات.",
      labelCardBack: "ظهر البطاقة",
      backNone: "فارغ (الوجه فقط)",
      backQr: "رمز QR كبير",
      backOther: "البطاقة بالإنجليزية",
      labelOtherName: "الاسم بالإنجليزية",
      labelOtherTitle: "المسمى الوظيفي بالإنجليزية",
      labelOtherCompany: "الشركة بالإنجليزية",
      hintOtherFields: "اترك أي حقل فارغًا لطباعة نص الوجه كما هو. تُترجم تسميات الهاتف، أما التسميات الخاصة فتُطبع «Phone» (هاتف).",
      backOverflow: "بعض البيانات على ظهر البطاقة قريبة جدًا من الحافة أو من رمز QR فقد لا تُطبع جيدًا. اختصر الاسم أو المسمى أو الشركة هناك، أو احذف سطرًا.",
      hintBackPage: "يضيف صفحة ثانية إلى ملف PDF لظهر البطاقة. اطلب من المطبعة الطباعة على الوجهين.",
      hintBackSheet: "الورقة الكاملة تطبع وجه البطاقة فقط. اختر بطاقة واحدة في كل صفحة لطباعة الظهر.",
      sideSwitch: "الجهة المعروضة في المعاينة",
      sideFront: "الوجه",
      sideBack: "الظهر",
      previewFrontAria: "معاينة وجه البطاقة",
      previewBackAria: "معاينة ظهر البطاقة",
      btnDownloadPdf: "تنزيل ملف PDF",
      btnDownloadAll: "تنزيل PDF و QR و vCard",
      previewHeading: "معاينة",
      scanCaption: "امسح لحفظ جهة الاتصال",
      previewNote: "مرسومة بنفس تخطيط ملف PDF، فما تراه هو ما سيُطبع.",
      rulerUsWidth: "3.5 إنش",
      rulerUsHeight: "2 إنش",
      rulerEuWidth: "85 مم",
      rulerEuHeight: "55 مم",
      previewName: "اسمك",
      errName: "يرجى إدخال الاسم.",
      errEmail: "يبدو أن البريد الإلكتروني غير صحيح.",
      noteSaved: "تُحفظ بياناتك في هذا المتصفح، فتجدها هنا في زيارتك القادمة.",
      cardOverflow: "بعض البيانات قريبة جدًا من حافة البطاقة أو من رمز QR فقد لا تُطبع جيدًا. احذف سطرًا أو اختصر سطرًا طويلًا.",
      qrDense: "رمز QR كثيف جدًا وقد لا يُقرأ بسهولة بهذا الحجم من البطاقة.",
      qrTooBig: "البيانات أكثر مما يتسع له رمز QR.",
      qrAdviceLinks: "احذف رابطًا، أو ألغِ تحديد «حفظ الروابط في رمز QR وملف جهة الاتصال». ستبقى الروابط مطبوعة على البطاقة.",
      qrAdviceOther: "جرّب تقليل أرقام الهاتف أو اختصار البيانات.",
      btnClearForm: "مسح النموذج",
      confirmClearForm: "هل تريد مسح النموذج؟ سيؤدي ذلك أيضًا إلى حذف البيانات المحفوظة في هذا المتصفح.",
    },
  };

  var currentLang = "en";

  function t(key) {
    return tIn(currentLang, key);
  }

  // A UI string in a given language (the card's, which may not be the UI's:
  // the bilingual back is in the other one).
  function tIn(lang, key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  }

  function otherLang(lang) {
    return lang === "ar" ? "en" : "ar";
  }

  // Phone labels in both languages, for the bilingual back. Each row is one
  // label; the first word in each list is the one printed, the others are
  // common ways people type it. Matching ignores case.
  var PHONE_LABELS = [
    { en: ["WhatsApp"], ar: ["واتساب", "واتس اب"] },
    { en: ["Mobile", "Cell"], ar: ["موبايل", "جوال", "محمول"] },
    { en: ["Work", "Office"], ar: ["عمل", "العمل"] },
    { en: ["Home"], ar: ["منزل", "المنزل"] },
    { en: ["Telegram"], ar: ["تيليجرام", "تلغرام"] },
    { en: ["Signal"], ar: ["سيجنال"] },
    { en: ["Phone"], ar: ["هاتف"] },
  ];

  // `label` (typed in either language) in `lang`, or null if it isn't one of
  // the labels above.
  function knownPhoneLabel(label, lang) {
    var wanted = String(label).trim().toLowerCase();
    for (var i = 0; i < PHONE_LABELS.length; i++) {
      var row = PHONE_LABELS[i];
      var all = row.en.concat(row.ar).map(function (l) { return l.toLowerCase(); });
      if (all.indexOf(wanted) !== -1) return row[lang][0];
    }
    return null;
  }

  // The label to print on the bilingual back: the known translation, or
  // "Phone" for a custom label. A custom label already in the back's script
  // (e.g. "Fax" on an English back) prints as typed. An empty one stays empty.
  function translatePhoneLabel(label, lang) {
    label = String(label).trim();
    if (!label) return "";
    var known = knownPhoneLabel(label, lang);
    if (known) return known;
    return containsArabic(label) === (lang === "ar") ? label : tIn(lang, "phoneFallback");
  }

  // ---------------------------------------------------------------------------
  // 1. Read the form into a plain data object.
  //    This is the single source of truth the vCard / QR / PDF are built from.
  // ---------------------------------------------------------------------------
  // Split a full name into given + family for the vCard N field.
  // Convention (matches the original script): the LAST word is the family
  // name, everything before it is the given name(s).
  function splitName(displayName) {
    var parts = displayName.split(/\s+/).filter(Boolean);
    return {
      givenName: parts.length > 1 ? parts.slice(0, -1).join(" ") : displayName,
      familyName: parts.length > 1 ? parts[parts.length - 1] : "",
    };
  }

  function readForm() {
    var val = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    var displayName = val("name");
    var name = splitName(displayName);

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
      givenName: name.givenName,
      familyName: name.familyName,
      title: val("title"),
      company: val("company"),
      phones: phones,
      email: val("email"),
      links: links,
      // Links always print on the card; this decides if they also go in the
      // vCard (and so the QR). Fewer URLs = a simpler QR for older scanners.
      linksInVCard: linksInQrEl ? linksInQrEl.checked : true,
      accent: val("accent") || "#732da0",
      output: outputEl ? outputEl.value : "all",
      size: val("card-size") || "us",
      // true = a full page of cards to print at home; false = one card per page.
      sheet: val("pdf-layout") === "sheet",
      // What prints on the back: "none", "qr" or "other" (the card in the
      // other language; see hasBack and backCardData).
      back: val("card-back") || "none",
      // The back's own name, title and company, in the other language.
      otherName: val("other-name"),
      otherTitle: val("other-title"),
      otherCompany: val("other-company"),
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
    // ORG is a structured field (organization;unit;...); escaping the ";"
    // keeps the whole company name as the organization.
    if (data.company) lines.push("ORG:" + escapeVCard(data.company));

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

  // The QR for `text`, or null when there's more than a QR code can hold.
  function qrModelOrNull(text) {
    try { return buildQrModel(text); } catch (e) { return null; }
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

  // Can a phone scan the printed QR? What matters is how big one module (one
  // small square) prints. More data means more modules in the same box, so
  // each one gets smaller. Below about 0.4 mm, phone cameras start to
  // struggle with a printed code, so that is where we warn. Tune it here.
  var QR_MIN_MODULE_MM = 0.4;

  // "ok", "dense" (warn: may not scan) or "too-big" (no QR could be made).
  // Reads the QR box from the card layout, so it follows the card size.
  function qrScanCheck(layout) {
    var op = layout.ops.filter(function (o) { return o.type === "qr"; })[0];
    if (!op || !op.qr) return "too-big";
    var modulePt = op.size / (op.qr.getModuleCount() + op.quiet * 2);
    var moduleMm = modulePt / 72 * 25.4;
    return moduleMm < QR_MIN_MODULE_MM ? "dense" : "ok";
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

  // The closest the contact lines may get on a crowded card, in points
  // (they're 7 pt type, normally 11.5 pt apart).
  var CONTACT_STEP_MIN = 9.5;

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
  // `side` is "front" (the default) or "back": a large QR (layoutBack), or
  // the same card in the other language, mirrored (backCardData).
  function layoutCard(data, lang, qr, side) {
    if (side === "back") {
      if (data.back === "other") {
        // Its own QR, so scanning the back saves the contact in the back's
        // language. (The .vcf and QR .png downloads stay the front's.)
        var backData = backCardData(data, lang);
        return layoutCard(backData, otherLang(lang), qrModelOrNull(buildVCard(backData)));
      }
      return layoutBack(data, lang, qr);
    }
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
    text(tIn(lang, "scanCaption"), qx + qrSize / 2, qy + qrSize + 9, 5.4, false, CARD_GREY, "center");

    // --- Accent bar (right under RTL, left otherwise) ---
    // `bleed` names the card edge the bar touches. On a full sheet the bar is
    // extended a little past that edge (see drawBleed), so a slightly-off cut
    // still leaves the color running right to the edge of the card.
    ops.push({ type: "rect", x: rtl ? W - 4 : 0, y: 0, w: 4, h: H, color: acc,
               bleed: rtl ? "right" : "left" });

    // Width available to the text column (between the start edge and the QR,
    // keeping a 10 pt gap before the QR).
    var qrGap = 10;
    var textWidth = rtl
      ? anchorX - (qx + qrSize + qrGap)
      : (qx - qrGap) - edge;

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

    // --- Company (under the title; shrinks to fit, since names run long) ---
    if (data.company) {
      y += data.title ? 10 : 13;
      var companyFont = cardFont(data.company, false);
      var companySize = 7.6;
      while (companySize > 6 && textWidthPt(data.company, companyFont, companySize) > textWidth) {
        companySize = Math.round((companySize - 0.2) * 10) / 10;
      }
      text(data.company, anchorX, y, companySize, false, CARD_GREY);
    }

    // --- Divider ---
    y += 7;
    var dividerLen = Math.min(96, textWidth);
    ops.push({ type: "line", x1: anchorX, y1: y, x2: rtl ? anchorX - dividerLen : anchorX + dividerLen,
               y2: y, width: 0.8, color: acc });

    // --- Contact lines: phones (label + number), email, links ---
    // Lines are 11.5 pt apart. On a crowded card they move closer together
    // (down to CONTACT_STEP_MIN) so the last line stays on the card; cards
    // that already fit are laid out exactly as before.
    y += 13;
    var lineCount = data.phones.length + (data.email ? 1 : 0) + data.links.length;
    // The lowest a contact line may sit: the card's own margin (about 5 mm).
    // A line below it can look fine on screen, but print shops only promise
    // to cut within about 3 mm of the edge, so it could be trimmed.
    var lastBaseline = H - M;
    var step = 11.5;
    if (lineCount > 1 && y + (lineCount - 1) * step > lastBaseline) {
      step = Math.max(CONTACT_STEP_MIN, (lastBaseline - y) / (lineCount - 1));
    }
    var fits = lineCount === 0 || y + (lineCount - 1) * step <= lastBaseline + 0.01;
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

    // Does every line of the text column stay clear of the QR? A long link
    // may run into the gap before it (that still looks fine), but must end at
    // least 2 pt short of the QR box: text in the QR's white margin makes it
    // harder to scan. (The name and company shrink to fit, but only down to a
    // minimum.) The caption is centered under the QR, so it isn't checked.
    ops.forEach(function (op) {
      if (op.type !== "text" || op.align !== align) return;
      var reach = Math.abs(op.x - anchorX) + textWidthPt(op.text, op.font, op.size);
      if (reach > textWidth + qrGap - 2) fits = false;
    });

    // `fits` is false when something runs off the card or into the QR; the
    // app warns about it (updateWarnings) but still draws the card as is.
    return { w: W, h: H, ops: ops, fits: fits };
  }

  // The back of the card: one large QR code, centered, with the caption under
  // it. It's bigger than the front's QR, so its squares print bigger and scan
  // more easily. The accent bar goes on the far edge: a card is turned over
  // like a page, which swaps left and right, so the colored edge shows on
  // both sides. Same drawing operations as the front, so the PDF and the
  // preview draw it the same way.
  function layoutBack(data, lang, qr) {
    var size = CARD_SIZES[data.size] || CARD_SIZES.us;
    var W = size.w, H = size.h;
    var acc = data.accent || "#732da0";
    var rtl = lang === "ar";
    var M = 14;           // the same safe margin as the front
    var captionGap = 9;   // QR box to caption baseline, as on the front
    var ops = [];

    var qrSize = H - 2 * M - captionGap;
    var qx = (W - qrSize) / 2, qy = M;
    ops.push({ type: "qr", x: qx, y: qy, size: qrSize, quiet: 2, qr: qr, color: CARD_INK });

    var caption = tIn(lang, "scanCaption");
    ops.push({ type: "text", text: caption, x: W / 2, y: qy + qrSize + captionGap,
               size: 5.4, font: cardFont(caption, false), color: CARD_GREY, align: "center" });

    ops.push({ type: "rect", x: rtl ? 0 : W - 4, y: 0, w: 4, h: H, color: acc,
               bleed: rtl ? "left" : "right" });

    // Nothing here depends on what was typed, so the back always fits.
    return { w: W, h: H, ops: ops, fits: true };
  }

  // The bilingual back's content: the front's details with the name, title
  // and company typed for the back (each falls back to the front's, e.g. a
  // company name that's the same in both languages), and the phone labels
  // translated. Phones, email and links stay the same. Its QR is built from
  // this, so it carries the back's name, title and company.
  function backCardData(data, lang) {
    var to = otherLang(lang);
    var back = {};
    Object.keys(data).forEach(function (key) { back[key] = data[key]; });
    back.displayName = data.otherName || data.displayName;
    var name = splitName(back.displayName);
    back.givenName = name.givenName;
    back.familyName = name.familyName;
    back.title = data.otherTitle || data.title;
    back.company = data.otherCompany || data.company;
    back.phones = data.phones.map(function (phone) {
      return { label: translatePhoneLabel(phone.label, to), number: phone.number };
    });
    return back;
  }

  // Does this PDF get a back? Only the one-card PDF does: on a full sheet,
  // fronts and backs would have to line up exactly when printed on both
  // sides, which can't be checked without a printer.
  function hasBack(data) {
    return !data.sheet && (data.back === "qr" || data.back === "other");
  }

  // Paper for the "full sheet" layout, in points. Each card size goes on the
  // paper used where that card is standard: US cards on Letter, EU cards on A4.
  var PAPER_SIZES = {
    us: { name: "Letter", w: 612, h: 792 },     // 8.5 x 11 in
    eu: { name: "A4", w: 595.276, h: 841.89 },  // 210 x 297 mm
  };

  // Keep the cards at least this far from the paper edge: home printers can't
  // print right up to the edge, and the cut marks are drawn in this margin.
  var SHEET_MIN_MARGIN = 28; // about 10 mm

  // Space between the card columns. Without it, the cut between two columns
  // runs right along the next card's accent bar, so missing by a millimeter
  // shows. Rows stay touching: card tops and bottoms are blank and the bars
  // line up, so an off cut there just makes a card a hair taller or shorter.
  var SHEET_COLUMN_GAP = 17;   // about 6 mm
  // How far the accent bar runs past the card edge, into the gap / margin.
  var SHEET_BLEED = 5.67;      // 2 mm

  // Where each card goes on a full sheet: columns with a gap between them,
  // rows edge to edge. A portrait page fits the most for both pairs:
  // 2 x 5 = 10 cards.
  function layoutSheet(sizeKey) {
    var card = CARD_SIZES[sizeKey] || CARD_SIZES.us;
    var paper = PAPER_SIZES[sizeKey] || PAPER_SIZES.us;
    var gap = SHEET_COLUMN_GAP;
    var cols = Math.floor((paper.w - 2 * SHEET_MIN_MARGIN + gap) / (card.w + gap));
    var rows = Math.floor((paper.h - 2 * SHEET_MIN_MARGIN) / card.h);
    // Center the grid on the page.
    var gridW = cols * card.w + (cols - 1) * gap;
    var gridH = rows * card.h;
    var x0 = (paper.w - gridW) / 2;
    var y0 = (paper.h - gridH) / 2;

    var colX = [];
    for (var c = 0; c < cols; c++) colX.push(x0 + c * (card.w + gap));

    var slots = [];
    for (var r = 0; r < rows; r++) {
      colX.forEach(function (x) { slots.push({ x: x, y: y0 + r * card.h }); });
    }
    return { paper: paper, card: card, cols: cols, rows: rows, colX: colX,
             x0: x0, y0: y0, gridW: gridW, gridH: gridH,
             count: slots.length, slots: slots };
  }

  // Extend each accent bar past the card edge it touches ("bleed"), drawn
  // under the cards. The bars of a column already line up into one stripe, so
  // one tall strip per column also covers the top and bottom edges.
  function drawBleed(doc, sheet, ops) {
    var top = sheet.y0 - SHEET_BLEED;
    var height = sheet.gridH + 2 * SHEET_BLEED;
    ops.forEach(function (op) {
      if (!op.bleed) return;
      var c = hexToRgb(op.color);
      doc.setFillColor(c.r, c.g, c.b);
      sheet.colX.forEach(function (colX) {
        var x = colX + op.x - (op.bleed === "left" ? SHEET_BLEED : 0);
        doc.rect(x, top, op.w + SHEET_BLEED, height, "F");
      });
    });
  }

  // Short cut marks in the margin, lined up with every cut line: both edges
  // of every column, and every row boundary. They start just past the bleed,
  // so they never touch a card or the colored bars.
  function drawCutMarks(doc, sheet) {
    var offset = SHEET_BLEED + 2, len = 10;
    var top = sheet.y0, bottom = sheet.y0 + sheet.gridH;
    var left = sheet.x0, right = sheet.x0 + sheet.gridW;
    var c = hexToRgb(CARD_INK);
    doc.setDrawColor(c.r, c.g, c.b);
    doc.setLineWidth(0.4);

    sheet.colX.forEach(function (colX) {
      [colX, colX + sheet.card.w].forEach(function (x) {
        doc.line(x, top - offset, x, top - offset - len);         // above the grid
        doc.line(x, bottom + offset, x, bottom + offset + len);   // below the grid
      });
    });
    for (var row = 0; row <= sheet.rows; row++) {
      var y = top + row * sheet.card.h;
      doc.line(left - offset, y, left - offset - len, y);         // left of the grid
      doc.line(right + offset, y, right + offset + len, y);       // right of the grid
    }
  }

  // Draw a card's layout into a jsPDF doc, shifted by (dx, dy) points — (0, 0)
  // for a single-card page, or a slot's position on a full sheet.
  function drawCardOps(doc, ops, dx, dy) {
    ops.forEach(function (op) {
      var c = hexToRgb(op.color);
      if (op.type === "rect") {
        doc.setFillColor(c.r, c.g, c.b);
        doc.rect(op.x + dx, op.y + dy, op.w, op.h, "F");
      } else if (op.type === "line") {
        doc.setDrawColor(c.r, c.g, c.b);
        doc.setLineWidth(op.width);
        doc.line(op.x1 + dx, op.y1 + dy, op.x2 + dx, op.y2 + dy);
      } else if (op.type === "text") {
        // jsPDF shapes and right-to-left orders Arabic itself — just pick the
        // font and hand it the raw text.
        doc.setFont(op.font.family, op.font.style);
        doc.setFontSize(op.size);
        doc.setTextColor(c.r, c.g, c.b);
        doc.text(op.text, op.x + dx, op.y + dy, { align: op.align });
      } else if (op.type === "qr") {
        // Drawn as vector squares (not a pasted image) so it stays crisp in print.
        var count = op.qr.getModuleCount();
        var cell = op.size / (count + op.quiet * 2);
        var qx = op.x + dx, qy = op.y + dy;
        doc.setFillColor(c.r, c.g, c.b);
        for (var r = 0; r < count; r++) {
          for (var col = 0; col < count; col++) {
            if (op.qr.isDark(r, col)) {
              doc.rect(qx + (col + op.quiet) * cell, qy + (r + op.quiet) * cell, cell, cell, "F");
            }
          }
        }
      }
    });
  }

  // The PDF: either one card on a card-sized page, or (data.sheet) a full
  // Letter / A4 page of identical cards with cut marks, for printing at home.
  function buildPdf(data, qr) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF library not loaded (lib/jspdf.umd.min.js).");
    }
    var layout = layoutCard(data, currentLang, qr);

    if (!data.sheet) {
      var single = new window.jspdf.jsPDF({
        unit: "pt",
        compress: true,
        format: [layout.w, layout.h],
        orientation: layout.w >= layout.h ? "landscape" : "portrait",
      });
      drawCardOps(single, layout.ops, 0, 0);
      // The back, if chosen, is page 2: what a print shop expects.
      if (hasBack(data)) {
        single.addPage([layout.w, layout.h], layout.w >= layout.h ? "landscape" : "portrait");
        drawCardOps(single, layoutCard(data, currentLang, qr, "back").ops, 0, 0);
      }
      return single;
    }

    var sheet = layoutSheet(data.size);
    var doc = new window.jspdf.jsPDF({
      unit: "pt",
      compress: true, // ten vector QR codes add up; compression keeps the file small
      format: [sheet.paper.w, sheet.paper.h],
      orientation: "portrait",
    });
    drawBleed(doc, sheet, layout.ops);
    sheet.slots.forEach(function (slot) {
      drawCardOps(doc, layout.ops, slot.x, slot.y);
    });
    drawCutMarks(doc, sheet);
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
  // 5. Helpers: file names, and a generic "download this text/blob as a file"
  //    routine reused by every output.
  // ---------------------------------------------------------------------------

  // The local date and time as 2026-11-14_10-32-05 (no colons: Windows doesn't
  // allow them in file names). Sorts by name in time order.
  function fileTimestamp(date) {
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
      "_" + pad(date.getHours()) + "-" + pad(date.getMinutes()) + "-" + pad(date.getSeconds());
  }

  // File names use the same English format in both languages and end with the
  // time they were made, so they're unique, sortable and easy to search. The
  // PDF's name says what's inside: one card or a full sheet, size, language.
  //   card_US_EN_2026-11-14_10-32-05.pdf               one US card, English layout
  //   card_EU_AR_2026-11-14_10-32-05.pdf               one EU card, Arabic layout
  //   card-2-sided_US_EN_2026-11-14_10-32-05.pdf       one US card, front + QR back
  //   card-2-sided_US_EN-AR_2026-11-14_10-32-05.pdf    English front, Arabic back
  //   card-sheet_US-Letter_EN_2026-11-14_10-32-05.pdf  10 US cards on a Letter page
  //   card-sheet_EU-A4_AR_2026-11-14_10-32-05.pdf      10 EU cards on an A4 page
  function pdfFileName(data, lang, stamp) {
    var size = data.size === "eu" ? "EU" : "US";
    var language = lang === "ar" ? "AR" : "EN";
    if (hasBack(data) && data.back === "other") language += lang === "ar" ? "-EN" : "-AR";
    var kind = data.sheet
      ? "card-sheet_" + size + "-" + layoutSheet(data.size).paper.name
      : (hasBack(data) ? "card-2-sided_" : "card_") + size;
    return kind + "_" + language + "_" + stamp + ".pdf";
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
      formChanged();
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
      formChanged();
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
      company: "Maple & Moss Studio",
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
      company: "استوديو الريشة",
      phones: [
        { label: "واتساب", number: "+970500000000" },
        { label: "موبايل", number: "+970511111111" },
      ],
      email: "flan@example.com",
      links: ["linkedin.com/in/your-profile", "github.com/your-username"],
    },
  };

  // Which side of the card the preview shows. `previewSide` is the one asked
  // for (the Front / Back switch); `shownSide` is the one drawn, which changes
  // halfway through the flip animation, when the card is edge-on.
  var previewSide = "front";
  var shownSide = "front";
  var flipping = false;

  // Turn the preview card over to `side`: a quick flip, like turning a card
  // in your hand. With reduced motion it just switches.
  function showSide(side) {
    previewSide = side;
    document.querySelectorAll('input[name="preview-side"]').forEach(function (radio) {
      radio.checked = radio.value === side;
    });
    var card = document.getElementById("card-preview");
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!card || !card.animate || still) {
      shownSide = side;
      syncPreview();
      return;
    }
    if (flipping || side === shownSide) return; // the running flip ends on previewSide
    flipping = true;
    // Turn one way to show the back, the other way to come back; mirrored in Arabic.
    var turn = (side === "back" ? 90 : -90) * (currentLang === "ar" ? -1 : 1);
    var away = card.animate([
      { transform: "perspective(900px) rotateY(0deg)" },
      { transform: "perspective(900px) rotateY(" + turn + "deg)" },
    ], { duration: 140, easing: "cubic-bezier(0.4, 0, 1, 1)" });
    away.onfinish = function () {
      shownSide = previewSide;
      flipping = false;
      syncPreview();
      card.animate([
        { transform: "perspective(900px) rotateY(" + -turn + "deg)" },
        { transform: "perspective(900px) rotateY(0deg)" },
      ], { duration: 180, easing: "cubic-bezier(0, 0, 0.2, 1)" });
    };
  }

  // The back option changed (or the PDF layout, which decides whether there
  // is a back): show the back when one was just added, the front when there
  // is none.
  function backOptionChanged(event) {
    var data = readForm();
    if (!hasBack(data)) showSide("front");
    else if (event.target.id === "card-back") showSide("back");
  }

  // The hint under "Back of the card": what the chosen back adds to the PDF,
  // or why a full sheet won't print it. The back's own fields show only
  // while the bilingual back will print.
  function updateBackHint(data) {
    var hint = document.getElementById("card-back-hint");
    if (hint) {
      var key = data.back === "none" ? "" : (data.sheet ? "hintBackSheet" : "hintBackPage");
      hint.textContent = key ? t(key) : "";
      hint.hidden = !key;
    }
    var fields = document.getElementById("back-fields");
    if (fields) fields.hidden = !(data.back === "other" && hasBack(data));
  }

  // Switching the UI language also switches the card's: with the bilingual
  // back, the front is about to become the other language. Swap each typed
  // pair (name, title, company) so every side keeps its own language, and
  // turn the phone labels we know into the new language. Custom labels and
  // empty back fields stay as they are, so nothing typed is lost.
  function swapCardLanguages() {
    [["name", "other-name"], ["title", "other-title"], ["company", "other-company"]].forEach(function (pair) {
      var front = document.getElementById(pair[0]);
      var back = document.getElementById(pair[1]);
      if (!front || !back || !back.value.trim()) return;
      var typed = front.value;
      front.value = back.value;
      back.value = typed;
    });
    var to = otherLang(currentLang);
    document.querySelectorAll("#phone-list .phone-label").forEach(function (input) {
      var known = knownPhoneLabel(input.value, to);
      if (known) input.value = known;
    });
  }

  // Mirror the form into the preview card as the user types. The preview is
  // drawn from the same layout as the PDF (layoutCard), including a live QR,
  // so what you see is what prints.
  function syncPreview() {
    var card = document.getElementById("card-preview");
    var svg = card && card.querySelector("svg");
    if (!svg) return;
    var data = readForm();

    // Until any field is filled in, show the localized fictional sample.
    var isEmpty = !data.displayName && !data.title && !data.company && !data.email &&
                  data.phones.length === 0 && data.links.length === 0 &&
                  !data.otherName && !data.otherTitle && !data.otherCompany;
    var view = isEmpty ? SAMPLE[currentLang] : data;
    // The sample's back text comes from the other language's sample.
    var otherSample = SAMPLE[otherLang(currentLang)];
    var name = view.displayName || t("previewName");
    var shown = {
      displayName: name,
      givenName: view.givenName || name,
      familyName: view.familyName || "",
      title: view.title,
      company: view.company,
      phones: view.phones,
      email: view.email,
      links: view.links,
      linksInVCard: data.linksInVCard,
      accent: data.accent,
      size: data.size,
      back: data.back,
      otherName: isEmpty ? otherSample.displayName : data.otherName,
      otherTitle: isEmpty ? otherSample.title : data.otherTitle,
      otherCompany: isEmpty ? otherSample.company : data.otherCompany,
    };

    // The QR encodes the shown contact, so its density matches the real card.
    // Too much data for a QR code throws; the box is then shown empty.
    var qr = null;
    try { qr = buildQrModel(buildVCard(shown)); } catch (e) { qr = null; }

    var layout = layoutCard(shown, currentLang, qr);
    // The back is shown only while the PDF has one (or mid-flip back to the
    // front). Warnings always come from the front.
    var side = hasBack(data) || flipping ? shownSide : "front";
    var backLayout = layoutCard(shown, currentLang, qr, "back");
    renderPreview(svg, side === "back" ? backLayout : layout);
    svg.setAttribute("aria-label", t(side === "back" ? "previewBackAria" : "previewFrontAria"));
    var sideSwitch = document.getElementById("side-switch");
    if (sideSwitch) sideSwitch.hidden = !hasBack(data);
    // The sample card never warns; only what the user typed does.
    updateWarnings(isEmpty ? [] : cardWarnings(layout, data, hasBack(data) ? backLayout : null));
    updateLayoutHint(data);
    updateBackHint(data);
    updateRulers(data);
    updateDownloadLabel(data);
  }

  // The rulers around the preview card show its real printed size.
  function updateRulers(data) {
    var proof = document.getElementById("proof");
    var width = document.getElementById("ruler-width");
    var height = document.getElementById("ruler-height");
    if (!proof || !width || !height) return;
    var eu = data.size === "eu";
    proof.setAttribute("data-size", eu ? "eu" : "us");
    width.textContent = t(eu ? "rulerEuWidth" : "rulerUsWidth");
    height.textContent = t(eu ? "rulerEuHeight" : "rulerUsHeight");
  }

  // What's wrong with the card, as messages for the warning box: content
  // that doesn't fit, and a QR that may not scan. For the QR the advice fits
  // the situation: links in the QR are the usual cause, and unticking them
  // keeps them on the card.
  function cardWarnings(layout, data, backLayout) {
    var messages = [];
    if (!layout.fits) messages.push(t("cardOverflow"));
    // The QR back always fits; the bilingual back has its own text to check.
    if (backLayout && !backLayout.fits) messages.push(t("backOverflow"));
    // The bilingual back has its own QR; warn about whichever side is worse.
    var qrState = qrScanCheck(layout);
    var backQrState = backLayout ? qrScanCheck(backLayout) : "ok";
    if (qrState === "ok" || backQrState === "too-big") qrState = backQrState;
    if (qrState !== "ok") {
      var linksInQr = data.linksInVCard && data.links.length > 0;
      messages.push(t(qrState === "too-big" ? "qrTooBig" : "qrDense") + " " +
                    t(linksInQr ? "qrAdviceLinks" : "qrAdviceOther"));
    }
    return messages;
  }

  // Show the warnings (never block) next to the download button, so they're
  // seen on every screen size. One line per message.
  function updateWarnings(messages) {
    var box = document.getElementById("card-warning");
    var text = document.getElementById("card-warning-text");
    if (!box || !text) return;
    // Only touch the text when it changes, so screen readers announce it once
    // (it's a live region), not on every keystroke.
    if (text.getAttribute("data-shown") !== messages.join("\n")) {
      text.setAttribute("data-shown", messages.join("\n"));
      text.textContent = "";
      messages.forEach(function (message) {
        var line = document.createElement("span");
        line.className = "card-warning__line";
        line.textContent = message;
        text.appendChild(line);
      });
    }
    box.hidden = messages.length === 0;
  }

  // The button says exactly what it will download: just the PDF, or all three.
  function updateDownloadLabel(data) {
    var btn = document.getElementById("download-btn");
    if (!btn) return;
    btn.textContent = t(data.output === "pdf" ? "btnDownloadPdf" : "btnDownloadAll");
  }

  // ---------------------------------------------------------------------------
  // Accent swatches: picking a chip copies its color into the #accent color
  // input (which readForm uses); picking a custom color in #accent selects the
  // matching chip, or marks the custom chip as active if none match.
  // ---------------------------------------------------------------------------
  function wireSwatches() {
    var accent = document.getElementById("accent");
    var custom = document.getElementById("swatch-custom");
    var chips = document.querySelectorAll('input[name="accent-swatch"]');
    if (!accent || !custom) return;

    function syncChips() {
      var value = accent.value.toLowerCase();
      var matched = false;
      chips.forEach(function (chip) {
        chip.checked = chip.value.toLowerCase() === value;
        if (chip.checked) matched = true;
      });
      custom.classList.toggle("is-active", !matched);
      custom.style.setProperty("--swatch", accent.value);
    }

    chips.forEach(function (chip) {
      // Runs before the form's own change listener, so the preview sees the
      // new color.
      chip.addEventListener("change", function () {
        accent.value = chip.value;
        syncChips();
      });
    });
    accent.addEventListener("input", syncChips);
    syncChips();
    return syncChips;
  }

  // The hint under "PDF layout": what the chosen layout prints, e.g.
  // "10 cards on one A4 page". Follows the card size and the language.
  function updateLayoutHint(data) {
    var hint = document.getElementById("pdf-layout-hint");
    if (!hint) return;
    if (data.sheet) {
      var sheet = layoutSheet(data.size);
      hint.textContent = t("hintSheet")
        .replace("{count}", sheet.count)
        .replace("{paper}", sheet.paper.name);
    } else {
      hint.textContent = t("hintSingle");
    }
  }

  // ---------------------------------------------------------------------------
  // 7b. Remember the form between visits. Everything typed is saved to
  //     localStorage as it changes and put back when the page opens. Like the
  //     saved language, every storage call is wrapped in try/catch: with
  //     storage blocked (private mode, file:// in some browsers) the app works
  //     the same, it just doesn't remember.
  // ---------------------------------------------------------------------------
  var FORM_KEY = "ccb-form";

  // The rows as typed, half-filled ones included, so a visit picks up exactly
  // where the last one stopped. (readForm, by contrast, trims and drops
  // empty rows, because it feeds the vCard.)
  function snapshotForm() {
    var value = function (id) {
      var el = document.getElementById(id);
      return el ? el.value : "";
    };
    var phones = [];
    document.querySelectorAll("#phone-list .repeat-row").forEach(function (row) {
      phones.push({
        label: row.querySelector(".phone-label").value,
        number: row.querySelector(".phone-number").value,
      });
    });
    var links = [];
    document.querySelectorAll("#link-list .link-url").forEach(function (input) {
      links.push(input.value);
    });
    var output = document.querySelector('input[name="output"]:checked');
    var linksInQr = document.getElementById("links-in-qr");
    return {
      name: value("name"),
      title: value("title"),
      company: value("company"),
      phones: phones,
      email: value("email"),
      links: links,
      linksInQr: linksInQr ? linksInQr.checked : true,
      accent: value("accent"),
      size: value("card-size"),
      layout: value("pdf-layout"),
      back: value("card-back"),
      otherName: value("other-name"),
      otherTitle: value("other-title"),
      otherCompany: value("other-company"),
      output: output ? output.value : "all",
    };
  }

  function saveForm() {
    try { localStorage.setItem(FORM_KEY, JSON.stringify(snapshotForm())); } catch (e) {}
  }

  function loadSavedForm() {
    try {
      var saved = JSON.parse(localStorage.getItem(FORM_KEY));
      return saved && typeof saved === "object" ? saved : null;
    } catch (e) {
      return null;
    }
  }

  // Give a repeat list exactly `count` rows (at least one), then hand each
  // row to `fill`. New rows are copies of the last one, like "+ Add".
  function setRowCount(list, count) {
    var rows = list.querySelectorAll(".repeat-row");
    count = Math.max(1, count);
    for (var i = rows.length; i < count; i++) {
      var clone = list.lastElementChild.cloneNode(true);
      list.appendChild(clone);
    }
    for (var j = rows.length; j > count; j--) {
      list.removeChild(list.lastElementChild);
    }
    return list.querySelectorAll(".repeat-row");
  }

  // Put a saved form back. Anything missing or no longer valid (an option
  // that was renamed, a malformed color) keeps the form's default.
  function restoreForm(saved) {
    var str = function (v) { return typeof v === "string" ? v : ""; };
    var setValue = function (id, v) {
      var el = document.getElementById(id);
      if (el) el.value = str(v);
    };
    var setSelect = function (id, v) {
      var el = document.getElementById(id);
      if (!el) return;
      var known = Array.prototype.some.call(el.options, function (o) { return o.value === v; });
      if (known) el.value = v;
    };

    setValue("name", saved.name);
    setValue("title", saved.title);
    setValue("company", saved.company);
    setValue("other-name", saved.otherName);
    setValue("other-title", saved.otherTitle);
    setValue("other-company", saved.otherCompany);
    setValue("email", saved.email);

    var phones = Array.isArray(saved.phones) ? saved.phones : [];
    var phoneList = document.getElementById("phone-list");
    if (phoneList) {
      setRowCount(phoneList, phones.length).forEach(function (row, i) {
        var phone = phones[i] || {};
        row.querySelector(".phone-label").value = str(phone.label);
        row.querySelector(".phone-number").value = str(phone.number);
      });
    }

    var links = Array.isArray(saved.links) ? saved.links : [];
    var linkList = document.getElementById("link-list");
    if (linkList) {
      setRowCount(linkList, links.length).forEach(function (row, i) {
        row.querySelector(".link-url").value = str(links[i]);
      });
    }

    var linksInQr = document.getElementById("links-in-qr");
    if (linksInQr && typeof saved.linksInQr === "boolean") linksInQr.checked = saved.linksInQr;

    if (/^#[0-9a-f]{6}$/i.test(str(saved.accent))) setValue("accent", saved.accent);
    setSelect("card-size", saved.size);
    setSelect("pdf-layout", saved.layout);
    setSelect("card-back", saved.back);
    document.querySelectorAll('input[name="output"]').forEach(function (radio) {
      if (radio.value === saved.output) radio.checked = true;
    });
  }

  // "Clear form": after the user confirms, put every field and row back to
  // how the page first loaded and forget the saved copy. `defaultRows` holds
  // the original markup of the phone and link lists; `syncChips` re-selects
  // the default accent swatch.
  function wireClearForm(defaultRows, syncChips) {
    var btn = document.getElementById("clear-form");
    var form = document.getElementById("card-form");
    if (!btn || !form) return;
    btn.addEventListener("click", function () {
      if (!window.confirm(t("confirmClearForm"))) return;
      Object.keys(defaultRows).forEach(function (id) {
        document.getElementById(id).innerHTML = defaultRows[id];
      });
      form.reset();
      setFieldError("name", "");
      setFieldError("email", "");
      try { localStorage.removeItem(FORM_KEY); } catch (e) {}
      if (syncChips) syncChips();
      // Re-translates the restored rows' placeholders and redraws the preview.
      applyLanguage(currentLang);
      var name = document.getElementById("name");
      if (name) name.focus();
    });
  }

  // Can this browser keep the form? Decides whether the "saved in this
  // browser" note is shown, so it never promises something that won't happen.
  function storageWorks() {
    try {
      localStorage.setItem("ccb-test", "1");
      localStorage.removeItem("ccb-test");
      return true;
    } catch (e) {
      return false;
    }
  }

  // Any edit: redraw the preview and remember the form.
  function formChanged() {
    syncPreview();
    saveForm();
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
  // 9. Wire up the form. The download button always produces the PDF and refreshes
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
    // One timestamp for the whole batch, so files made together match.
    var stamp = fileTimestamp(new Date());
    // Too much data for any QR code: there's no card to make. The warning
    // above the button already says so and how to fix it.
    var qr;
    try { qr = buildQrModel(vcard); } catch (e) { return; }
    // Same for the bilingual back's own QR.
    if (hasBack(data) && qrScanCheck(layoutCard(data, currentLang, qr, "back")) === "too-big") return;

    var canvas = drawQrToCanvas(qr);

    // The PDF business card is always produced (QR drawn as vector squares):
    // one card or a full sheet, named by size and language (see pdfFileName).
    buildPdf(data, qr).save(pdfFileName(data, currentLang, stamp));

    // "All files" additionally downloads the QR .png and the .vcf.
    if (data.output === "all") {
      canvas.toBlob(function (blob) {
        downloadBlob("QR_" + stamp + ".png", blob);
      }, "image/png");
      downloadText("contact_" + stamp + ".vcf", vcard, "text/vcard;charset=utf-8");
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
    // The back's fields take the other language: its sample text as the
    // placeholder, and lang= so spell-check and screen readers follow.
    document.querySelectorAll("[data-i18n-ph-other]").forEach(function (el) {
      var other = otherLang(currentLang);
      el.setAttribute("placeholder", tIn(other, el.getAttribute("data-i18n-ph-other")));
      el.lang = other;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
    });

    var toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.textContent = currentLang === "en" ? "العربية" : "English";
      toggle.lang = currentLang === "en" ? "ar" : "en";  // so screen readers pronounce it right
    }

    // Refresh the preview so the empty-state sample matches the new language.
    syncPreview();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("card-form");
    // A page without the form (tests.html) only uses window.ContactCard, so
    // leave it alone: no saved form, no language switch, no preview.
    if (!form) return;
    // Before the form's own listeners, so the flip starts before the redraw.
    ["card-back", "pdf-layout"].forEach(function (id) {
      var select = document.getElementById(id);
      if (select) select.addEventListener("change", backOptionChanged);
    });
    document.querySelectorAll('input[name="preview-side"]').forEach(function (radio) {
      radio.addEventListener("change", function () { showSide(radio.value); });
    });
    form.addEventListener("submit", handleSubmit);
    form.addEventListener("input", formChanged);
    form.addEventListener("change", formChanged);
    // Clear a field's error as soon as the user edits it.
    form.addEventListener("input", function (event) {
      if (event.target.id === "name" || event.target.id === "email") {
        setFieldError(event.target.id, "");
      }
    });
    // Keep the lists' original rows for "Clear form", then put back what was
    // typed last visit — before the swatches and language read the form.
    var defaultRows = {};
    ["phone-list", "link-list"].forEach(function (id) {
      var list = document.getElementById(id);
      if (list) defaultRows[id] = list.innerHTML;
    });
    var savedForm = loadSavedForm();
    if (savedForm) restoreForm(savedForm);

    wireRepeatList("phone-list", "add-phone");
    wireRepeatList("link-list", "add-link");
    var syncChips = wireSwatches();
    wireClearForm(defaultRows, syncChips);
    var savedNote = document.getElementById("saved-note");
    if (savedNote) savedNote.hidden = !storageWorks();

    var saved = null;
    try { saved = localStorage.getItem("ccb-lang"); } catch (e) {}
    applyLanguage(saved || "en");
    var toggle = document.getElementById("lang-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var back = document.getElementById("card-back");
        if (back && back.value === "other") swapCardLanguages();
        applyLanguage(currentLang === "en" ? "ar" : "en");
        saveForm();
      });
    }

    console.log("Contact Card Builder: vCard + QR + PDF ready.");
  });

  // Expose for tests.html and future steps.
  window.ContactCard = {
    readForm: readForm,
    escapeVCard: escapeVCard,
    normalizeUrl: normalizeUrl,
    containsArabic: containsArabic,
    buildVCard: buildVCard,
    buildQrModel: buildQrModel,
    drawQrToCanvas: drawQrToCanvas,
    layoutCard: layoutCard,
    hasBack: hasBack,
    translatePhoneLabel: translatePhoneLabel,
    qrScanCheck: qrScanCheck,
    layoutSheet: layoutSheet,
    buildPdf: buildPdf,
    fileTimestamp: fileTimestamp,
    pdfFileName: pdfFileName,
    downloadText: downloadText,
    downloadBlob: downloadBlob,
    applyLanguage: applyLanguage,
    snapshotForm: snapshotForm,
  };
})();
