async function printKitchenTicket(printer, ticketText) {
  const response = await fetch("http://127.0.0.1:19100/api/print/kitchen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      printer,
      text: ticketText
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Kitchen printing failed.");
  }

  return result;
}
