# Orqestra Sandbox agent guide

This file is the authoritative starting point for humans and AI coding agents working in this repository. Read it before changing code. Instructions apply recursively unless a deeper `AGENTS.md` explicitly narrows them.

## Product and clean-room boundary

Orqestra is an independent, human-governed AI software-delivery product. This repository is its isolated execution plane. It receives an immutable commit and bounded test policy from the control plane, executes the allowed command, and returns a signed result.

Do not use, request, reproduce, translate, or derive from any employer-proprietary source code, architecture, documentation, prompts, customer data, credentials, or internal product knowledge. Implement from public documentation, first principles, and code already committed to the Orqestra repositories.

## Current milestone

- Milestone: Authenticated local commercial MVP execution plane
- Sandbox version: 0.2.0
- Compatible platform version: 0.6.x
- Milestone status: complete and live-tested locally

Current capabilities:

- Authenticated admission and separate worker authentication.
- Validation of repository, immutable commit SHA, command allowlist, and bounded timeout.
- In-memory accepted/running/passed/failed/cancelled lifecycle for local development.
- Worker-only leasing of accepted jobs.
- Run-scoped repository tokens hidden from platform-facing responses.
- Immutable GitHub archive checkout and guaranteed temporary-directory cleanup.
- Digest-pinned Docker images only.
- Network-disabled, non-root containers with read-only root filesystem, capability drop, no-new-privileges, PID, CPU, memory, and timeout limits.
- HMAC-signed completion payloads verified by the platform.
- Retry of transient API connection failures while authentication failures remain fatal.
- Compatibility with platform-side Muse intake and tracker routing; the execution request/result contract is unchanged.

Known gaps before production use:

- The API job store is in-memory and not durable across process restarts.
- The local worker runs Docker on the host; production requires a fresh cloud task or microVM per run.
- Production default-deny egress with explicit artifact/package proxies is not implemented.
- Centralized redacted logs, artifact retention, malware/secret scanning, provenance, and emergency kill controls are not implemented.

## Repository responsibility

This repository owns only the execution boundary:

- Validate and admit bounded run requests.
- Keep repository credentials worker-only and run-scoped.
- Check out the exact requested commit.
- Execute only allow-listed commands inside constrained, digest-pinned isolation.
- Sign the terminal result and destroy temporary state.

It does not receive GitHub webhooks, call coding models, create branches, approve work, create pull requests, authenticate customers, or make orchestration decisions. Those belong to `orqestra-platform`.

## Architecture map

- `src/policy.ts`: admission request and command policy.
- `src/server.ts`: authenticated admission, lifecycle, leasing, completion, and redaction.
- `src/jobs.ts`: local job lifecycle and signed completion payloads.
- `src/checkout.ts`: immutable archive checkout.
- `src/docker-executor.ts`: constrained Docker invocation and result capture.
- `src/worker.ts`: lease, checkout, execute, complete, clean up, and transient retry loop.
- `docs/ISOLATION.md`: isolation contract and production requirements.

## Non-negotiable invariants

- Never treat job acceptance as evidence of execution or success.
- Never run mutable image tags; require an image digest.
- Never run repository commands on the host.
- Never mount the Docker socket or host filesystem inside a workload container.
- Never enable privileged containers, added Linux capabilities, root execution, or unrestricted networking.
- Never interpolate repository data into a shell command. Pass validated argument arrays directly.
- Never expose repository tokens through admission/status responses, logs, results, or artifacts.
- Verify immutable commit identity and delete temporary checkout data in `finally` paths.
- Bound CPU, memory, PIDs, storage, wall time, output, and artifact size.
- Authentication failures are fatal; transient connection failures may retry with bounded delay.
- Preserve result signing and the exact platform verification contract.

## Development and validation

Requirements: Node.js 20+ and Docker for live execution.

```sh
npm install
npm run typecheck
npm test
```

Before committing:

- Run every sandbox test and typecheck.
- Run platform tests when changing the request/result contract.
- Inspect the constructed Docker arguments for every isolation-control change.
- Run `git diff --check` and inspect the diff for secrets.
- For executor changes, prove cleanup on success, command failure, timeout, checkout failure, and API failure.

## Cross-repository contract

The platform submits a run ID, repository, immutable commit SHA, allow-listed command, bounded timeout, and optional run-scoped repository token. The sandbox returns lifecycle state plus a signed terminal payload containing run ID, commit, status, summary, and exit code.

When changing this contract, update both repositories in the same milestone, add compatibility tests on both sides, state compatible versions in both `AGENTS.md` files, and push both repositories.

## Milestone update protocol

Every milestone commit must update this file in the same commit:

1. Update milestone name, sandbox version, compatible platform version, and status.
2. Update capabilities and known production gaps.
3. Update architecture paths, isolation invariants, commands, and the cross-repository contract when changed.
4. Update `docs/ISOLATION.md` and README when behavior or deployment expectations change.
5. Add or update positive, negative, and cleanup tests that prove the milestone.

`test/agent-guidance.test.ts` enforces the declared package version. Do not disable that test. A milestone is not complete while this guide is stale.

## Definition of done

A change is done only when implementation, failure-path and isolation tests, typecheck, documentation, security review, and relevant live acceptance all pass; both Git repositories are compatible, clean, and pushed; and this guide accurately describes the resulting execution boundary.
