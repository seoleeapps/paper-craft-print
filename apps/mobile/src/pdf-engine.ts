import { PDFDocument, rgb, degrees, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  CraftProject,
  layout,
  net,
  Rect,
  textError,
  patternMarks,
} from "@paper-craft/product-core";
export const MM = 72 / 25.4;
export function validateText(project: CraftProject, font: PDFFont) {
  const { faces } = net(project);
  return (["front", "back"] as const).map((face) =>
    textError(
      project[face].text,
      faces[face].width,
      (s) => font.widthOfTextAtSize(s, 11) / MM,
      (s) =>
        Array.from(s).every((c) =>
          font.getCharacterSet().includes(c.codePointAt(0)!),
        ),
    ),
  );
}
export type PdfInputs = {
  font: Uint8Array;
  front?: Uint8Array;
  back?: Uint8Array;
};
export async function makePDF(
  p: CraftProject,
  paper: "A4" | "Letter",
  repeat: boolean,
  input: PdfInputs,
) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(input.font, { subset: false });
  const errors = validateText(p, font);
  if (errors.some(Boolean)) throw new Error(`TEXT:${errors.find(Boolean)}`);
  const l = layout(p, paper, repeat),
    g = l.net;
  const page = doc.addPage([l.width * MM, l.height * MM]);
  const images = await Promise.all(
    [input.front, input.back].map((b) => (b ? doc.embedJpg(b) : undefined)),
  );
  const ink = rgb(0.18, 0.25, 0.25),
    accent = rgb(0.52, 0.65, 0.63),
    paperColor = rgb(0.96, 0.94, 0.88);
  for (const pos of l.placements) {
    const transform = (x: number, y: number) =>
      l.rotated
        ? { x: (pos.x + g.height - y) * MM, y: (l.height - pos.y - x) * MM }
        : { x: (pos.x + x) * MM, y: (l.height - pos.y - y) * MM };
    const line = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      dash = false,
      color = ink,
    ) => {
      const a = transform(x1, y1),
        b = transform(x2, y2);
      page.drawLine({
        start: a,
        end: b,
        thickness: 0.5,
        color,
        dashArray: dash ? [3, 2] : undefined,
      });
    };
    const rect = (r: Rect, color = paperColor) => {
      const a = transform(r.x, r.y + r.height);
      page.drawRectangle({
        x: a.x,
        y: a.y,
        width: r.width * MM,
        height: r.height * MM,
        rotate: degrees(l.rotated ? -90 : 0),
        color,
      });
    };
    const text = (s: string, x: number, y: number, size = 8) => {
      const a = transform(x, y);
      page.drawText(s, {
        x: a.x,
        y: a.y,
        font,
        size,
        rotate: degrees(l.rotated ? -90 : 0),
        color: ink,
      });
    };
    const pattern = (r: Rect) => {
      rect(r);
      for (const mark of patternMarks(p.pattern, r)) {
        if (mark.kind === "line")
          line(mark.x1, mark.y1, mark.x2, mark.y2, false, accent);
        else {
          const a = transform(mark.x, mark.y);
          page.drawCircle({
            x: a.x,
            y: a.y,
            size: mark.r * MM,
            color: accent,
          });
        }
      }
    };
    for (const r of g.panels) pattern(r);
    for (const [index, r] of [g.faces.front, g.faces.back].entries()) {
      if (images[index]) {
        rect(r);
        const a = transform(r.x, r.y + r.height);
        page.drawImage(images[index]!, {
          x: a.x,
          y: a.y,
          width: r.width * MM,
          height: r.height * MM,
          rotate: degrees(l.rotated ? -90 : 0),
        });
      } else pattern(r);
      const label = index === 0 ? p.front.text : p.back.text;
      if (label) {
        rect(
          {
            x: r.x + 3,
            y: r.y + r.height - 15,
            width: r.width - 6,
            height: 12,
          },
          rgb(1, 1, 1),
        );
        text(
          label,
          r.x + (r.width - font.widthOfTextAtSize(label, 11) / MM) / 2,
          r.y + r.height - 7,
          11,
        );
      }
    }
    for (const r of g.glue) {
      rect(r, rgb(0.9, 0.92, 0.9));
      for (let y = 0; y < r.height; y += 3)
        line(
          r.x,
          r.y + y,
          Math.min(r.x + r.width, r.x + 3),
          Math.min(r.y + r.height, r.y + y + 3),
          false,
          accent,
        );
      text(
        r.width <= 10 ? "G" : "GLUE",
        r.x + 2,
        r.y + Math.min(r.height - 2, 6),
        6,
      );
    }
    for (const ln of g.lines)
      line(ln.x1, ln.y1, ln.x2, ln.y2, ln.kind === "fold");
    const bottom = pos.y + (l.rotated ? g.width : g.height);
    page.drawText("Cut ━  Fold - -  Glue ///  ·  Print at 100%", {
      x: pos.x * MM,
      y: (l.height - bottom - 5) * MM,
      font,
      size: 7,
      color: ink,
    });
    page.drawLine({
      start: { x: pos.x * MM, y: (l.height - bottom - 11) * MM },
      end: { x: (pos.x + 50) * MM, y: (l.height - bottom - 11) * MM },
      thickness: 0.7,
      color: ink,
    });
    page.drawText("50 mm", {
      x: (pos.x + 52) * MM,
      y: (l.height - bottom - 12) * MM,
      font,
      size: 7,
      color: ink,
    });
  }
  doc.setTitle("Paper Craft Print");
  doc.setProducer("Paper Craft Print");
  return doc.save();
}
