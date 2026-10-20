import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
for (const name of [
  "A4",
  "Letter",
  "tuckBox-A4",
  "tuckBox-Letter",
  "card-A4",
  "card-Letter",
  "giftTag-A4",
  "giftTag-Letter",
  "bookmark-A4",
  "bookmark-Letter",
  "paperBag-A4",
  "paperBag-Letter",
]) {
  const path = `artifacts/pdf/${name}.pdf`;
  const text = execFileSync("pdftotext", [path, "-"], { encoding: "utf8" });
  assert.ok(text.replace(/\s/g, "").includes("작은선물"));
  assert.ok(text.includes("Made with love"));
  assert.ok(text.includes("100%") && text.includes("50 mm"));
  execFileSync("pdftocairo", ["-svg", path, `artifacts/pdf/${name}.svg`]);
  const svg = readFileSync(`artifacts/pdf/${name}.svg`, "utf8");
  const lines = [
    ...svg.matchAll(
      /<path[^>]*stroke-width="0.7"[^>]*d="M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) /g,
    ),
  ];
  assert.ok(
    lines.some(
      (m) => Math.abs((Number(m[3]) - Number(m[1])) / (72 / 25.4) - 50) < 0.01,
    ),
  );
  console.log(
    `${name}: Korean, English, calibration text, 50 mm vector line verified`,
  );
}
