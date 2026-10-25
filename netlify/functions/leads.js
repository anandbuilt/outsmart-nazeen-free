const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbza2VFB0G_gNn7L_9BSAlzrIqI1RxlYy-oQ1V4xzRdBZcCqSCZatrEpTIN_Bn5Y7X4h/exec";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  let lead;
  try {
    lead = JSON.parse(event.body || "");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid submission." }) };
  }
  if (lead.website) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid submission." }) };
  }

  const name = typeof lead.name === "string" ? lead.name.trim() : "";
  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  const email = typeof lead.email === "string" ? lead.email.trim() : "";
  const phoneDigits = phone.replace(/\D/g, "");
  if (name.length < 2 || name.length > 80 || phone.length > 20 || phoneDigits.length < 7 || phoneDigits.length > 15 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Check your name, phone number, and email." }) };
  }

  try {
    const upstream = await fetch(SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, fullName: name, phone, email, paymentStatus: "Pending", notes: "Registration lead; payment not verified", source: "outsmart-self-mastery-landing", submittedAt: new Date().toISOString() }),
      redirect: "follow",
      signal: AbortSignal.timeout(12000)
    });
    const result = await upstream.json();
    if (!upstream.ok || (result.status !== "success" && result.success !== true)) {
      return { statusCode: 502, body: JSON.stringify({ error: "Could not save your details. Please try again." }) };
    }
    return { statusCode: 200, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" }, body: JSON.stringify({ saved: true }) };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not save your details. Please try again." }) };
  }
};
