import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const suiteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(suiteRoot, "dist");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(join(suiteRoot, "survey", "dist"), join(outputRoot, "survey"), { recursive: true });
await cp(join(suiteRoot, "dashboard", "dist"), join(outputRoot, "dashboard"), { recursive: true });

await writeFile(
  join(outputRoot, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0E3386" />
    <meta http-equiv="refresh" content="0; url=./survey/" />
    <title>Chicago Cubs Retail Experience V2</title>
  </head>
  <body style="margin:0;background:#0E3386;color:#fff;font:16px system-ui;display:grid;min-height:100vh;place-items:center">
    <main style="text-align:center;padding:2rem">
      <p>Opening the Chicago Cubs Retail Survey V2…</p>
      <p><a href="./survey/" style="color:#FFFFFF">Open survey</a> · <a href="./dashboard/" style="color:#FFFFFF">Open dashboard</a></p>
    </main>
  </body>
</html>`,
  "utf8",
);

console.log(`Assembled Chicago Cubs V2 suite in ${outputRoot}`);
