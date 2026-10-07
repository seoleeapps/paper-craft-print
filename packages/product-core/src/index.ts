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
export type TemplateKind = "envelope" | "tuckBox";
export const TEMPLATE_KINDS: TemplateKind[] = ["envelope", "tuckBox"];
export type Dimension = "width" | "height" | "depth";
export type Size = Record<Dimension, number>;
export type CraftProject = Size & {
  id: string;
  kind: TemplateKind;
  name: string;
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
export type Net = {
  width: number;
  height: number;
  // Faces carry the user's photo and note; panels only show the pattern.
  faces: Record<"front" | "back", Rect>;
  panels: Rect[];
  glue: Rect[];
  lines: Line[];
};
export type PageLayout = {
  width: number;
  height: number;
  rotated: boolean;
  copies: number;
  placements: { x: number; y: number }[];
  net: Net;
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
type Segment = [number, number, number, number];
function lines(cuts: Segment[], folds: Segment[]): Line[] {
  const of =
    (kind: Line["kind"]) =>
    ([x1, y1, x2, y2]: Segment) => ({
      x1,
      y1,
      x2,
      y2,
      kind,
    });
  return [...cuts.map(of("cut")), ...folds.map(of("fold"))];
}
const ENVELOPE_TAB = 10;
function envelopeNet({ width, height }: Size): Net {
  const tab = ENVELOPE_TAB,
    w = width * 2 + tab,
    h = height + tab * 2;
  return {
    width: w,
    height: h,
    faces: {
      front: { x: 0, y: tab, width, height },
      back: { x: width, y: tab, width, height },
    },
    panels: [],
    glue: [
      { x: width * 2, y: tab, width: tab, height },
      { x: width, y: tab + height, width, height: tab },
    ],
    lines: lines(
      [
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
      ],
      [
        [width, tab, width, tab + height],
        [width, tab, width * 2, tab],
        [width, tab + height, width * 2, tab + height],
        [width * 2, tab, width * 2, tab + height],
      ],
    ),
  };
}
const BOX_GLUE = 10;
// Straight tuck end box: glue | front | side | back | side, with the lid and
// the bottom both hinged on the back panel and dust flaps on the sides.
function tuckBoxNet({ width: W, height: H, depth: D }: Size): Net {
  const G = BOX_GLUE,
    tuck = Math.min(15, Math.round(D * 0.6)),
    dust = Math.min(20, Math.round(W * 0.4)),
    dustInset = Math.min(D / 3, dust * 0.6),
    tuckInset = Math.min(tuck, W / 4);
  const a = G,
    b = a + W,
    c = b + D,
    d = c + W,
    e = d + D;
  const top = tuck + D,
    bottom = top + H,
    h = bottom + D + tuck;
  // Mirror a segment drawn above the body to the matching one below it.
  const below = ([x1, y1, x2, y2]: Segment): Segment => [
    x1,
    top + bottom - y1,
    x2,
    top + bottom - y2,
  ];
  const dustFlap = (x0: number, x1: number): Segment[] => [
    [x0, top, x0 + dustInset, top - dust],
    [x0 + dustInset, top - dust, x1 - dustInset, top - dust],
    [x1 - dustInset, top - dust, x1, top],
  ];
  const closureCuts: Segment[] = [
    [a, top, b, top],
    ...dustFlap(b, c),
    [c, top, c, tuck],
    [c, tuck, c + tuckInset, 0],
    [c + tuckInset, 0, d - tuckInset, 0],
    [d - tuckInset, 0, d, tuck],
    [d, tuck, d, top],
    ...dustFlap(d, e),
  ];
  const closureFolds: Segment[] = [
    [b, top, c, top],
    [c, top, d, top],
    [c, tuck, d, tuck],
    [d, top, e, top],
  ];
  return {
    width: e,
    height: h,
    faces: {
      front: { x: a, y: top, width: W, height: H },
      back: { x: c, y: top, width: W, height: H },
    },
    panels: [
      { x: b, y: top, width: D, height: H },
      { x: d, y: top, width: D, height: H },
      { x: c, y: tuck, width: W, height: D },
      { x: c, y: bottom, width: W, height: D },
    ],
    glue: [{ x: 0, y: top + 2, width: G, height: H - 4 }],
    lines: lines(
      [
        [a, top, 0, top + 2],
        [0, top + 2, 0, bottom - 2],
        [0, bottom - 2, a, bottom],
        [e, top, e, bottom],
        ...closureCuts,
        ...closureCuts.map(below),
      ],
      [
        [a, top, a, bottom],
        [b, top, b, bottom],
        [c, top, c, bottom],
        [d, top, d, bottom],
        ...closureFolds,
        ...closureFolds.map(below),
      ],
    ),
  };
}
export type TemplateSpec = {
  // Input order shown in the editor; omitted dimensions are unused.
  dims: Dimension[];
  limits: Partial<Record<Dimension, [number, number]>>;
  presets: Size[];
  defaults: Size;
  // Usable inside space, in the same order as `dims`.
  inside(size: Size): number[];
  net(size: Size): Net;
};
export const TEMPLATES: Record<TemplateKind, TemplateSpec> = {
  envelope: {
    dims: ["width", "height"],
    limits: { width: [40, 85], height: [60, 160] },
    presets: [
      { width: 60, height: 90, depth: 0 },
      { width: 80, height: 120, depth: 0 },
      { width: 85, height: 150, depth: 0 },
    ],
    defaults: { width: 80, height: 120, depth: 0 },
    inside: ({ width, height }) => [
      width - ENVELOPE_TAB,
      height - 2 * ENVELOPE_TAB,
    ],
    net: envelopeNet,
  },
  tuckBox: {
    dims: ["width", "depth", "height"],
    limits: { width: [30, 90], depth: [15, 60], height: [30, 120] },
    presets: [
      { width: 40, depth: 40, height: 40 },
      { width: 50, depth: 50, height: 50 },
      { width: 60, depth: 30, height: 90 },
    ],
    defaults: { width: 50, depth: 50, height: 50 },
    inside: ({ width, depth, height }) => [width, depth, height],
    net: tuckBoxNet,
  },
};
export function createProject(
  id: string,
  kind: TemplateKind = "envelope",
  now = Date.now(),
): CraftProject {
  return {
    id,
    kind,
    name: "",
    ...TEMPLATES[kind].defaults,
    pattern: "plain",
    front: { text: "" },
    back: { text: "" },
    updatedAt: now,
  };
}
// Drafts saved before templates existed have no kind and carry a `tab` field.
export function normalizeProject(raw: unknown): CraftProject {
  const { tab: _tab, ...p } = raw as Partial<CraftProject> & { tab?: number };
  const kind = p.kind && TEMPLATE_KINDS.includes(p.kind) ? p.kind : "envelope";
  return { ...TEMPLATES[kind].defaults, ...p, kind } as CraftProject;
}
function inRange(p: Pick<CraftProject, Dimension | "kind">) {
  const spec = TEMPLATES[p.kind];
  return spec.dims.every((dim) => {
    const [min, max] = spec.limits[dim]!;
    return Number.isFinite(p[dim]) && p[dim] >= min && p[dim] <= max;
  });
}
export function net(p: Pick<CraftProject, Dimension | "kind">): Net {
  if (!inRange(p)) throw new Error("SIZE");
  return TEMPLATES[p.kind].net(p);
}
export const sizeLabel = (p: Pick<CraftProject, Dimension | "kind">) =>
  TEMPLATES[p.kind].dims.map((dim) => p[dim]).join(" × ");
export function layout(
  p: Pick<CraftProject, Dimension | "kind">,
  paper: "A4" | "Letter",
  repeat = false,
): PageLayout {
  const g = net(p);
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
    net: g,
    placements: Array.from({ length: count }, (_, i) => ({
      x: 10 + (i % best.cols) * (best.w + 4),
      y: 10 + Math.floor(i / best.cols) * (best.h + 4),
    })),
  };
}
export function sizeError(
  p: Pick<CraftProject, Dimension | "kind">,
): "range" | "does_not_fit" | null {
  if (!inRange(p)) return "range";
  try {
    for (const paper of ["A4", "Letter"] as const) layout(p, paper);
  } catch {
    return "does_not_fit";
  }
  return null;
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
