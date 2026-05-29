import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = String(pkg.version || "").trim();

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error("package.json version must use x.y.z format");
}

const buildNumber = String(pkg.iosBuildNumber || version.split(".").at(-1)).trim();
if (!/^\d+$/.test(buildNumber)) {
  throw new Error("package.json iosBuildNumber must be a numeric string when provided");
}
const projectPath = join(root, "ios/App/App.xcodeproj/project.pbxproj");
let project = await readFile(projectPath, "utf8");

project = project
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`);

await writeFile(join(root, "app-meta.js"), `window.APP_VERSION = ${JSON.stringify(version)};\n`);
await writeFile(projectPath, project);

console.log(`Synced app version ${version} (build ${buildNumber})`);
