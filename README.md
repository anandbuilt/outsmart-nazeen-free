# OutSmart enrollment site

The form saves name, phone, and email to the existing Google Apps Script. After a successful save, it opens the Razorpay payment link. A saved row is a **lead**, not proof of payment.

## Local preview

Run `node serve-local.js` from this folder. Open `http://127.0.0.1:8765/`. The local server includes the same lead function used on Netlify. Do not preview `site/` with a static-only server; that server cannot run the function.

## Netlify deployment

Deploy this project through a Git-connected Netlify build or Netlify CLI. Netlify must build `netlify/functions/leads.js` alongside the static files in `site/`. A drag-and-drop upload of `site/` alone will not include the function.

For CLI deployment, sign in to the correct Netlify account, link this folder to the existing site, then run `netlify deploy --prod --dir=site --functions=netlify/functions` from this folder. Confirm the site identity before the production deploy.

The function now uses the new Google Apps Script deployment supplied on 26 October 2026. A direct synthetic submission returned HTTP 200 with `{"status":"success"}`. Remove `codex-new-webhook-retest@example.com` from the new Sheet. Earlier tests against the old Sheet used `codex-test@example.com`, `codex-hosted-test@example.com`, and `codex-browser-test@example.com`; remove those rows from the old Sheet if present.

The hosted Netlify site still needs this updated function deployed. Until then, it sends leads to the old Apps Script URL.

The function sends `fullName` because the supplied Apps Script reads `data.fullName`. It marks the row `Pending`; this is not payment confirmation. The supplied Apps Script fills the "Paid At" column with the current date even for pending leads. Change that script if the column must represent actual payment time.
