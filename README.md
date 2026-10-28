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

Read [the isolation contract](docs/ISOLATION.md) before implementing a worker. The current service only validates admission; it does not claim that accepted work has executed or passed.
