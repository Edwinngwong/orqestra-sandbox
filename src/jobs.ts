import { createHmac } from "node:crypto";
import type { SandboxRequest } from "./policy.js";

export type JobStatus = "accepted" | "running" | "passed" | "failed" | "cancelled";
export interface Job { request: SandboxRequest; status: JobStatus; summary?: string; exitCode?: number; signature?: string }

export class JobStore {
  private readonly jobs = new Map<string, Job>();
  constructor(private readonly signingSecret: string) {}
  create(request: SandboxRequest) { const existing = this.jobs.get(request.runId); if (existing) return structuredClone(existing); const job: Job = { request: structuredClone(request), status: "accepted" }; this.jobs.set(request.runId, job); return structuredClone(job); }
  get(id: string) { const job = this.jobs.get(id); return job && structuredClone(job); }
  cancel(id: string) { const job = this.jobs.get(id); if (!job) return undefined; if (["passed", "failed"].includes(job.status)) throw new Error("Completed job cannot be cancelled"); job.status = "cancelled"; return structuredClone(job); }
  complete(id: string, result: { passed: boolean; summary: string; exitCode: number }) {
    const job = this.jobs.get(id); if (!job) return undefined; if (job.status === "cancelled") throw new Error("Cancelled job cannot complete");
    job.status = result.passed ? "passed" : "failed"; job.summary = result.summary; job.exitCode = result.exitCode;
    job.signature = createHmac("sha256", this.signingSecret).update(JSON.stringify({ runId: id, commit: job.request.commit, status: job.status, summary: job.summary, exitCode: job.exitCode })).digest("hex");
    return structuredClone(job);
  }
}
