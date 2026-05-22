import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = String(pkg.version || "").trim();

if (!version) {
  throw new Error("package.json version is empty");
}

await writeFile(join(root, "app-meta.js"), `window.APP_VERSION = ${JSON.stringify(version)};\n`);
console.log(`Synced app version ${version}`);
