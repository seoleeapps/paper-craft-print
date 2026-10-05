export type Pattern =
  "plain" | "dots" | "stripes" | "grid" | "waves" | "stars" | "diamonds";
export const FREE: Pattern[] = ["plain", "dots", "stripes", "grid"];
export const PATTERNS: Pattern[] = [...FREE, "waves", "stars", "diamonds"];
export type Face = {
  text: string;
  photo?: {
    uri: string;
    width: number;
    height: number;
    zoom: number;
    x: number;
    y: number;
  };
};
export type CraftProject = {
  id: string;
  name: string;
  width: number;
  height: number;
  tab: number;
  pattern: Pattern;
  front: Face;
  back: Face;
  updatedAt: number;
};
export type Rect = { x: number; y: number; width: number; height: number };
export type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "cut" | "fold";
};
export type EnvelopeGeometry = {
  width: number;
  height: number;
  front: Rect;
  back: Rect;
  glue: Rect[];
  lines: Line[];
};
export type PageLayout = {
  width: number;
  height: number;
  rotated: boolean;
  copies: number;
  placements: { x: number; y: number }[];
  geometry: EnvelopeGeometry;
};
export interface ProjectRepository {
  list(): Promise<CraftProject[]>;
  save(p: CraftProject): Promise<void>;
  remove(id: string): Promise<void>;
  grant(id: string, pattern: Pattern, eventId: string): Promise<void>;
  rights(id: string): Promise<Pattern[]>;
}
export interface ExportPort {
  create(
    project: CraftProject,
    paper: "A4" | "Letter",
    repeat: boolean,
  ): Promise<string>;
}
export interface RewardPort {
  unlock(projectId: string, pattern: Pattern): Promise<void>;
}
export function createProject(id: string, now = Date.now()): CraftProject {
  return {
    id,
    name: "",
    width: 80,
    height: 120,
    tab: 10,
    pattern: "plain",
    front: { text: "" },
    back: { text: "" },
    updatedAt: now,
  };
}
export function geometry(
  width: number,
  height: number,
  tab = 10,
): EnvelopeGeometry {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 40 ||
    width > 85 ||
    height < 60 ||
    height > 160 ||
    tab !== 10
  )
    throw new Error("SIZE");
  const w = width * 2 + tab,
    h = height + tab * 2;
  const cuts: [number, number, number, number][] = [
    [0, tab, width, tab],
    [width, tab, width, 0],
    [width, 0, width * 2, 0],
    [width * 2, 0, width * 2, tab],
    [width * 2, tab, w, tab],
    [w, tab, w, tab + height],
    [w, tab + height, width * 2, tab + height],
    [width * 2, tab + height, width * 2, h],
    [width * 2, h, width, h],
    [width, h, width, tab + height],
    [width, tab + height, 0, tab + height],
    [0, tab + height, 0, tab],
  ];
  const folds: [number, number, number, number][] = [
    [width, tab, width, tab + height],
    [width, tab, width * 2, tab],
    [width, tab + height, width * 2, tab + height],
    [width * 2, tab, width * 2, tab + height],
  ];
  return {
    width: w,
    height: h,
    front: { x: 0, y: tab, width, height },
    back: { x: width, y: tab, width, height },
    glue: [
      { x: width * 2, y: tab, width: tab, height },
      { x: width, y: tab + height, width, height: tab },
    ],
    lines: [
      ...cuts.map(([x1, y1, x2, y2]) => ({
        x1,
        y1,
        x2,
        y2,
        kind: "cut" as const,
      })),
      ...folds.map(([x1, y1, x2, y2]) => ({
        x1,
        y1,
        x2,
        y2,
        kind: "fold" as const,
      })),
    ],
  };
}
export function layout(
  p: Pick<CraftProject, "width" | "height" | "tab">,
  paper: "A4" | "Letter",
  repeat = false,
): PageLayout {
  const g = geometry(p.width, p.height, p.tab);
  const [width, height] = paper === "A4" ? [210, 297] : [215.9, 279.4];
  // Reserve 18 mm below each net for labels and the calibration line.
  const choices = [false, true].map((rotated) => {
    const w = rotated ? g.height : g.width,
      h = (rotated ? g.width : g.height) + 18;
    return {
      rotated,
      w,
      h,
      cols: Math.floor((width - 20) / (w + 4)),
      rows: Math.floor((height - 20) / (h + 4)),
    };
  });
  const best = choices.sort((a, b) => b.cols * b.rows - a.cols * a.rows)[0];
  if (best.cols * best.rows < 1) throw new Error("DOES_NOT_FIT");
  const count = repeat ? best.cols * best.rows : 1;
  return {
    width,
    height,
    rotated: best.rotated,
    copies: count,
    geometry: g,
    placements: Array.from({ length: count }, (_, i) => ({
      x: 10 + (i % best.cols) * (best.w + 4),
      y: 10 + Math.floor(i / best.cols) * (best.h + 4),
    })),
  };
}
export function photoCrop(
  photo: NonNullable<Face["photo"]>,
  width: number,
  height: number,
): Rect {
  const ratio = width / height;
  const baseW = Math.min(photo.width, photo.height * ratio),
    baseH = baseW / ratio;
  const zoom = Math.max(1, Math.min(4, photo.zoom));
  const w = baseW / zoom,
    h = baseH / zoom;
  return {
    x: Math.round((photo.width - w) * Math.max(0, Math.min(1, photo.x))),
    y: Math.round((photo.height - h) * Math.max(0, Math.min(1, photo.y))),
    width: Math.max(1, Math.floor(w)),
    height: Math.max(1, Math.floor(h)),
  };
}
export function textError(
  text: string,
  faceWidth: number,
  measure: (s: string) => number,
  supports: (s: string) => boolean,
): "length" | "glyph" | "width" | null {
  if (Array.from(text).length > 30) return "length";
  if (!supports(text)) return "glyph";
  if (measure(text) > faceWidth - 8) return "width";
  return null;
}

export type PatternMark =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "dot"; x: number; y: number; r: number };
export function patternMarks(pattern: Pattern, r: Rect): PatternMark[] {
  const marks: PatternMark[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    marks.push({ kind: "line", x1, y1, x2, y2 });
  for (let y = 5; y < r.height - 3; y += 8)
    for (let x = 5; x < r.width - 3; x += 8) {
      const px = r.x + x,
        py = r.y + y;
      switch (pattern) {
        case "dots":
          marks.push({ kind: "dot", x: px, y: py, r: 0.5 });
          break;
        case "grid":
          line(px - 3, py, px + 3, py);
          line(px, py - 3, px, py + 3);
          break;
        case "stripes":
          line(px - 3, py - 3, px + 3, py + 3);
          break;
        case "diamonds":
          line(px, py - 2, px + 2, py);
          line(px + 2, py, px, py + 2);
          line(px, py + 2, px - 2, py);
          line(px - 2, py, px, py - 2);
          break;
        case "stars":
          line(px - 2, py, px + 2, py);
          line(px, py - 2, px, py + 2);
          line(px - 1.5, py - 1.5, px + 1.5, py + 1.5);
          break;
        case "waves":
          line(px - 3, py, px, py - 2);
          line(px, py - 2, px + 3, py);
          break;
      }
    }
  return marks;
}
