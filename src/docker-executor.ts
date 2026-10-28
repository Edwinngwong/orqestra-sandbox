import { spawn } from "node:child_process";
import type { SandboxRequest } from "./policy.js";

export interface ExecutionResult { passed: boolean; summary: string; exitCode: number }

export function dockerArguments(request: SandboxRequest, workspace: string, image: string): string[] {
  return [
    "run", "--rm", "--network=none", "--read-only", "--cap-drop=ALL",
    "--security-opt=no-new-privileges", "--pids-limit=256", "--memory=2g", "--cpus=2",
    "--tmpfs", "/tmp:rw,noexec,nosuid,size=256m", "--user", "65532:65532",
    "--mount", `type=bind,src=${workspace},dst=/workspace`, "--workdir", "/workspace",
    image, ...request.command,
  ];
}

export class LocalDockerExecutor {
  constructor(private readonly image: string) { if (!image.includes("@sha256:")) throw new Error("Executor image must be pinned by digest"); }
  execute(request: SandboxRequest, workspace: string): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const child = spawn("docker", dockerArguments(request, workspace, this.image), { stdio: ["ignore", "pipe", "pipe"] });
      let output = ""; const limit = 256_000;
      const capture = (chunk: Buffer) => { if (output.length < limit) output += chunk.toString("utf8").slice(0, limit - output.length); };
      child.stdout.on("data", capture); child.stderr.on("data", capture); child.on("error", reject);
      const timer = setTimeout(() => child.kill("SIGKILL"), request.timeoutSeconds * 1000);
      child.on("close", code => { clearTimeout(timer); const exitCode = code ?? 137; resolve({ passed: exitCode === 0, exitCode, summary: output.slice(-20_000) || `Exited ${exitCode}` }); });
    });
  }
}
