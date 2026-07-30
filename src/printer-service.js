const { execFile } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

function runPowerShell(script, args = []) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, ...args],
      { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || error.message).trim()));
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}

async function listPrinters() {
  const script = `
    $printers = Get-CimInstance Win32_Printer |
      Select-Object Name, Default, Network, WorkOffline, PrinterStatus
    $printers | ConvertTo-Json -Compress
  `;

  const output = await runPowerShell(script);
  if (!output) return [];

  const result = JSON.parse(output);
  return Array.isArray(result) ? result : [result];
}

async function printText(printerName, text) {
  if (!printerName || typeof printerName !== "string") {
    throw new Error("Printer name is required.");
  }

  if (typeof text !== "string" || text.length === 0) {
    throw new Error("Print text is required.");
  }

  const tempFile = path.join(os.tmpdir(), `lita-print-${Date.now()}.txt`);
  await fs.writeFile(tempFile, text, "utf8");

  const script = `
    param($filePath, $printerName)
    Get-Content -LiteralPath $filePath -Raw | Out-Printer -Name $printerName
  `;

  try {
    await runPowerShell(script, [tempFile, printerName]);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

async function printRaw(printerPath, buffer) {
  if (!printerPath || typeof printerPath !== "string") {
    throw new Error("A shared printer path is required.");
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Raw print data is empty.");
  }

  const tempFile = path.join(os.tmpdir(), `lita-raw-${Date.now()}.bin`);
  await fs.writeFile(tempFile, buffer);

  const script = `
    param($filePath, $printerPath)
    $process = Start-Process -FilePath "cmd.exe" `
      -ArgumentList "/d", "/c", "copy", "/b", $filePath, $printerPath `
      -NoNewWindow -Wait -PassThru
    exit $process.ExitCode
  `;

  try {
    await runPowerShell(script, [tempFile, printerPath]);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

module.exports = {
  listPrinters,
  printText,
  printRaw
};
