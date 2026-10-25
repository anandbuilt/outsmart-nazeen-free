const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { handler } = require("./netlify/functions/leads.js");

const site = path.resolve(__dirname, "site");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

http.createServer(async (request, response) => {
  if (request.url === "/.netlify/functions/leads") {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 8192) {
        response.writeHead(413).end();
        return;
      }
    }
    const result = await handler({ httpMethod: request.method, body });
    response.writeHead(result.statusCode, { "Content-Type": "application/json", ...result.headers });
    response.end(result.body);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405).end();
    return;
  }
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path.resolve(site, "." + (pathname === "/" ? "/index.html" : pathname));
  if (!file.startsWith(site + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const data = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch {
    response.writeHead(404).end();
  }
}).listen(8765, "127.0.0.1", () => console.log("Local site: http://127.0.0.1:8765/"));
