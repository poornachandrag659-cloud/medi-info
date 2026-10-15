# Medi Info

Hospital & doctor appointment platform: **Node API** (zero npm dependencies) + **web app** + **Android app** (Capacitor).

```
server/   API: OTP auth, hospitals, doctors, bookings, Cashfree payments + webhooks + refunds, admin, audit log
www/      Mobile-first web app (also the Android app's UI): maps, booking flow, dashboards
assets/   Icons & splash generated from the Medi Info logo
android/  setup.sh, plus docs/ANDROID_RELEASE.md for signing & Play Store
docs/     Play listing, privacy policy, launch checklist
```

## Run locally
```bash
npm run dev            # Node 22.5+, seeds demo data, http://localhost:3000
npm test               # 10 API tests (auth, concurrency, payments, webhook signature, refunds, access control)
```
Dev mode shows the OTP on screen and uses a **mock payment** (no Cashfree keys needed). Make yourself admin with `ADMIN_PHONES=<your number> npm run dev`.

## Security highlights
OTP login (hashed, single-use, 5 attempts, rate-limited) · signed JWT · role checks on every route · parameterised SQL · **unique DB index prevents double-booking** · payment status confirmed server-to-server with Cashfree (never trusted from the browser) · **HMAC-verified, idempotent webhooks** · amount check · slot holds that auto-expire · auto-refund on late-payment conflicts · CSP / HSTS / security headers · body-size & request limits · patient phone only visible to the booked hospital · in-app account deletion · audit log.

See `docs/LAUNCH_CHECKLIST.md` before going live.
