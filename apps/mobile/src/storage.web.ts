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
function read(): Store {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : empty();
}
function change(fn: (store: Store) => void) {
  const store = read();
  fn(store);
  localStorage.setItem(KEY, JSON.stringify(store));
}
export async function initialize() {
  read();
}
export const repository: ProjectRepository = {
  async list() {
    return Object.values(read().projects)
      .map(normalizeProject)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async save(p) {
    change((s) => {
      s.projects[p.id] = p;
    });
  },
  async remove(id) {
    change((s) => {
      delete s.projects[id];
      delete s.rights[id];
    });
  },
  async grant(id, pattern, event) {
    change((s) => {
      if (!s.projects[id]) throw new Error("DRAFT_MISSING");
      if (s.events.includes(event)) return;
      s.events.push(event);
      s.rights[id] = [...new Set([...(s.rights[id] ?? []), pattern])];
    });
  },
  async rights(id) {
    return read().rights[id] ?? [];
  },
};
export async function duplicate(p: CraftProject, id: string) {
  const copy = { ...p, id, updatedAt: Date.now() };
  change((s) => {
    s.projects[id] = copy;
    s.rights[id] = [...(s.rights[p.id] ?? [])];
  });
  return copy;
}
export async function setting(key: string, value?: string) {
  if (value !== undefined)
    change((s) => {
      s.settings[key] = value;
    });
  return read().settings[key];
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
  /* Photos belong to the serialized draft; no separate files. */
}
