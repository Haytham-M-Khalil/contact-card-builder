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

    return {
      displayName: displayName,
      givenName: givenName,
      familyName: familyName,
      title: val("title"),
      phones: phones,
      email: val("email"),
      links: links,
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

    data.links.forEach(function (link) {
      lines.push("URL:" + escapeVCard(normalizeUrl(link)));
    });

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

  // Swap the sample QR placeholder in the preview for the real generated code.
  function renderPreviewQr(canvas) {
    var slot = document.querySelector("#card-preview .qr-placeholder");
    if (!slot) return;
    slot.innerHTML = "";
    slot.classList.add("qr-placeholder--filled");
    var img = new Image();
    img.src = canvas.toDataURL("image/png");
    img.alt = "QR code that saves the contact when scanned";
    slot.appendChild(img);
  }

  // ---------------------------------------------------------------------------
  // 4. Helpers: a safe file name from the contact's name, and a generic
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
  // 5. Wire up the form. "Generate card" now produces the .vcf and a QR .png,
  //    and updates the preview. The PDF and the PDF-only/all-files toggle plug
  //    into this next.
  // ---------------------------------------------------------------------------
  function handleSubmit(event) {
    event.preventDefault();

    var data = readForm();
    if (!data.displayName) {
      window.alert("Please enter a name before generating the card.");
      return;
    }

    var vcard = buildVCard(data);
    var base = safeBaseName(data.displayName);

    downloadText(base + ".vcf", vcard, "text/vcard;charset=utf-8");

    var canvas = drawQrToCanvas(buildQrModel(vcard));
    renderPreviewQr(canvas);
    canvas.toBlob(function (blob) {
      downloadBlob(base + "_QR.png", blob);
    }, "image/png");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("card-form");
    if (form) form.addEventListener("submit", handleSubmit);
    console.log("Contact Card Builder: vCard + QR ready.");
  });

  // Expose for later steps (PDF) and quick console testing.
  window.ContactCard = {
    readForm: readForm,
    buildVCard: buildVCard,
    buildQrModel: buildQrModel,
    drawQrToCanvas: drawQrToCanvas,
    safeBaseName: safeBaseName,
    downloadText: downloadText,
    downloadBlob: downloadBlob,
  };
})();
