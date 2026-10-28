import assert from "node:assert/strict";
import test from "node:test";
import { dockerArguments, LocalDockerExecutor } from "../src/docker-executor.js";

test("builds a constrained, networkless, non-root Docker invocation", () => {
  const args = dockerArguments({ runId: "1", repository: "org/repo", commit: "abcdef1", command: ["npm", "test"], timeoutSeconds: 60 }, "/tmp/work", "runner@sha256:abc");
  for (const required of ["--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=256", "--user", "65532:65532"]) assert(args.includes(required), required);
  assert.deepEqual(args.slice(-3), ["runner@sha256:abc", "npm", "test"]);
});

test("refuses mutable executor image tags", () => { assert.throws(() => new LocalDockerExecutor("runner:latest")); });
