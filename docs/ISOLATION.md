# Isolation contract

The HTTP service validates and admits jobs; it must not execute untrusted code in its own process or host namespace. A worker implementation must create one disposable environment per job and prove the following invariants:

- no host filesystem, container socket, cloud metadata, control-plane network, or other-run access;
- non-root user, read-only base filesystem, explicit writable scratch volume, dropped capabilities, and syscall filtering;
- CPU, memory, process, disk, output, and wall-clock limits;
- default-deny network egress with an explicit dependency allow policy;
- immutable repository commit and base-image digest;
- short-lived, least-privilege credentials delivered after provisioning and revoked on completion;
- streaming redaction plus bounded logs and artifacts;
- teardown on success, failure, timeout, cancellation, worker crash, and lease expiry;
- signed result manifest binding the run ID, commit, commands, image, exit codes, and artifact hashes.

Provider-specific implementations belong behind a worker interface and require adversarial isolation tests before use with third-party repositories.

`LocalDockerExecutor` is a development provider only. It requires an image pinned by digest and applies network, privilege, process, memory, CPU, filesystem, and timeout constraints. Because access to a Docker daemon is itself privileged, production deployments must place the executor on a dedicated worker host or replace it with an ephemeral managed runtime.
