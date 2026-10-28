import { createServer } from "node:http";
import { validateRequest, type SandboxRequest } from "./policy.js";

const port = Number(process.env.PORT ?? 8787);
const server = createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/v1/runs") { response.writeHead(404).end(); return; }
  let body = "";
  request.setEncoding("utf8");
  request.on("data", chunk => { body += chunk; });
  request.on("end", () => {
    try {
      const input = JSON.parse(body) as SandboxRequest;
      validateRequest(input);
      // Scaffold only: a production worker must create an ephemeral VM/container,
      // enforce egress and resource limits, stream logs, then destroy it.
      response.writeHead(202, { "content-type": "application/json" }).end(JSON.stringify({ runId: input.runId, status: "accepted" }));
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }));
    }
  });
});
server.listen(port, () => console.log(`Orqestra sandbox scaffold listening on ${port}`));
