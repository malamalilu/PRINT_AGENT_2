# Lita Print Agent (Electron)

Windows desktop print agent for Lita Pro.

## Features

- Runs in the Windows system tray
- Local HTTP API on `127.0.0.1`
- Health-check endpoint
- Lists installed Windows printers
- Prints text receipts and kitchen tickets
- Supports a configured Windows shared-printer path for raw ESC/POS data
- Setup installer and portable executable
- GitHub Actions Windows build

## Local development

Install Node.js, then run:

```bash
npm install
npm start
```

## Build locally

```bash
npm run build:win
```

Output is written to `dist/`.

## Build on GitHub

Push the extracted project files to a GitHub repository. Then:

1. Open **Actions**.
2. Choose **Build Windows Installer**.
3. Click **Run workflow**.
4. Download the `Lita-Print-Agent-Windows` artifact.

## Default API

The default address is:

```text
http://127.0.0.1:19100
```

### Health

```text
GET /api/health
```

### Printers

```text
GET /api/printers
```

### Print receipt

```text
POST /api/print/receipt
Content-Type: application/json

{
  "printer": "POS-58",
  "text": "LITA PRO\nReceipt test\n\n"
}
```

### Print kitchen ticket

```text
POST /api/print/kitchen
Content-Type: application/json

{
  "printer": "Kitchen Printer",
  "text": "TABLE 4\n2 x Jollof Rice\n"
}
```

### Raw print

For a Windows shared printer, configure a path such as:

```text
\\\\localhost\\POS58
```

Then call:

```text
POST /api/print/raw
Content-Type: application/json

{
  "printerPath": "\\\\localhost\\POS58",
  "base64": "G0BMSVRBIFBSTwoKCg=="
}
```

## Important

The agent binds to `127.0.0.1` by default. This prevents other computers on the network from directly calling it.
