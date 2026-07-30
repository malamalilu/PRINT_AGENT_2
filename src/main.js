const { app, BrowserWindow, Menu, Tray, nativeImage, shell } = require("electron");
const path = require("path");
const { startApiServer, stopApiServer } = require("./server");
const { getSettings } = require("./settings");

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 760,
    minHeight: 560,
    title: "Lita Print Agent",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "ui", "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Lita Print Agent");

  const menu = Menu.buildFromTemplate([
    {
      label: "Open Lita Print Agent",
      click: () => {
        if (!mainWindow) createWindow();
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: "Open health check",
      click: () => {
        const settings = getSettings();
        shell.openExternal(`http://${settings.host}:${settings.port}/api/health`);
      }
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  createWindow();
  createTray();

  try {
    await startApiServer();
  } catch (error) {
    console.error("Unable to start API server:", error);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow.show();
  });
});

app.on("before-quit", async () => {
  isQuitting = true;
  await stopApiServer();
});

app.on("window-all-closed", () => {
  // Keep running in the tray on Windows.
});
