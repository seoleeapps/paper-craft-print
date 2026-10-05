import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
for (const paper of ["A4", "Letter"]) {
  const path = `artifacts/pdf/${paper}.pdf`;
  const text = execFileSync("pdftotext", [path, "-"], { encoding: "utf8" });
  assert.ok(text.replace(/\s/g, "").includes("작은선물"));
  assert.ok(text.includes("Made with love"));
  assert.ok(text.includes("100%") && text.includes("50 mm"));
  execFileSync("pdftocairo", ["-svg", path, `artifacts/pdf/${paper}.svg`]);
  const svg = readFileSync(`artifacts/pdf/${paper}.svg`, "utf8");
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
    `${paper}: Korean, English, calibration text, 50 mm vector line verified`,
  );
}
