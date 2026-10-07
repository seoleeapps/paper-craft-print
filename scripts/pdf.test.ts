import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { makePDF, MM } from "../apps/mobile/src/pdf-engine";
import {
  createProject,
  TEMPLATE_KINDS,
} from "../packages/product-core/src/index";
const font = new Uint8Array(
  readFileSync("apps/mobile/assets/fonts/CraftSans.ttf"),
);
test("A4 and Letter PDF physical dimensions and embedded Korean text for every template", async () => {
  mkdirSync("artifacts/pdf", { recursive: true });
  for (const kind of TEMPLATE_KINDS)
    for (const paper of ["A4", "Letter"] as const) {
      const p = createProject("qa", kind);
      p.front.text = "작은 선물";
      p.back.text = "Made with love";
      const bytes = await makePDF(p, paper, true, { font });
      const doc = await PDFDocument.load(bytes);
      const size = doc.getPages()[0].getSize();
      assert.ok(
        Math.abs(size.width / MM - (paper === "A4" ? 210 : 215.9)) < 0.001,
      );
      assert.ok(
        Math.abs(size.height / MM - (paper === "A4" ? 297 : 279.4)) < 0.001,
      );
      // Envelope samples keep their original names referenced by docs/qa.md.
      const name = kind === "envelope" ? paper : `${kind}-${paper}`;
      writeFileSync(`artifacts/pdf/${name}.pdf`, bytes);
    }
});
test("PDF rejects unsupported emoji and overflow before writing", async () => {
  const p = createProject("qa");
  p.front.text = "😀";
  await assert.rejects(makePDF(p, "A4", false, { font }), /TEXT:glyph/);
  p.front.text = "W".repeat(30);
  await assert.rejects(makePDF(p, "A4", false, { font }), /TEXT:width/);
  const box = createProject("qa", "tuckBox");
  box.width = 30;
  box.back.text = "W".repeat(10);
  await assert.rejects(makePDF(box, "A4", false, { font }), /TEXT:width/);
});
