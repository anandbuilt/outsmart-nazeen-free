const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzqCuhpd9jChVmh8Gz93kxBDOZRGGIU1uOWRU-VECScAfdXGGG9OTjYkdRnEViO0Z9cPw/exec";

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
      body: JSON.stringify({
        name,
        fullName: name,
        phone,
        email,
        paymentStatus: "Free / Registered",
        notes: "First Time Manager Playbook Bootcamp registration",
        source: "first-time-manager-playbook-bootcamp",
        submittedAt: new Date().toISOString()
      }),
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });
    const result = await upstream.json();
    const isSuccess = upstream.ok && (
      result.result === "success" ||
      result.status === "success" ||
      result.success === true
    );
    if (!isSuccess) {
      return { statusCode: 502, body: JSON.stringify({ error: "Could not save your details. Please try again." }) };
    }
    return { statusCode: 200, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" }, body: JSON.stringify({ saved: true }) };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not save your details. Please try again." }) };
  }
};
