# Launch checklist: what code alone cannot do

## Must be done before the public release
- [ ] **Replace demo data with real providers.** `server/seed.js` contains *fictional* hospitals/doctors (dev only; it refuses to run in production). Listing fake doctors in a health app breaches Play policy and trust. Onboard real hospitals through the in-app registration → admin approval flow, with their licence numbers verified.
- [ ] **Cashfree account**: complete business KYC, get live keys, set `CASHFREE_ENV=PRODUCTION`, configure the webhook URL, test with sandbox first.
- [ ] **Settlement model decision (important).** Right now online payments settle to *your* Cashfree merchant account. If consultation fees belong to the hospitals, you need Cashfree **Easy Split / vendor payouts** (and hospital KYC) or must instead charge a platform/booking fee only. The pitch deck's model is *provider subscriptions*; decide whether patient payments are a booking fee, a deposit, or the full fee, and get an accountant's input on GST/TDS.
- [ ] **SMS OTP**: register with a DLT provider (India requirement), set `SMS_WEBHOOK_URL`. Until then production login returns 503 by design.
- [ ] **Host the server** (https, persistent disk, daily DB backup). SQLite is fine for a pilot (one instance). Move to Postgres + Redis rate-limits before running multiple instances.
- [ ] **Legal**: lawyer-reviewed privacy policy + terms + refund policy; appoint a grievance officer; DPDP Act consent flow; hospital agreements.
- [ ] **Play Console**: developer account verification, 12-tester/14-day closed test (personal accounts), Data safety + Health declaration, privacy URL, account-deletion URL.
- [ ] **Maps**: OpenStreetMap tiles are free but have a fair-use policy; for production traffic switch to a paid tile provider (MapTiler/Mapbox) or Google Maps SDK. Vendor Leaflet locally (`npm i leaflet`, copy to `www/vendor/`) so maps load inside the app reliably.
- [ ] **Monitoring**: uptime check on `/healthz`, error alerts (Sentry), log shipping (logs are JSON).
- [ ] **Pitch deck fix**: slide 5 contains leftover draft text ("…₹2.4 lakh… Correction: ₹24 lakh/year"). Clean it up, and update the Product slide to show real screenshots of this version.

## Known limitations of this version
- Single-instance SQLite and in-memory rate limits.
- Cashfree JS checkout runs inside the Android WebView; UPI *app-intent* flows work best with Cashfree's native Android SDK. Consider it if UPI conversion in the app is low.
- No push notifications yet (in-app notifications only). Add FCM next.
- Hospital staff use one admin login per hospital (no multi-staff roles yet).
