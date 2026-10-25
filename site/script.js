"use strict";

const RAZORPAY_URL = "https://rzp.io/rzp/1c6FK6hq";

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

function validRazorpayLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "rzp.io" || url.hostname === "razorpay.com" || url.hostname.endsWith(".razorpay.com"));
  } catch { return false; }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  status.textContent = "";
  const name = fields.name.value.trim();
  const phone = fields.phone.value.trim();
  const email = fields.email.value.trim();
  const phoneDigits = phone.replace(/\D/g, "");
  errorFor("name", name.length < 2 ? "Enter your full name." : "");
  errorFor("phone", phoneDigits.length < 7 || phoneDigits.length > 15 ? "Enter a valid phone number." : "");
  errorFor("email", !fields.email.validity.valid || !email ? "Enter a valid email address." : "");
  const invalid = Object.values(fields).find(field => field.getAttribute("aria-invalid") === "true");
  if (invalid) { invalid.focus(); return; }
  if (!validRazorpayLink(RAZORPAY_URL)) {
    status.textContent = "Enrollment link is being set up. Please check back shortly.";
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = "Saving your details…";
  try {
    const response = await fetch("/.netlify/functions/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, website: form.elements.website.value })
    });
    if (!response.ok) throw new Error("Lead save failed");
    const result = await response.json();
    if (result.saved !== true) throw new Error("Lead save failed");
    status.textContent = "Details saved. Opening Razorpay…";
    window.location.assign(RAZORPAY_URL);
  } catch {
    status.textContent = "Could not save your details. Please try again.";
    button.disabled = false;
  }
});
