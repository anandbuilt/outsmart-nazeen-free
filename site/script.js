"use strict";

// Queue tracking immediately. Load the Meta SDK on interaction or after eight seconds.
if (!window.fbq) {
  const pixel = function () {
    if (pixel.callMethod) {
      pixel.callMethod.apply(pixel, arguments);
    } else {
      pixel.queue.push(arguments);
    }
  };
  window.fbq = pixel;
  if (!window._fbq) window._fbq = pixel;
  pixel.push = pixel;
  pixel.loaded = true;
  pixel.version = "2.0";
  pixel.queue = [];

  window.fbq("init", "2234780970421853");
  window.fbq("track", "PageView");

  const interactions = ["scroll", "touchstart", "pointerdown", "keydown", "mousemove"];
  let started = false;
  const fallback = window.setTimeout(startPixel, 8000);

  function startPixel() {
    if (started) return;
    started = true;
    window.clearTimeout(fallback);
    for (const event of interactions) {
      window.removeEventListener(event, startPixel);
    }

    const sdk = document.createElement("script");
    sdk.async = true;
    sdk.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.append(sdk);
  }

  for (const event of interactions) {
    window.addEventListener(event, startPixel, { once: true, passive: true });
  }
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqCuhpd9jChVmh8Gz93kxBDOZRGGIU1uOWRU-VECScAfdXGGG9OTjYkdRnEViO0Z9cPw/exec";

const form = document.getElementById("enroll-form");
const status = document.getElementById("form-status");
const fields = {
  name: document.getElementById("full-name"),
  phone: document.getElementById("phone"),
  company: document.getElementById("company"),
  email: document.getElementById("email")
};

const fakeEmailPrefixes = ["test", "fake", "abc", "xyz", "asdf", "qwer", "demo", "user", "admin", "12345"];

fields.phone.addEventListener("input", () => {
  fields.phone.value = fields.phone.value.replace(/[^0-9]/g, "").slice(0, 10);
});

function errorFor(key, message) {
  fields[key].setAttribute("aria-invalid", message ? "true" : "false");
  document.getElementById(`${key}-error`).textContent = message;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  status.textContent = "";
  status.style.color = "";
  const name = fields.name.value.trim();
  const phone = fields.phone.value;
  const company = fields.company.value.trim();
  const email = fields.email.value.trim().toLowerCase();
  const emailPrefix = email.split("@", 1)[0];

  const validName = /^[A-Za-z ]{6,50}$/.test(name)
    && !/\b(?:(?:asdf|qwer|zxcv)[a-z]*|(?:test|fake)+)\b/i.test(name)
    && !/([a-z])\1{5}/i.test(name.replace(/ /g, ""));
  const validPhone = /^[6-9][0-9]{9}$/.test(phone)
    && !/^([0-9])\1{9}$/.test(phone)
    && !["9876543210", "1234567890"].includes(phone);
  const validEmail = /^[a-z0-9._%+-]{5,}@gmail\.com$/.test(email)
    && email.length <= fields.email.maxLength
    && !fakeEmailPrefixes.some(prefix => emailPrefix.startsWith(prefix));

  errorFor("name", validName ? "" : "Enter your real full name, using 6–50 letters and spaces.");
  errorFor("phone", validPhone ? "" : "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
  const validCompany = company.length > 0 && company.length <= fields.company.maxLength;
  errorFor("company", validCompany ? "" : "Enter your company name (up to 120 characters).");
  errorFor("email", validEmail ? "" : "Enter your Gmail address with at least 5 characters before @gmail.com.");
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
    company,
    email,
    website: form.elements.website ? form.elements.website.value : "",
    paymentStatus: "Free / Registered",
    notes: "Toxic Boss Survival Kit Bootcamp registration",
    source: "toxic-boss-survival-kit-bootcamp",
    submittedAt: new Date().toISOString()
  };

  const zohoAction = form.dataset.zohoAction;
  if (zohoAction && !payload.website) {
    const [firstName, ...lastName] = name.split(/ +/);
    const zohoData = new FormData();
    zohoData.set("Name_First", firstName);
    zohoData.set("Name_Last", lastName.join(" "));
    zohoData.set("PhoneNumber_countrycode", phone);
    zohoData.set("SingleLine", company);
    zohoData.set("Email", email);
    for (const fieldName of ["zf_referrer_name", "zf_redirect_url", "zc_gad"]) {
      zohoData.set(fieldName, form.elements.namedItem(fieldName).value);
    }

    fetch(zohoAction, {
      method: "POST",
      mode: "no-cors",
      body: zohoData,
      keepalive: true
    }).catch(error => console.warn("Could not send the registration to Zoho Forms.", error));
  }

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
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: "Toxic Boss Survival Kit Bootcamp" });
      window.fbq("track", "CompleteRegistration", { content_name: "Toxic Boss Survival Kit Bootcamp" });
    }
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
