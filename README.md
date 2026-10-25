# OutSmart enrollment site

The form saves name, phone, and email to the existing Google Apps Script. After a successful save, it opens the Razorpay payment link. A saved row is a **lead**, not proof of payment.

## Local preview

Run `node serve-local.js` from this folder. Open `http://127.0.0.1:8765/`. The local server includes the same lead function used on Netlify. Do not preview `site/` with a static-only server; that server cannot run the function.

## Netlify deployment

Deploy this project through a Git-connected Netlify build or Netlify CLI. Netlify must build `netlify/functions/leads.js` alongside the static files in `site/`. A drag-and-drop upload of `site/` alone will not include the function.

For CLI deployment, sign in to the correct Netlify account, link this folder to the existing site, then run `netlify deploy --prod --dir=site --functions=netlify/functions` from this folder. Confirm the site identity before the production deploy.

The Google Apps Script webhook was recovered from the earlier working project. A synthetic lead submitted on 26 October 2026 returned `{"saved":true}`. Remove the row named **Codex Connection Test - Delete** from the Sheet.
