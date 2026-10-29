import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AGENTS.md declares the current sandbox version and milestone protocol", async () => {
  const guide = await readFile("AGENTS.md", "utf8");
  const manifest = JSON.parse(await readFile("package.json", "utf8")) as { version: string };
  assert.match(guide, new RegExp(`^- Sandbox version: ${manifest.version.replace(/\./g, "\\.")}$`, "m"));
  assert.match(guide, /^## Milestone update protocol$/m);
  assert.match(guide, /Do not use, request, reproduce, translate, or derive from any employer-proprietary/);
});
