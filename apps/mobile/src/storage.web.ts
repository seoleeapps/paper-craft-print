import {
  CraftProject,
  Pattern,
  ProjectRepository,
  normalizeProject,
} from "@paper-craft/product-core";
const KEY = "paper-craft-print.dev.v1";
type Store = {
  projects: Record<string, CraftProject>;
  rights: Record<string, Pattern[]>;
  events: string[];
  settings: Record<string, string>;
};
const empty = (): Store => ({
  projects: {},
  rights: {},
  events: [],
  settings: {},
});
// IndexedDB keeps development photo drafts durable without localStorage's small quota.
const database = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("paper-craft-print.dev", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("data");
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
});
async function read(): Promise<Store> {
  const db = await database;
  return new Promise((resolve, reject) => {
    const request = db.transaction("data").objectStore("data").get("store");
    request.onsuccess = () => resolve(request.result ?? empty());
    request.onerror = () => reject(request.error);
  });
}
async function save(store: Store) {
  const db = await database;
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("data", "readwrite");
    transaction.objectStore("data").put(store, "store");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("STORAGE_ABORTED"));
  });
}
let writes = Promise.resolve();
function change(fn: (store: Store) => void): Promise<void> {
  const next = writes.then(async () => {
    const store = await read();
    fn(store);
    await save(store);
  });
  writes = next.catch(() => {});
  return next;
}
export async function initialize() {
  // Import earlier web drafts and isolated QA fixtures once; native SQLite is unchanged.
  const previous = localStorage.getItem(KEY);
  if (previous) {
    await save(JSON.parse(previous));
    localStorage.removeItem(KEY);
  }
  await read();
}
export const repository: ProjectRepository = {
  async list() {
    await writes;
    return Object.values((await read()).projects)
      .map(normalizeProject)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async save(p) {
    const snapshot = structuredClone(p);
    await change((s) => {
      s.projects[p.id] = snapshot;
    });
  },
  async remove(id) {
    await change((s) => {
      delete s.projects[id];
      delete s.rights[id];
    });
  },
  async grant(id, pattern, event) {
    await change((s) => {
      if (!s.projects[id]) throw new Error("DRAFT_MISSING");
      if (s.events.includes(event)) return;
      s.events.push(event);
      s.rights[id] = [...new Set([...(s.rights[id] ?? []), pattern])];
    });
  },
  async rights(id) {
    await writes;
    return (await read()).rights[id] ?? [];
  },
};
export async function duplicate(p: CraftProject, id: string) {
  const copy = { ...p, id, updatedAt: Date.now() };
  await change((s) => {
    s.projects[id] = copy;
    s.rights[id] = [...(s.rights[p.id] ?? [])];
  });
  return copy;
}
export async function setting(key: string, value?: string) {
  if (value !== undefined)
    await change((s) => {
      s.settings[key] = value;
    });
  await writes;
  return (await read()).settings[key];
}
export async function persistPhoto(uri: string) {
  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export async function cleanup() {
  /* Draft deletion also releases its unreferenced embedded photos. */
}
