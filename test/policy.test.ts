import assert from "node:assert/strict";
import test from "node:test";
import { validateRequest } from "../src/policy.js";

test("accepts a bounded test request", () => {
  assert.doesNotThrow(() => validateRequest({ runId: "run-1", repository: "org/repo", commit: "abcdef1", command: ["npm", "test"], timeoutSeconds: 600 }));
});

test("rejects shell execution and excessive timeouts", () => {
  assert.throws(() => validateRequest({ runId: "run-1", repository: "org/repo", commit: "abcdef1", command: ["sh", "-c", "anything"], timeoutSeconds: 600 }));
  assert.throws(() => validateRequest({ runId: "run-1", repository: "org/repo", commit: "abcdef1", command: ["npm", "test"], timeoutSeconds: 1801 }));
});
