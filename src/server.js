const http = require("http");
const { URL } = require("url");
const { ipcMain } = require("electron");
const { getSettings, saveSettings } = require("./settings");
const { listPrinters, printText, printRaw } = require("./printer-service");

let server = null;
let startedAt = null;

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store"
  });

  response.end(payload);
}

function readJson(request, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON request body."));
      }
    });

    request.on("error", reject);
  });
}

async function requestHandler(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const settings = getSettings();
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        success: true,
        app: "Lita Print Agent",
        version: require("../package.json").version,
        status: "online",
        startedAt,
        host: settings.host,
        port: settings.port
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/printers") {
      const printers = await listPrinters();
      sendJson(response, 200, { success: true, printers });
      return;
    }

    if (
      request.method === "POST" &&
      ["/api/print/receipt", "/api/print/kitchen", "/api/printers/test"].includes(url.pathname)
    ) {
      const body = await readJson(request);
      const fallback =
        url.pathname === "/api/print/kitchen"
          ? settings.kitchenPrinter
          : settings.receiptPrinter;

      await printText(body.printer || fallback, body.text || "Lita Print Agent test\n\n");
      sendJson(response, 200, { success: true, message: "Print job sent." });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/print/raw") {
      const body = await readJson(request);
      const buffer = Buffer.from(body.base64 || "", "base64");
      await printRaw(body.printerPath || settings.rawPrinterPath, buffer);
      sendJson(response, 200, { success: true, message: "Raw print job sent." });
      return;
    }

    sendJson(response, 404, {
      success: false,
      message: "Endpoint not found."
    });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, {
      success: false,
      message: error.message || "Unexpected print-agent error."
    });
  }
}

async function startApiServer() {
  if (server) return;

  const settings = getSettings();
  startedAt = new Date().toISOString();

  server = http.createServer(requestHandler);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(settings.port, settings.host, resolve);
  });

  console.log(`Lita Print Agent API: http://${settings.host}:${settings.port}`);
}

async function stopApiServer() {
  if (!server) return;

  await new Promise((resolve) => server.close(resolve));
  server = null;
}

ipcMain.handle("agent:get-status", async () => {
  const settings = getSettings();
  return {
    online: Boolean(server),
    startedAt,
    url: `http://${settings.host}:${settings.port}`
  };
});

ipcMain.handle("settings:get", () => getSettings());

ipcMain.handle("settings:save", async (_event, settings) => {
  const saved = saveSettings(settings);
  return {
    success: true,
    settings: saved,
    restartRequired: true
  };
});

ipcMain.handle("printers:list", () => listPrinters());

ipcMain.handle("printers:test", async (_event, payload) => {
  await printText(payload.printer, payload.text || "Lita Print Agent test\n\n");
  return { success: true };
});

module.exports = {
  startApiServer,
  stopApiServer
};
