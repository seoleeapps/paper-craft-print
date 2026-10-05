import { test } from "node:test";
import assert from "node:assert/strict";
import {
  geometry,
  layout,
  createProject,
  photoCrop,
  textError,
} from "../src/index";
test("80×120 unfolded net is exactly 170×140 mm", () => {
  const g = geometry(80, 120);
  assert.equal(g.width, 170);
  assert.equal(g.height, 140);
  assert.equal(g.lines.filter((l) => l.kind === "fold").length, 4);
});
test("all supported dimensions fit paper without scale and within safety margin", () => {
  for (const paper of ["A4", "Letter"] as const)
    for (const width of [40, 60, 80, 85])
      for (const height of [60, 90, 120, 150, 160]) {
        const l = layout({ ...createProject("a"), width, height }, paper, true);
        for (const p of l.placements) {
          assert.ok(p.x >= 10 && p.y >= 10);
          assert.ok(
            p.x + (l.rotated ? l.geometry.height : l.geometry.width) <=
              l.width - 10,
          );
          assert.ok(
            p.y + (l.rotated ? l.geometry.width : l.geometry.height) + 18 <=
              l.height - 10,
          );
        }
      }
});
test("reject invalid sizes", () => {
  for (const v of [NaN, 39, 86, Infinity])
    assert.throws(() => geometry(v, 120));
  assert.throws(() => geometry(80, 161));
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
