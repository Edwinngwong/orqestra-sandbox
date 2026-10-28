import assert from "node:assert/strict";
import test from "node:test";
process.env.NODE_ENV = "test";
const { createSandboxServer } = await import("../src/server.js");

test("authenticates admission and signs completed results", async () => {
  const server = createSandboxServer({ token: "platform", workerToken: "worker", signingSecret: "signing" });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); assert(address && typeof address === "object"); const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${base}/v1/runs`, { method: "POST" })).status, 401);
    const request = { runId: "run-1", repository: "org/repo", commit: "abcdef1", command: ["npm", "test"], timeoutSeconds: 60, repositoryToken: "short-lived-secret" };
    const admitted = await fetch(`${base}/v1/runs`, { method: "POST", headers: { authorization: "Bearer platform", "content-type": "application/json" }, body: JSON.stringify(request) });
    assert.equal(admitted.status, 202);
    assert.equal(JSON.stringify(await admitted.json()).includes("short-lived-secret"), false);
    const leased = await fetch(`${base}/v1/jobs/next`, { headers: { authorization: "Bearer worker" } });
    assert.equal(leased.status, 200);
    const leasedJob = await leased.json() as { status: string; request: { repositoryToken?: string } };
    assert.equal(leasedJob.status, "running");
    assert.equal(leasedJob.request.repositoryToken, "short-lived-secret");
    const completed = await fetch(`${base}/v1/runs/run-1/complete`, { method: "POST", headers: { authorization: "Bearer worker", "content-type": "application/json" }, body: JSON.stringify({ passed: true, summary: "12 passed", exitCode: 0 }) });
    assert.equal(completed.status, 200);
    const result = await completed.json() as { status: string; signature?: string };
    assert.equal(result.status, "passed"); assert.match(result.signature ?? "", /^[a-f0-9]{64}$/);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
