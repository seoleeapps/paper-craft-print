// The real PDF engine with browser file and OS boundaries for development QA.
import { Asset } from "expo-asset";
import {
  CraftProject,
  Face,
  Rect,
  net,
  photoCrop,
  FREE,
} from "@paper-craft/product-core";
import { makePDF } from "./pdf-engine";
import { repository } from "./storage";
async function crop(face: Face, r: Rect): Promise<Uint8Array | undefined> {
  if (!face.photo) return;
  const img = new Image();
  img.src = face.photo.uri;
  await img.decode();
  const area = photoCrop(face.photo, r.width, r.height),
    canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  canvas
    .getContext("2d")!
    .drawImage(
      img,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      area.width,
      area.height,
    );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PHOTO"))),
      "image/jpeg",
      0.92,
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}
export async function exportPDF(
  p: CraftProject,
  paper: "A4" | "Letter",
  repeat: boolean,
) {
  if (
    !FREE.includes(p.pattern) &&
    !(await repository.rights(p.id)).includes(p.pattern)
  )
    throw new Error("PATTERN_LOCKED");
  const asset = Asset.fromModule(require("../assets/fonts/CraftSans.ttf"));
  await asset.downloadAsync();
  const g = net(p);
  const [font, front, back] = await Promise.all([
    fetch(asset.localUri ?? asset.uri)
      .then((r) => r.arrayBuffer())
      .then((b) => new Uint8Array(b)),
    crop(p.front, g.faces.front),
    crop(p.back, g.faces.back),
  ]);
  const bytes = await makePDF(p, paper, repeat, { font, front, back });
  return URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
  );
}
export async function saveExternal(uri: string) {
  const a = document.createElement("a");
  a.href = uri;
  a.download = "Paper-Craft.pdf";
  a.click();
  return true;
}
export async function sharePDF(_uri: string) {
  /* Native share sheet is outside RN Web QA. */
}
export async function printPDF(_uri: string) {
  /* Native print dialog is outside RN Web QA. */
}
