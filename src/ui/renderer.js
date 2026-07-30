const elements = {
  statusBadge: document.getElementById("statusBadge"),
  apiUrl: document.getElementById("apiUrl"),
  host: document.getElementById("host"),
  port: document.getElementById("port"),
  receiptPrinter: document.getElementById("receiptPrinter"),
  kitchenPrinter: document.getElementById("kitchenPrinter"),
  rawPrinterPath: document.getElementById("rawPrinterPath"),
  testPrinter: document.getElementById("testPrinter"),
  testText: document.getElementById("testText"),
  printerList: document.getElementById("printerList"),
  message: document.getElementById("message"),
  refreshButton: document.getElementById("refreshButton"),
  saveButton: document.getElementById("saveButton"),
  testButton: document.getElementById("testButton")
};

function setMessage(message, isError = false) {
  elements.message.textContent = message;
  elements.message.style.color = isError ? "#b91c1c" : "#166534";
}

function fillSelect(select, printers, selectedValue = "") {
  select.innerHTML = "";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Select printer";
  select.appendChild(empty);

  printers.forEach((printer) => {
    const option = document.createElement("option");
    option.value = printer.Name;
    option.textContent = printer.Default ? `${printer.Name} (Default)` : printer.Name;
    option.selected = printer.Name === selectedValue;
    select.appendChild(option);
  });
}

async function loadStatus() {
  const status = await window.litaAgent.getStatus();

  elements.apiUrl.textContent = status.url;
  elements.statusBadge.textContent = status.online ? "Agent online" : "Agent offline";
  elements.statusBadge.className = `status ${status.online ? "online" : "offline"}`;
}

async function loadSettings() {
  const settings = await window.litaAgent.getSettings();

  elements.host.value = settings.host;
  elements.port.value = settings.port;
  elements.rawPrinterPath.value = settings.rawPrinterPath || "";

  return settings;
}

async function loadPrinters(settings = null) {
  try {
    elements.refreshButton.disabled = true;
    const currentSettings = settings || (await window.litaAgent.getSettings());
    const printers = await window.litaAgent.getPrinters();

    fillSelect(elements.receiptPrinter, printers, currentSettings.receiptPrinter);
    fillSelect(elements.kitchenPrinter, printers, currentSettings.kitchenPrinter);
    fillSelect(elements.testPrinter, printers, currentSettings.receiptPrinter);

    elements.printerList.innerHTML = "";

    if (!printers.length) {
      elements.printerList.textContent = "No Windows printers were found.";
      return;
    }

    printers.forEach((printer) => {
      const row = document.createElement("div");
      row.className = "printer";

      const name = document.createElement("strong");
      name.textContent = printer.Name;

      const info = document.createElement("span");
      info.textContent = [
        printer.Default ? "Default" : null,
        printer.Network ? "Network" : "Local",
        printer.WorkOffline ? "Offline" : "Ready"
      ].filter(Boolean).join(" · ");

      row.append(name, info);
      elements.printerList.appendChild(row);
    });
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    elements.refreshButton.disabled = false;
  }
}

elements.refreshButton.addEventListener("click", () => loadPrinters());

elements.saveButton.addEventListener("click", async () => {
  try {
    const result = await window.litaAgent.saveSettings({
      host: elements.host.value.trim(),
      port: Number(elements.port.value),
      receiptPrinter: elements.receiptPrinter.value,
      kitchenPrinter: elements.kitchenPrinter.value,
      rawPrinterPath: elements.rawPrinterPath.value.trim()
    });

    setMessage(
      result.restartRequired
        ? "Settings saved. Restart Lita Print Agent to apply host or port changes."
        : "Settings saved."
    );
  } catch (error) {
    setMessage(error.message, true);
  }
});

elements.testButton.addEventListener("click", async () => {
  try {
    elements.testButton.disabled = true;
    setMessage("Sending test print…");

    await window.litaAgent.testPrint({
      printer: elements.testPrinter.value,
      text: elements.testText.value
    });

    setMessage("Test print sent successfully.");
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    elements.testButton.disabled = false;
  }
});

(async () => {
  try {
    const settings = await loadSettings();
    await Promise.all([loadStatus(), loadPrinters(settings)]);
  } catch (error) {
    setMessage(error.message, true);
  }
})();
