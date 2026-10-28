# Orqestra Sandbox

Execution-plane boundary for untrusted Orqestra coding-agent workloads.

This scaffold defines and validates the run request contract. It does **not** yet execute user code; production execution must use a fresh ephemeral VM or container per run with no host mounts, default-deny egress, CPU/memory/time limits, short-lived credentials, immutable base images, log redaction, and guaranteed teardown.

## Run

```sh
npm install
npm test
npm run typecheck
npm run dev
```

## API

`POST /v1/runs` accepts a run ID, repository, immutable commit SHA, allow-listed command, and bounded timeout. A later worker adapter will turn accepted requests into isolated jobs and return signed test artifacts.

Read [the isolation contract](docs/ISOLATION.md) before deploying a worker. Acceptance alone is never treated as evidence that work executed or passed; completed results are signed separately.

Start the admission API with `npm run dev` and the executor separately with `npm run worker`. The worker leases an accepted job, downloads the exact GitHub commit archive, runs the allow-listed command in the digest-pinned constrained Docker image, submits the result for signing, and deletes the temporary checkout. `GITHUB_TOKEN` is supported only for local/private-repository development; production should inject a run-scoped installation token.
