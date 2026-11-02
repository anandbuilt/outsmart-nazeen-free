"use strict";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqCuhpd9jChVmh8Gz93kxBDOZRGGIU1uOWRU-VECScAfdXGGG9OTjYkdRnEViO0Z9cPw/exec";

const form = document.getElementById("enroll-form");
const status = document.getElementById("form-status");
const fields = {
  name: document.getElementById("full-name"),
  phone: document.getElementById("phone"),
  email: document.getElementById("email")
};

function errorFor(key, message) {
  fields[key].setAttribute("aria-invalid", message ? "true" : "false");
  document.getElementById(`${key}-error`).textContent = message;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  status.textContent = "";
  status.style.color = "";
  const name = fields.name.value.trim();
  const phone = fields.phone.value.trim();
  const email = fields.email.value.trim();
  const phoneDigits = phone.replace(/\D/g, "");
  errorFor("name", name.length < 2 ? "Enter your full name." : "");
  errorFor("phone", phoneDigits.length < 7 || phoneDigits.length > 15 ? "Enter a valid phone number." : "");
  errorFor("email", !fields.email.validity.valid || !email ? "Enter a valid email address." : "");
  const invalid = Object.values(fields).find(field => field.getAttribute("aria-invalid") === "true");
  if (invalid) { invalid.focus(); return; }

  const button = form.querySelector('button[type="submit"]');
  const originalButtonContent = button.innerHTML;
  button.disabled = true;
  status.style.color = "#0b80dd";
  status.textContent = "Reserving your seat…";

  const payload = {
    name,
    fullName: name,
    phone,
    email,
    website: form.elements.website ? form.elements.website.value : "",
    paymentStatus: "Free / Registered",
    notes: "First Time Manager Playbook Bootcamp registration",
    source: "first-time-manager-playbook-bootcamp",
    submittedAt: new Date().toISOString()
  };

  let saved = false;

  // 1. Primary submission via local/Netlify backend function
  try {
    const response = await fetch("/.netlify/functions/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const result = await response.json();
      if (result.saved === true) {
        saved = true;
      }
    }
  } catch (e) {
    // Backend endpoint unreachable or running in static context
  }

  // 2. Direct fallback to Google Apps Script if backend function was unavailable
  if (!saved) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      saved = true;
    } catch (e) {
      // Both attempts failed
    }
  }

  if (saved) {
    status.style.color = "#027a48";
    status.textContent = "✓ You are registered! Your seat is reserved. Zoom joining details will be sent to your WhatsApp & email.";
    button.textContent = "Seat Reserved ✓";
    form.reset();
  } else {
    status.style.color = "#a3140b";
    status.textContent = "Could not save your details. Please check your connection and try again.";
    button.disabled = false;
    button.innerHTML = originalButtonContent;
  }
});

// Optional accessibility enhancements for keyboard users (Escape key to close modal, Enter on focused labels)
document.addEventListener("keydown", event => {
  const toggle = document.getElementById("privacy-modal-toggle");
  if (!toggle) return;
  if (event.key === "Escape" && toggle.checked) {
    toggle.checked = false;
  } else if (event.key === "Enter" && document.activeElement && document.activeElement.getAttribute("for") === "privacy-modal-toggle") {
    event.preventDefault();
    toggle.checked = !toggle.checked;
  }
});
