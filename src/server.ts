import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { JobStore } from "./jobs.js";
import { validateRequest, type SandboxRequest } from "./policy.js";

function authorized(request: IncomingMessage, token: string) { const value = request.headers.authorization; if (!value?.startsWith("Bearer ") || !token) return false; return timingSafeEqual(createHash("sha256").update(token).digest(), createHash("sha256").update(value.slice(7)).digest()); }
function json(response: ServerResponse, status: number, value?: unknown) { response.writeHead(status, value === undefined ? undefined : { "content-type": "application/json" }); response.end(value === undefined ? undefined : JSON.stringify(value)); }
function redacted(value: ReturnType<JobStore["get"]>) { if (!value) return value; const { repositoryToken: _secret, ...request } = value.request; return { ...value, request }; }
async function readJson(request: IncomingMessage) { const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }

export function createSandboxServer(options: { token: string; workerToken: string; signingSecret: string }) {
  const jobs = new JobStore(options.signingSecret);
  return createServer(async (request, response) => {
    try {
      const workerRoute = request.url === "/v1/jobs/next" || request.url?.endsWith("/complete");
      if (!authorized(request, workerRoute ? options.workerToken : options.token)) return json(response, 401);
      if (request.method === "GET" && request.url === "/v1/jobs/next") return json(response, 200, jobs.leaseAccepted() ?? null);
      if (request.method === "POST" && request.url === "/v1/runs") { const input = await readJson(request) as SandboxRequest; validateRequest(input); return json(response, 202, redacted(jobs.create(input))); }
      const match = request.url?.match(/^\/v1\/runs\/([^/]+)(?:\/(complete))?$/);
      if (!match) return json(response, 404);
      const id = decodeURIComponent(match[1]!);
      if (request.method === "GET" && !match[2]) { const job = jobs.get(id); return job ? json(response, 200, redacted(job)) : json(response, 404); }
      if (request.method === "DELETE" && !match[2]) { const job = jobs.cancel(id); return job ? json(response, 200, redacted(job)) : json(response, 404); }
      if (request.method === "POST" && match[2] === "complete") { const result = await readJson(request) as { passed: boolean; summary: string; exitCode: number }; const job = jobs.complete(id, result); return job ? json(response, 200, redacted(job)) : json(response, 404); }
      return json(response, 405);
    } catch (error) { json(response, 409, { error: error instanceof Error ? error.message : "Request failed" }); }
  });
}

if (process.env.NODE_ENV !== "test") {
  const token = process.env.SANDBOX_TOKEN, workerToken = process.env.SANDBOX_WORKER_TOKEN, signingSecret = process.env.RESULT_SIGNING_SECRET;
  if (!token || !workerToken || !signingSecret) throw new Error("SANDBOX_TOKEN, SANDBOX_WORKER_TOKEN, and RESULT_SIGNING_SECRET are required");
  const port = Number(process.env.PORT ?? 8787);
  createSandboxServer({ token, workerToken, signingSecret }).listen(port, () => console.log(`Orqestra sandbox listening on ${port}`));
}
