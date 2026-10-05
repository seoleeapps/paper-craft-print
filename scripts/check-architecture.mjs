import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      check(path);
      continue;
    }
    if (!/\.tsx?$/.test(path)) continue;
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g,
    )) {
      if (!match[1].startsWith("./") && !match[1].startsWith("../"))
        throw Error(`Core external dependency: ${path}: ${match[1]}`);
    }
    if (/\b(fetch|XMLHttpRequest|window|document)\b/.test(source))
      throw Error(`Core platform global: ${path}`);
  }
}
check("packages/product-core/src");
console.log("Core platform dependency boundary passed");
