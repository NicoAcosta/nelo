/**
 * Patch @mlightcad/data-model to fix ESM/CJS compatibility.
 *
 * The verb-nurbs-web dependency bundled inside data-model uses an IIFE
 * pattern `(function(){ var s = this; ... })()` to capture the global
 * object. In ESM strict mode, `this` is `undefined`, causing
 * `x.ArrayBuffer` to throw "Cannot read properties of undefined".
 *
 * This script replaces `this` with `globalThis` in that specific IIFE.
 * Run as a postinstall hook so it survives `npm install`.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("..", import.meta.url).pathname;
const files = [
  {
    path: join(ROOT, "node_modules/@mlightcad/data-model/dist/data-model.js"),
    old: "var e = {}, s = this;",
    new: "var e = {}, s = globalThis;",
  },
  {
    path: join(ROOT, "node_modules/@mlightcad/data-model/dist/data-model.cjs"),
    old: "var e={},s=this",
    new: "var e={},s=globalThis",
  },
];

let patched = 0;
for (const f of files) {
  try {
    const code = readFileSync(f.path, "utf8");
    if (code.includes(f.new)) {
      console.log(`[patch-mlightcad] Already patched: ${f.path}`);
      continue;
    }
    if (code.includes(f.old)) {
      writeFileSync(f.path, code.replace(f.old, f.new));
      console.log(`[patch-mlightcad] Patched: ${f.path}`);
      patched++;
    } else {
      console.warn(`[patch-mlightcad] Pattern not found: ${f.path}`);
    }
  } catch (err) {
    // Package not installed — skip silently
    if (err.code === "ENOENT") continue;
    throw err;
  }
}

console.log(`[patch-mlightcad] Done (${patched} file(s) patched)`);
