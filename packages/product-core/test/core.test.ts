import { test } from "node:test";
import assert from "node:assert/strict";
import {
  net,
  layout,
  createProject,
  normalizeProject,
  envelopeFor,
  photoCrop,
  sizeError,
  textError,
  TEMPLATES,
  TEMPLATE_KINDS,
  Line,
} from "../src/index";
const envelope = (width: number, height: number) => ({
  ...createProject("a"),
  width,
  height,
});
const box = (width: number, depth: number, height: number) => ({
  ...createProject("a", "tuckBox"),
  width,
  depth,
  height,
});
// Every cut endpoint must be shared by an even number of cut segments, so the
// cut lines form closed outlines without loose ends.
function assertClosed(lines: Line[]) {
  const ends = new Map<string, number>();
  for (const l of lines.filter((l) => l.kind === "cut"))
    for (const key of [`${l.x1},${l.y1}`, `${l.x2},${l.y2}`])
      ends.set(key, (ends.get(key) ?? 0) + 1);
  for (const [key, count] of ends) assert.equal(count % 2, 0, key);
}
test("80×120 unfolded net is exactly 170×140 mm", () => {
  const g = net(envelope(80, 120));
  assert.equal(g.width, 170);
  assert.equal(g.height, 140);
  assert.equal(g.lines.filter((l) => l.kind === "fold").length, 4);
  assertClosed(g.lines);
});
test("all supported envelope dimensions fit paper without scale and within safety margin", () => {
  for (const paper of ["A4", "Letter"] as const)
    for (const width of [40, 60, 80, 85])
      for (const height of [60, 90, 120, 150, 160]) {
        const l = layout(envelope(width, height), paper, true);
        for (const p of l.placements) {
          assert.ok(p.x >= 10 && p.y >= 10);
          assert.ok(
            p.x + (l.rotated ? l.net.height : l.net.width) <= l.width - 10,
          );
          assert.ok(
            p.y + (l.rotated ? l.net.width : l.net.height) + 18 <=
              l.height - 10,
          );
        }
      }
});
test("reject invalid envelope sizes", () => {
  for (const v of [NaN, 39, 86, Infinity])
    assert.throws(() => net(envelope(v, 120)));
  assert.throws(() => net(envelope(80, 161)));
});
test("50×50×50 tuck box unfolds to glue + 2 faces + 2 sides by body + 2 closures", () => {
  const g = net(box(50, 50, 50));
  assert.equal(g.width, 10 + 50 * 2 + 50 * 2);
  assert.equal(g.height, 50 + 2 * (50 + 15));
  assert.equal(g.lines.filter((l) => l.kind === "fold").length, 12);
  assert.deepEqual(g.faces.front, { x: 10, y: 65, width: 50, height: 50 });
  assert.deepEqual(g.faces.back, { x: 110, y: 65, width: 50, height: 50 });
  assert.equal(g.panels.length, 4);
  assertClosed(g.lines);
});
test("tuck box lines stay inside the net for every limit corner", () => {
  const { limits } = TEMPLATES.tuckBox;
  for (const width of limits.width!)
    for (const depth of limits.depth!)
      for (const height of limits.height!) {
        const g = net(box(width, depth, height));
        assertClosed(g.lines);
        for (const l of g.lines)
          for (const [x, y] of [
            [l.x1, l.y1],
            [l.x2, l.y2],
          ])
            assert.ok(x >= 0 && x <= g.width && y >= 0 && y <= g.height);
      }
});
test("every preset fits A4 and Letter", () => {
  for (const kind of TEMPLATE_KINDS)
    for (const preset of TEMPLATES[kind].presets) {
      const p = { ...createProject("a", kind), ...preset };
      assert.equal(sizeError(p), null, `${kind} ${JSON.stringify(preset)}`);
      assert.equal(sizeError({ ...p, ...TEMPLATES[kind].defaults }), null);
    }
});
test("size errors separate out-of-range from too large for paper", () => {
  assert.equal(sizeError(box(29, 40, 40)), "range");
  assert.equal(sizeError(box(90, 60, 120)), "does_not_fit");
  assert.throws(() => net(box(50, 61, 50)), /SIZE/);
});
test("70×100 folded card unfolds to 140×100 with one center fold", () => {
  const g = net({ ...createProject("a", "card"), width: 70, height: 100 });
  assert.equal(g.width, 140);
  assert.equal(g.height, 100);
  assert.deepEqual(
    g.lines.filter((l) => l.kind === "fold"),
    [{ x1: 70, y1: 0, x2: 70, y2: 100, kind: "fold" }],
  );
  assert.deepEqual(g.faces.front, { x: 70, y: 0, width: 70, height: 100 });
  assertClosed(g.lines);
});
test("each card preset slips into the matching envelope preset", () => {
  const cards = TEMPLATES.card.presets,
    envelopes = TEMPLATES.envelope.presets;
  cards.forEach((card, i) => assert.deepEqual(envelopeFor(card), envelopes[i]));
  assert.equal(envelopeFor({ width: 100, height: 140, depth: 0 }), undefined);
});
test("drafts saved before templates open as envelopes", () => {
  const legacy = {
    id: "old",
    name: "",
    width: 60,
    height: 90,
    tab: 10,
    pattern: "dots",
    front: { text: "hi" },
    back: { text: "" },
    updatedAt: 1,
  };
  const p = normalizeProject(legacy);
  assert.equal(p.kind, "envelope");
  assert.equal(p.width, 60);
  assert.ok(!("tab" in p));
  assert.equal(sizeError(p), null);
  assert.equal(normalizeProject(box(40, 30, 60)).depth, 30);
});
test("crop stays in image at edge and zoom limits", () => {
  for (const x of [0, 1])
    for (const y of [0, 1])
      for (const zoom of [1, 4]) {
        const r = photoCrop(
          { uri: "a", width: 600, height: 1000, zoom, x, y },
          80,
          120,
        );
        assert.ok(
          r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.width <= 600 &&
            r.y + r.height <= 1000,
        );
      }
});
test("text rejects unsupported glyphs and measured overflow", () => {
  assert.equal(
    textError(
      "가".repeat(31),
      80,
      () => 1,
      () => true,
    ),
    "length",
  );
  assert.equal(
    textError(
      "😀",
      80,
      () => 1,
      () => false,
    ),
    "glyph",
  );
  assert.equal(
    textError(
      "wide",
      40,
      () => 33,
      () => true,
    ),
    "width",
  );
});
test("six free templates include fold-and-glue tag, bookmark and handleless bag", () => {
  assert.deepEqual(TEMPLATE_KINDS, [
    "envelope",
    "tuckBox",
    "card",
    "giftTag",
    "bookmark",
    "paperBag",
  ]);
  for (const kind of ["giftTag", "bookmark"] as const) {
    const p = createProject("fold", kind),
      g = net(p);
    assert.equal(g.width, p.width * 2);
    assert.equal(g.height, p.height);
    assert.equal(g.faces.back.x, 0);
    assert.equal(g.faces.front.x, p.width);
    assertClosed(g.lines);
  }
  const p = createProject("bag", "paperBag"),
    g = net(p);
  assert.equal(g.width, 10 + 2 * (p.width + p.depth));
  assert.ok(g.glue.length >= 3);
  assertClosed(g.lines);
});
test("every template has closed cuts and repeat placements including labels stay on paper", () => {
  for (const kind of TEMPLATE_KINDS) {
    const spec = TEMPLATES[kind];
    for (const width of spec.limits.width!)
      for (const height of spec.limits.height!)
        for (const depth of spec.limits.depth ?? [0]) {
          const p = { ...createProject("limits", kind), width, height, depth };
          const g = net(p);
          assertClosed(g.lines);
          for (const l of g.lines)
            for (const [x, y] of [
              [l.x1, l.y1],
              [l.x2, l.y2],
            ])
              assert.ok(
                x >= 0 && x <= g.width && y >= 0 && y <= g.height,
                kind,
              );
          if (sizeError(p)) continue;
          for (const paper of ["A4", "Letter"] as const) {
            const l = layout(p, paper, true);
            for (const pos of l.placements) {
              assert.ok(
                pos.x + Math.max(65, l.rotated ? g.height : g.width) <=
                  l.width - 10,
              );
              assert.ok(
                pos.y + (l.rotated ? g.width : g.height) + 24 <= l.height - 10,
              );
            }
          }
        }
  }
});
