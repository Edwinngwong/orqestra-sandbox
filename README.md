# Orqestra Sandbox

Execution-plane boundary for untrusted Orqestra coding-agent workloads.

Before contributing, read [`AGENTS.md`](AGENTS.md). It is the authoritative
project-state and engineering guide, and every milestone commit must update it.

The current local MVP validates the run request contract and executes the exact
requested commit in a constrained, digest-pinned Docker container. It disables
workload networking, runs as a non-root user with a read-only root filesystem,
drops Linux capabilities, applies CPU/memory/PID/time limits, signs the terminal
result, and guarantees temporary checkout cleanup. Production execution must
replace the local Docker worker with a fresh cloud task or microVM per run and
add default-deny egress controls, durable job storage, centralized redacted
logs, artifact scanning and retention, provenance, and emergency kill controls.

## Run

```sh
npm install
npm test
npm run typecheck
npm run dev
```

## API

`POST /v1/runs` accepts a run ID, repository, immutable commit SHA, allow-listed command, bounded timeout, and optional run-scoped repository token. The worker leases accepted jobs, executes them in isolation, and returns a signed terminal result.

Read [the isolation contract](docs/ISOLATION.md) before deploying a worker. Acceptance alone is never treated as evidence that work executed or passed; completed results are signed separately.

Start the admission API with `npm run dev` and the executor separately with `npm run worker`. The worker leases an accepted job, downloads the exact GitHub commit archive, runs the allow-listed command in the digest-pinned constrained Docker image, submits the result for signing, and deletes the temporary checkout. `GITHUB_TOKEN` is supported only for local/private-repository development; production should inject a run-scoped installation token.
