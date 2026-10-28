import { createWriteStream } from "node:fs";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";

function run(command: string, args: string[]) { return new Promise<void>((resolve, reject) => { const child = spawn(command, args, { stdio: "ignore" }); child.on("error", reject); child.on("close", code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))); }); }

export async function checkoutArchive(repository: string, commit: string, token?: string): Promise<{ root: string; workspace: string }> {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error("Invalid GitHub repository");
  const root = await mkdtemp(join(tmpdir(), "orqestra-run-"));
  const archive = join(root, "source.tar.gz");
  const response = await fetch(`https://api.github.com/repos/${repository}/tarball/${commit}`, { headers: { accept: "application/vnd.github+json", ...(token ? { authorization: `Bearer ${token}` } : {}), "user-agent": "orqestra-sandbox" } });
  if (!response.ok || !response.body) throw new Error(`Repository archive failed (${response.status})`);
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(archive, { mode: 0o600 }));
  await run("tar", ["-xzf", archive, "-C", root]);
  const directory = (await readdir(root, { withFileTypes: true })).find(entry => entry.isDirectory());
  if (!directory) throw new Error("Repository archive was empty");
  return { root, workspace: join(root, directory.name) };
}
