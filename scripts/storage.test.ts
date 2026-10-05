import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  SCHEMA,
  SAVE_PROJECT,
  GRANT_PATTERN,
  COPY_RIGHTS,
} from "../apps/mobile/src/storage-schema";
test("reward transaction survives restart; duplicate callbacks cannot pay twice; copy retains rights; delete cascades", () => {
  const dir = mkdtempSync(join(tmpdir(), "paper-craft-test-")),
    path = join(dir, "test.db");
  let db = new DatabaseSync(path);
  try {
    db.exec(SCHEMA);
    db.prepare(SAVE_PROJECT).run("started-project", "{}");
    db.prepare(SAVE_PROJECT).run("other-project", "{}");
    db.exec("BEGIN");
    db.prepare(GRANT_PATTERN).run("started-project", "stars", "event-1");
    db.prepare(GRANT_PATTERN).run("started-project", "stars", "event-1");
    db.exec("COMMIT");
    db.close();
    db = new DatabaseSync(path);
    db.exec(SCHEMA);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM rights").get()!.n, 1);
    assert.equal(
      db
        .prepare("SELECT COUNT(*) n FROM rights WHERE project=?")
        .get("other-project")!.n,
      0,
    );
    db.prepare(SAVE_PROJECT).run("copy", "{}");
    db.prepare(COPY_RIGHTS).run("copy", "copy-event-", "started-project");
    assert.equal(
      db.prepare("SELECT COUNT(*) n FROM rights WHERE project=?").get("copy")!
        .n,
      1,
    );
    db.prepare("DELETE FROM projects WHERE id=?").run("started-project");
    assert.equal(
      db
        .prepare("SELECT COUNT(*) n FROM rights WHERE project=?")
        .get("started-project")!.n,
      0,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) n FROM rights WHERE project=?").get("copy")!
        .n,
      1,
    );
  } finally {
    db.close();
    rmSync(dir, { recursive: true });
  }
});
test("failed reward transaction rolls back", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(SCHEMA);
    db.prepare(SAVE_PROJECT).run("project", "{}");
    db.exec("BEGIN");
    db.prepare(GRANT_PATTERN).run("project", "waves", "event");
    assert.throws(() =>
      db.prepare(GRANT_PATTERN).run("missing", "stars", "other"),
    );
    db.exec("ROLLBACK");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM rights").get()!.n, 0);
  } finally {
    db.close();
  }
});
