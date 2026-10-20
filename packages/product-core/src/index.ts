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
export type TemplateKind =
  "envelope" | "tuckBox" | "card" | "giftTag" | "bookmark" | "paperBag";
export const TEMPLATE_KINDS: TemplateKind[] = [
  "envelope",
  "tuckBox",
  "card",
  "giftTag",
  "bookmark",
  "paperBag",
];
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
// Half-fold card printed on one side: back cover | front cover, folded in the
// middle so the blank inside is left for a handwritten message.
function cardNet({ width: W, height: H }: Size): Net {
  return {
    width: W * 2,
    height: H,
    faces: {
      back: { x: 0, y: 0, width: W, height: H },
      front: { x: W, y: 0, width: W, height: H },
    },
    panels: [],
    glue: [],
    lines: lines(
      [
        [0, 0, W * 2, 0],
        [W * 2, 0, W * 2, H],
        [W * 2, H, 0, H],
        [0, H, 0, 0],
      ],
      [[W, 0, W, H]],
    ),
  };
}
// Four body panels with a side seam, inward top rim and overlapping bottom flaps.
function paperBagNet({ width: W, height: H, depth: D }: Size): Net {
  const a = 10,
    b = a + W,
    c = b + D,
    d = c + W,
    e = d + D;
  const rim = 10,
    bottom = rim + H,
    h = bottom + D,
    sideBottom = bottom + D / 2;
  const outline: [number, number][] = [
    [0, 0],
    [e, 0],
    [e, sideBottom],
    [d, sideBottom],
    [d, h],
    [c, h],
    [c, sideBottom],
    [b, sideBottom],
    [b, h],
    [a, h],
    [a, bottom],
    [0, bottom],
    [0, 0],
  ];
  return {
    width: e,
    height: h,
    faces: {
      front: { x: a, y: rim, width: W, height: H },
      back: { x: c, y: rim, width: W, height: H },
    },
    panels: [
      { x: b, y: rim, width: D, height: H },
      { x: d, y: rim, width: D, height: H },
      { x: a, y: 0, width: e - a, height: rim },
      { x: a, y: bottom, width: W, height: D },
      { x: b, y: bottom, width: D, height: D / 2 },
      { x: c, y: bottom, width: W, height: D },
      { x: d, y: bottom, width: D, height: D / 2 },
    ],
    glue: [
      { x: 0, y: 0, width: a, height: bottom },
      { x: a + 2, y: bottom + D / 2, width: W - 4, height: D / 2 - 2 },
      { x: a + 2, y: 1, width: e - a - 4, height: rim - 2 },
    ],
    lines: lines(
      outline.slice(1).map((pt, i) => [...outline[i], ...pt] as Segment),
      [
        ...[a, b, c, d].map((x) => [x, 0, x, bottom] as Segment),
        [a, rim, e, rim],
        [a, bottom, e, bottom],
        [b + D / 2, rim, b + D / 2, bottom],
        [d + D / 2, rim, d + D / 2, bottom],
      ],
    ),
  };
}
export const ASSEMBLY: Record<
  TemplateKind,
  { en: string; ko: string; pdf: string }
> = {
  envelope: {
    en: "Cut, fold the sides, glue the side tab and bottom. Leave the top open.",
    ko: "자르고 옆면을 접은 뒤 옆 탭과 바닥을 붙이세요. 윗부분은 열어 두세요.",
    pdf: "Fold sides; glue seam and bottom. Leave top open.",
  },
  tuckBox: {
    en: "Cut and fold. Glue the side tab, fold the small flaps in, then tuck the lids.",
    ko: "자르고 접어 옆 탭을 붙이세요. 작은 날개를 안으로 접고 뚜껑을 끼우세요.",
    pdf: "Glue side seam. Fold small flaps in; tuck lids.",
  },
  card: {
    en: "Cut the outline and fold the middle with the printed covers outside. Write inside.",
    ko: "테두리를 자르고 인쇄면이 바깥으로 오게 가운데를 접으세요. 안쪽에 손글씨를 쓰세요.",
    pdf: "Fold center with print outside. Write inside.",
  },
  giftTag: {
    en: "Cut and fold with print outside. Glue the entire blank backs together. Punch a hole after drying if needed.",
    ko: "자르고 인쇄면이 바깥으로 오게 접어 빈 뒷면 전체를 붙이세요. 마르면 필요에 따라 구멍을 뚫으세요.",
    pdf: "Fold print out; glue entire blank backs together.",
  },
  bookmark: {
    en: "Cut and fold with print outside. Glue the entire blank backs together and press flat to dry.",
    ko: "자르고 인쇄면이 바깥으로 오게 접어 빈 뒷면 전체를 붙이세요. 납작하게 눌러 말리세요.",
    pdf: "Fold print out; glue entire blank backs. Press flat.",
  },
  paperBag: {
    en: "Glue the side seam, fold the rim inward and glue. Fold small bottom flaps in, then overlap and glue large flaps. No handles.",
    ko: "옆 탭을 붙이고 윗단을 안으로 접어 붙이세요. 바닥의 작은 날개를 접고 큰 날개를 겹쳐 붙이세요. 손잡이는 없어요.",
    pdf: "Glue seam and inward rim. Fold small base flaps; glue large flaps.",
  },
};
export type TemplateSpec = {
  // Input order shown in the editor; omitted dimensions are unused.
  dims: Dimension[];
  limits: Partial<Record<Dimension, [number, number]>>;
  presets: Size[];
  defaults: Size;
  // Usable inside space, in the same order as `dims`, for containers.
  inside?(size: Size): number[];
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
  giftTag: {
    dims: ["width", "height"],
    limits: { width: [30, 70], height: [40, 100] },
    presets: [
      { width: 35, height: 50, depth: 0 },
      { width: 45, height: 65, depth: 0 },
      { width: 60, height: 80, depth: 0 },
    ],
    defaults: { width: 45, height: 65, depth: 0 },
    net: cardNet,
  },
  bookmark: {
    dims: ["width", "height"],
    limits: { width: [25, 60], height: [90, 200] },
    presets: [
      { width: 30, height: 120, depth: 0 },
      { width: 40, height: 150, depth: 0 },
      { width: 50, height: 180, depth: 0 },
    ],
    defaults: { width: 40, height: 150, depth: 0 },
    net: cardNet,
  },
  paperBag: {
    dims: ["width", "depth", "height"],
    limits: { width: [30, 80], depth: [15, 40], height: [40, 150] },
    presets: [
      { width: 40, depth: 20, height: 60 },
      { width: 50, depth: 25, height: 85 },
      { width: 60, depth: 25, height: 110 },
    ],
    defaults: { width: 50, depth: 25, height: 85 },
    inside: ({ width, depth, height }) => [width, depth, height],
    net: paperBagNet,
  },
  card: {
    dims: ["width", "height"],
    limits: { width: [40, 100], height: [50, 140] },
    // Folded sizes that slip into the envelope presets.
    presets: [
      { width: 50, height: 70, depth: 0 },
      { width: 70, height: 100, depth: 0 },
      { width: 75, height: 130, depth: 0 },
    ],
    defaults: { width: 70, height: 100, depth: 0 },
    net: cardNet,
  },
};
// The smallest envelope preset whose inner space holds a folded card.
export function envelopeFor({ width, height }: Size): Size | undefined {
  const envelope = TEMPLATES.envelope;
  return envelope.presets.find((preset) => {
    const [w, h] = envelope.inside!(preset);
    return width <= w && height <= h;
  });
}
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
  // Reserve assembly guidance below the net and enough width for the 50 mm line.
  const choices = [false, true].map((rotated) => {
    const w = Math.max(65, rotated ? g.height : g.width),
      h = (rotated ? g.width : g.height) + 24;
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
