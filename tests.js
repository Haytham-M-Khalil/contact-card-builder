// =============================================================================
//  Contact Card Builder — tests
//  ---------------------------------------------------------------------------
//  Open tests.html in a browser to run these. No toolchain: a tiny runner
//  below, then the tests, which call the app through window.ContactCard.
//
//  To add a test: pick a group (or start one with `group("...")`), then
//    test("what it checks", function () { assertEqual(actual, expected); });
// =============================================================================

(function () {
  "use strict";

  var CC = window.ContactCard;
  var groups = [];

  // ---------------------------------------------------------------------------
  // 1. A tiny test runner.
  // ---------------------------------------------------------------------------

  function group(name) {
    groups.push({ name: name, tests: [] });
  }

  function test(name, fn) {
    groups[groups.length - 1].tests.push({ name: name, fn: fn });
  }

  // Values are compared as JSON, so arrays and objects work too, and hidden
  // characters (like the vCard's \r\n line endings) show up in a failure.
  function assertEqual(actual, expected, note) {
    var a = JSON.stringify(actual);
    var e = JSON.stringify(expected);
    if (a !== e) {
      throw new Error((note ? note + "\n" : "") + "expected: " + e + "\n  actual: " + a);
    }
  }

  function assertTrue(value, note) { assertEqual(value, true, note); }
  function assertFalse(value, note) { assertEqual(value, false, note); }

  // ---------------------------------------------------------------------------
  // 2. Sample data, shaped like readForm() returns it.
  // ---------------------------------------------------------------------------

  function sampleCard(overrides) {
    var data = {
      displayName: "Robin Doe",
      givenName: "Robin",
      familyName: "Doe",
      title: "Product Designer",
      company: "Maple & Moss Studio",
      phones: [
        { label: "Mobile", number: "+1 555 0188" },
        { label: "Work", number: "+1 555 0123" },
      ],
      email: "robin.doe@example.com",
      links: ["robindoe.com"],
      linksInVCard: true,
      accent: "#732da0",
      size: "us",
      sheet: false,
    };
    Object.keys(overrides || {}).forEach(function (key) { data[key] = overrides[key]; });
    return data;
  }

  // Lay a card out the way the app does: vCard -> QR -> layout.
  function layout(data, lang) {
    var qr = CC.buildQrModel(CC.buildVCard(data));
    return CC.layoutCard(data, lang || "en", qr);
  }

  // ---------------------------------------------------------------------------
  // 3. The tests.
  // ---------------------------------------------------------------------------

  group("escapeVCard — special characters in vCard values");

  test("plain text is unchanged", function () {
    assertEqual(CC.escapeVCard("Robin Doe"), "Robin Doe");
  });
  test("a comma is escaped", function () {
    assertEqual(CC.escapeVCard("Doe, Robin"), "Doe\\, Robin");
  });
  test("a semicolon is escaped", function () {
    assertEqual(CC.escapeVCard("R&D; Design"), "R&D\\; Design");
  });
  test("a backslash is escaped", function () {
    assertEqual(CC.escapeVCard("a\\b"), "a\\\\b");
  });
  test("a newline becomes \\n", function () {
    assertEqual(CC.escapeVCard("line one\nline two"), "line one\\nline two");
  });
  test("backslashes are escaped first, so escapes aren't doubled", function () {
    assertEqual(CC.escapeVCard("a\\,b"), "a\\\\\\,b");
  });
  test("Arabic text is unchanged", function () {
    assertEqual(CC.escapeVCard("روبن دو"), "روبن دو");
  });
  test("a number becomes text", function () {
    assertEqual(CC.escapeVCard(42), "42");
  });

  group("normalizeUrl — links open as real web addresses");

  test("adds https:// to a bare domain", function () {
    assertEqual(CC.normalizeUrl("robindoe.com"), "https://robindoe.com");
  });
  test("adds https:// to a domain with a path", function () {
    assertEqual(CC.normalizeUrl("linkedin.com/in/robindoe"), "https://linkedin.com/in/robindoe");
  });
  test("keeps https://", function () {
    assertEqual(CC.normalizeUrl("https://robindoe.com"), "https://robindoe.com");
  });
  test("keeps http://", function () {
    assertEqual(CC.normalizeUrl("http://robindoe.com"), "http://robindoe.com");
  });
  test("keeps an uppercase scheme", function () {
    assertEqual(CC.normalizeUrl("HTTPS://ROBINDOE.COM"), "HTTPS://ROBINDOE.COM");
  });

  group("containsArabic — picks the Arabic font");

  test("Latin text: no", function () {
    assertFalse(CC.containsArabic("Robin Doe"));
  });
  test("empty text: no", function () {
    assertFalse(CC.containsArabic(""));
  });
  test("a phone number: no", function () {
    assertFalse(CC.containsArabic("+1 555 0188"));
  });
  test("Arabic text: yes", function () {
    assertTrue(CC.containsArabic("روبن دو"));
  });
  test("Latin with one Arabic word: yes", function () {
    assertTrue(CC.containsArabic("Robin روبن"));
  });
  test("Arabic-Indic digits: yes", function () {
    assertTrue(CC.containsArabic("٠١٢٣"));
  });
  test("Arabic Supplement letters (U+0750 block): yes", function () {
    assertTrue(CC.containsArabic("ݐ"));
  });
  test("presentation forms, as printed in the PDF (U+FB50 and U+FE70 blocks): yes", function () {
    assertTrue(CC.containsArabic("ﭐ"));
    assertTrue(CC.containsArabic("ﻻ"));
  });

  group("buildVCard — the .vcf text, also what the QR holds");

  test("a full card, line by line", function () {
    assertEqual(CC.buildVCard(sampleCard()), [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Doe;Robin;;;",
      "FN:Robin Doe",
      "TITLE:Product Designer",
      "ORG:Maple & Moss Studio",
      "TEL;type=CELL:+1 555 0188",
      "TEL;type=CELL:+1 555 0123",
      "EMAIL;type=INTERNET:robin.doe@example.com",
      "URL:https://robindoe.com",
      "END:VCARD",
      "",
    ].join("\r\n"));
  });
  test("name only: empty fields are left out", function () {
    var data = sampleCard({ displayName: "Robin", givenName: "Robin", familyName: "",
                            title: "", company: "", phones: [], email: "", links: [] });
    assertEqual(CC.buildVCard(data),
      "BEGIN:VCARD\r\nVERSION:3.0\r\nN:;Robin;;;\r\nFN:Robin\r\nEND:VCARD\r\n");
  });
  test("every line ends with \\r\\n, including the last", function () {
    var text = CC.buildVCard(sampleCard());
    assertEqual(text.replace(/\r\n/g, "").indexOf("\n"), -1, "a bare \\n was found");
    assertEqual(text.slice(-2), "\r\n");
  });
  test("phone labels stay off the TEL lines (plain TEL for max compatibility)", function () {
    var text = CC.buildVCard(sampleCard());
    assertEqual(text.indexOf("Mobile"), -1);
    assertEqual(text.indexOf("Work"), -1);
  });
  test("a semicolon in the company stays part of the name", function () {
    var text = CC.buildVCard(sampleCard({ company: "Maple; Moss" }));
    assertTrue(text.indexOf("\r\nORG:Maple\\; Moss\r\n") !== -1);
  });
  test("a comma in the name is escaped in N and FN", function () {
    var data = sampleCard({ displayName: "Robin Doe, PhD", givenName: "Robin Doe,", familyName: "PhD" });
    var text = CC.buildVCard(data);
    assertTrue(text.indexOf("\r\nN:PhD;Robin Doe\\,;;;\r\n") !== -1, "N line");
    assertTrue(text.indexOf("\r\nFN:Robin Doe\\, PhD\r\n") !== -1, "FN line");
  });
  test("links get https:// in the vCard", function () {
    var text = CC.buildVCard(sampleCard({ links: ["robindoe.com", "http://old.example.com"] }));
    assertTrue(text.indexOf("\r\nURL:https://robindoe.com\r\n") !== -1);
    assertTrue(text.indexOf("\r\nURL:http://old.example.com\r\n") !== -1);
  });
  test("links in QR unticked: no URL lines", function () {
    var text = CC.buildVCard(sampleCard({ linksInVCard: false }));
    assertEqual(text.indexOf("URL:"), -1);
  });
  test("Arabic name and title pass through as they are", function () {
    var data = sampleCard({ displayName: "روبن دو", givenName: "روبن", familyName: "دو",
                            title: "مصمم منتجات" });
    var text = CC.buildVCard(data);
    assertTrue(text.indexOf("\r\nN:دو;روبن;;;\r\n") !== -1, "N line");
    assertTrue(text.indexOf("\r\nTITLE:مصمم منتجات\r\n") !== -1, "TITLE line");
  });

  group("layoutCard + qrScanCheck — the card fits and the QR scans");

  test("the sample card fits, US and EU, English and Arabic", function () {
    ["us", "eu"].forEach(function (size) {
      ["en", "ar"].forEach(function (lang) {
        assertTrue(layout(sampleCard({ size: size }), lang).fits, size + " / " + lang);
      });
    });
  });
  test("the sample card's QR scans, US and EU", function () {
    ["us", "eu"].forEach(function (size) {
      assertEqual(CC.qrScanCheck(layout(sampleCard({ size: size }))), "ok", size);
    });
  });
  test("the card is exactly card-sized, in points", function () {
    var us = layout(sampleCard({ size: "us" }));
    var eu = layout(sampleCard({ size: "eu" }));
    assertEqual([us.w, us.h], [252, 144], "US 3.5 x 2 in");
    assertEqual([eu.w, eu.h], [240.945, 155.906], "EU 85 x 55 mm");
  });
  test("too many lines: doesn't fit", function () {
    var phones = [];
    for (var i = 0; i < 9; i++) phones.push({ label: "Mobile", number: "+1 555 010" + i });
    assertFalse(layout(sampleCard({ phones: phones })).fits);
  });
  test("a very long email runs into the QR: doesn't fit", function () {
    var email = "robin.doe.product.design.department@maple-and-moss-studio.example.com";
    assertFalse(layout(sampleCard({ email: email })).fits);
  });
  test("many links in the QR: too dense to scan", function () {
    var links = ["robindoe.com", "linkedin.com/in/robindoe", "github.com/robindoe",
                 "instagram.com/robindoe", "behance.net/robindoe"];
    assertEqual(CC.qrScanCheck(layout(sampleCard({ links: links }))), "dense");
  });
  test("the same links, unticked from the QR: scans again", function () {
    var links = ["robindoe.com", "linkedin.com/in/robindoe", "github.com/robindoe",
                 "instagram.com/robindoe", "behance.net/robindoe"];
    var data = sampleCard({ links: links, linksInVCard: false });
    assertEqual(CC.qrScanCheck(layout(data)), "ok");
  });
  test("no QR at all (data too big): too-big", function () {
    assertEqual(CC.qrScanCheck(CC.layoutCard(sampleCard(), "en", null)), "too-big");
  });

  group("File names");

  test("the timestamp is local time, zero-padded, with no colons", function () {
    assertEqual(CC.fileTimestamp(new Date(2026, 10, 4, 9, 2, 5)), "2026-11-04_09-02-05");
  });
  test("PDF names for one card and for a full sheet, in both languages", function () {
    var stamp = "2026-11-14_10-32-05";
    assertEqual(CC.pdfFileName({ size: "us", sheet: false }, "en", stamp),
                "card_US_EN_2026-11-14_10-32-05.pdf");
    assertEqual(CC.pdfFileName({ size: "eu", sheet: false }, "ar", stamp),
                "card_EU_AR_2026-11-14_10-32-05.pdf");
    assertEqual(CC.pdfFileName({ size: "us", sheet: true }, "en", stamp),
                "card-sheet_US-Letter_EN_2026-11-14_10-32-05.pdf");
    assertEqual(CC.pdfFileName({ size: "eu", sheet: true }, "ar", stamp),
                "card-sheet_EU-A4_AR_2026-11-14_10-32-05.pdf");
  });

  // ---------------------------------------------------------------------------
  // 4. Run everything and show the results.
  // ---------------------------------------------------------------------------

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function run() {
    var passed = 0, failed = 0;
    var out = document.getElementById("results");

    groups.forEach(function (g) {
      var section = el("section");
      section.appendChild(el("h2", null, g.name));
      var list = el("ul");
      g.tests.forEach(function (tc) {
        var item = el("li", "pass");
        var mark = el("span", "mark", "PASS");
        item.appendChild(mark);
        item.appendChild(document.createTextNode(" " + tc.name));
        try {
          tc.fn();
          passed++;
        } catch (err) {
          failed++;
          item.className = "fail";
          mark.textContent = "FAIL";
          item.appendChild(el("pre", null, err && err.message ? err.message : String(err)));
          if (window.console) console.error("FAIL: " + tc.name, err);
        }
        list.appendChild(item);
      });
      section.appendChild(list);
      out.appendChild(section);
    });

    var summary = document.getElementById("summary");
    summary.textContent = failed
      ? failed + " failed, " + passed + " passed"
      : "All " + passed + " tests passed";
    summary.className = failed ? "fail" : "pass";
    document.title = (failed ? "✘ " : "✔ ") + "Contact Card Builder tests";
  }

  if (!CC) {
    document.getElementById("summary").textContent =
      "app.js didn't load (window.ContactCard is missing), so no tests ran.";
    document.getElementById("summary").className = "fail";
    return;
  }
  run();
})();
