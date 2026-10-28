import { rm } from "node:fs/promises";
import { checkoutArchive } from "./checkout.js";
import { LocalDockerExecutor } from "./docker-executor.js";
import type { Job } from "./jobs.js";

const baseUrl = process.env.SANDBOX_URL ?? "http://127.0.0.1:8787";
const workerToken = process.env.SANDBOX_WORKER_TOKEN;
const image = process.env.EXECUTOR_IMAGE;
if (!workerToken || !image) throw new Error("SANDBOX_WORKER_TOKEN and digest-pinned EXECUTOR_IMAGE are required");
const executor = new LocalDockerExecutor(image);

async function request(path: string, init: RequestInit = {}) { return fetch(`${baseUrl}${path}`, { ...init, headers: { authorization: `Bearer ${workerToken}`, "content-type": "application/json", ...init.headers } }); }

for (;;) {
  const response = await request("/v1/jobs/next");
  if (!response.ok) throw new Error(`Worker lease failed (${response.status})`);
  const job = await response.json() as Job | null;
  if (!job) { await new Promise(resolve => setTimeout(resolve, 1000)); continue; }
  let root: string | undefined;
  try {
    const checkout = await checkoutArchive(job.request.repository, job.request.commit, job.request.repositoryToken ?? process.env.GITHUB_TOKEN);
    root = checkout.root;
    const result = await executor.execute(job.request, checkout.workspace);
    await request(`/v1/runs/${encodeURIComponent(job.request.runId)}/complete`, { method: "POST", body: JSON.stringify(result) });
  } catch (error) {
    await request(`/v1/runs/${encodeURIComponent(job.request.runId)}/complete`, { method: "POST", body: JSON.stringify({ passed: false, exitCode: 1, summary: error instanceof Error ? error.message : "Worker failed" }) });
  } finally { if (root) await rm(root, { recursive: true, force: true }); }
}
