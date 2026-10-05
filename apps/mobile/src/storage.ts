import * as SQLite from "expo-sqlite";
import {
  SCHEMA,
  SAVE_PROJECT,
  GRANT_PATTERN,
  COPY_RIGHTS,
} from "./storage-schema";
import { Directory, File, Paths } from "expo-file-system";
import {
  CraftProject,
  Pattern,
  ProjectRepository,
} from "@paper-craft/product-core";
export const files = new Directory(Paths.document, "craft");
files.create({ idempotent: true, intermediates: true });
const db = SQLite.openDatabaseAsync("craft.db");
export async function initialize() {
  await (await db).execAsync(SCHEMA);
  await cleanup();
}
// Serialize writes so a slow autosave cannot replace a newer edit.
let writes = Promise.resolve();
function write<T>(fn: () => Promise<T>): Promise<T> {
  const next = writes.then(fn);
  writes = next.then(
    () => {},
    () => {},
  );
  return next;
}
export const repository: ProjectRepository = {
  async list() {
    await writes;
    return (
      await (
        await db
      ).getAllAsync<{ data: string }>("SELECT data FROM projects")
    )
      .map((r) => JSON.parse(r.data) as CraftProject)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  save(p) {
    const snapshot = JSON.stringify(p);
    return write(async () => {
      await (await db).runAsync(SAVE_PROJECT, p.id, snapshot);
    });
  },
  remove(id) {
    return write(async () => {
      await (await db).runAsync("DELETE FROM projects WHERE id=?", id);
    });
  },
  grant(id, pattern, eventId) {
    return write(async () => {
      const d = await db;
      await d.withTransactionAsync(async () => {
        await d.runAsync(GRANT_PATTERN, id, pattern, eventId);
      });
    });
  },
  async rights(id) {
    await writes;
    return (
      await (
        await db
      ).getAllAsync<{ pattern: Pattern }>(
        "SELECT pattern FROM rights WHERE project=?",
        id,
      )
    ).map((r) => r.pattern);
  },
};
export async function duplicate(p: CraftProject, id: string) {
  return write(async () => {
    const d = await db;
    const copy = {
      ...p,
      id,
      name: p.name ? `${p.name} · copy` : "",
      updatedAt: Date.now(),
    };
    await d.withTransactionAsync(async () => {
      await d.runAsync(
        "INSERT INTO projects VALUES(?,?)",
        id,
        JSON.stringify(copy),
      );
      await d.runAsync(COPY_RIGHTS, id, `copy-${id}-`, p.id);
    });
    return copy;
  });
}
export async function setting(key: string, value?: string) {
  if (value !== undefined)
    await write(async () => {
      await (
        await db
      ).runAsync(
        "INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        key,
        value,
      );
    });
  await writes;
  return (
    await (
      await db
    ).getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key=?",
      key,
    )
  )?.value;
}
export function persistPhoto(uri: string) {
  const target = new File(
    files,
    `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
  );
  new File(uri).copy(target);
  return target.uri;
}
export async function cleanup() {
  const ps = await repository.list();
  const used = new Set(
    ps.flatMap((p) => [p.front.photo?.uri, p.back.photo?.uri]).filter(Boolean),
  );
  for (const file of files.list())
    if (
      file instanceof File &&
      file.name.startsWith("photo-") &&
      !used.has(file.uri)
    )
      file.delete();
}
