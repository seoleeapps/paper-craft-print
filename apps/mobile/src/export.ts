import { Asset } from "expo-asset";
import { File, Directory } from "expo-file-system";
import * as Manipulator from "expo-image-manipulator";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { CraftProject, Face, photoCrop, FREE } from "@paper-craft/product-core";
import { makePDF } from "./pdf-engine";
import { files, repository } from "./storage";
async function crop(face: Face, p: CraftProject) {
  if (!face.photo) return undefined;
  const context = Manipulator.ImageManipulator.manipulate(face.photo.uri);
  context.crop({
    originX: photoCrop(face.photo, p.width, p.height).x,
    originY: photoCrop(face.photo, p.width, p.height).y,
    width: photoCrop(face.photo, p.width, p.height).width,
    height: photoCrop(face.photo, p.width, p.height).height,
  });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: Manipulator.SaveFormat.JPEG,
    compress: 0.92,
  });
  return new File(result.uri).bytes();
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
  const [font, front, back] = await Promise.all([
    new File(asset.localUri!).bytes(),
    crop(p.front, p),
    crop(p.back, p),
  ]);
  const bytes = await makePDF(p, paper, repeat, { font, front, back });
  const file = new File(files, `${p.id}-${Date.now()}.pdf`);
  file.create();
  file.write(bytes);
  if (!file.exists || file.size === 0) throw new Error("PDF_MISSING");
  return file.uri;
}
export const sharePDF = (uri: string) =>
  Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
  });
export const printPDF = (uri: string) => Print.printAsync({ uri });
export async function saveExternal(uri: string) {
  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("cancelled by the user")
    )
      return false;
    throw error;
  }
  const source = new File(uri);
  const data = await source.bytes();
  const target = directory.createFile(
    `Paper-Craft-${Date.now()}.pdf`,
    "application/pdf",
  );
  target.write(data);
  const verified = await target.bytes();
  if (
    !target.exists ||
    verified.length !== data.length ||
    verified.some((byte, i) => byte !== data[i])
  )
    throw new Error("EXTERNAL_SAVE_VERIFY");
  return true;
}
