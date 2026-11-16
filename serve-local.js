const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");
const gzip = promisify(require("node:zlib").gzip);
const { handler } = require("./netlify/functions/leads.js");

const site = path.resolve(__dirname, "site");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".avif": "image/avif", // image-delivery-insight: serve the responsive hero format.
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
    const extension = path.extname(file);
    const headers = { "Content-Type": types[extension] || "application/octet-stream" };
    // third-party-cookies, inspector-issues: omit cookies on cross-origin no-CORS loads.
    if (extension === ".html") headers["Cross-Origin-Embedder-Policy"] = "credentialless";
    const isScriptOrStyle = extension === ".js" || extension === ".css";
    let body = data;

    // document-latency-insight: compress HTML and other text used on the render path.
    if (extension === ".html" || isScriptOrStyle) {
      headers.Vary = "Accept-Encoding";
      const acceptsGzip = request.headers["accept-encoding"]?.split(",").some(encoding => {
        const [name, quality] = encoding.trim().toLowerCase().split(";");
        return name.trim() === "gzip" && (!quality || Number(quality.split("=")[1]) > 0);
      });
      if (acceptsGzip && data.length >= 1024) {
        body = await gzip(data);
        headers["Content-Encoding"] = "gzip";
      }
    }

    // cache-insight: match the first-party asset cache policy in site/_headers.
    if (pathname.startsWith("/assets/")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else if (isScriptOrStyle) {
      headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800";
    }
    headers["Content-Length"] = body.length;
    response.writeHead(200, headers);
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(8765, "127.0.0.1", () => console.log("Local site: http://127.0.0.1:8765/"));
