export interface SandboxRequest { runId: string; repository: string; commit: string; command: string[]; timeoutSeconds: number }

const allowedCommands = new Set(["npm", "pnpm", "yarn", "go", "cargo", "pytest"]);

export function validateRequest(request: SandboxRequest): void {
  if (!request.runId || !request.repository || !/^[a-f0-9]{7,64}$/i.test(request.commit)) throw new Error("Invalid run identity");
  if (request.command.length === 0 || !allowedCommands.has(request.command[0] ?? "")) throw new Error("Command is not allowed");
  if (request.timeoutSeconds < 1 || request.timeoutSeconds > 1800) throw new Error("Timeout must be 1-1800 seconds");
}
