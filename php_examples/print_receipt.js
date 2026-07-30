async function printReceipt(printer, receiptText) {
  const response = await fetch("http://127.0.0.1:19100/api/print/receipt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      printer,
      text: receiptText
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Receipt printing failed.");
  }

  return result;
}
