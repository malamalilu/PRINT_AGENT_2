const Store = require("electron-store");

const store = new Store({
  name: "settings",
  defaults: {
    host: "127.0.0.1",
    port: 19100,
    receiptPrinter: "",
    kitchenPrinter: "",
    rawPrinterPath: "",
    allowOrigins: ["*"]
  }
});

function getSettings() {
  return store.store;
}

function saveSettings(values) {
  const current = getSettings();
  store.store = {
    ...current,
    ...values,
    port: Number(values.port || current.port)
  };
  return store.store;
}

module.exports = {
  getSettings,
  saveSettings
};
