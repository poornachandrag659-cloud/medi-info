# Build & publish the Android app

The Android app is the same `www/` app wrapped with Capacitor (package `in.mediinfo.app`). It calls your deployed API.

## 1. Deploy the server first
The app needs a public **https** API. Any Node 22 host works (Render, Railway, Fly.io, a VPS). Use the included `Dockerfile`, mount a persistent volume at `/data`, set env vars from `.env.example`, and add your Cashfree webhook URL: `https://<your-api>/api/payments/webhook`.
Then edit `www/config.js`:
```js
window.MEDI_CONFIG = { API: "https://api.mediinfo.in" };
```
Also add that origin handling: Capacitor serves the app from `https://localhost`, which the server already allows via CORS.

## 2. Generate the Android project
```bash
./android/setup.sh        # npm install, cap add android, icons/splash from ./assets, permissions
npx cap open android      # opens Android Studio
```

## 3. Create your signing key (ONCE. Back it up; losing it = cannot update the app)
```bash
keytool -genkeypair -v -keystore mediinfo-release.jks -alias mediinfo -keyalg RSA -keysize 2048 -validity 10000
```
Create `android/key.properties` (git-ignored):
```
storeFile=/absolute/path/mediinfo-release.jks
storePassword=...
keyAlias=mediinfo
keyPassword=...
```
In `android/app/build.gradle` add above `android {`:
```groovy
def kp = new Properties(); def kf = rootProject.file("key.properties"); if (kf.exists()) kp.load(new FileInputStream(kf))
```
and inside `android { }`:
```groovy
signingConfigs { release { storeFile file(kp['storeFile']); storePassword kp['storePassword']; keyAlias kp['keyAlias']; keyPassword kp['keyPassword'] } }
buildTypes { release { signingConfig signingConfigs.release; minifyEnabled true; shrinkResources true } }
```
(With Play App Signing, which is the default, this is your *upload* key.)

## 4. Build the bundle
Bump `versionCode`/`versionName` in `android/app/build.gradle` for every release, then:
```bash
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```
Test first with `npx cap run android` on a real phone, including a **sandbox** Cashfree payment and "near me" location.

## 5. Publish on Google Play
1. Play Console → your developer account (identity verification required) → **Create app**.
2. Upload `app-release.aab` to **Internal testing**, then **Closed testing**. *Personal* developer accounts created after Nov 2023 must run a closed test with **12+ testers for 14 days** before production access. Organisation accounts are exempt.
3. Fill **Store listing** from `docs/PLAY_STORE.md` (icon: `www/icons/icon-512.png`, feature graphic: `assets/play-feature-graphic.png`, 2–8 phone screenshots).
4. **App content**: privacy policy URL (host `docs/PRIVACY_POLICY.md` as a web page), Data safety form (answers in `docs/PLAY_STORE.md`), **Health apps declaration**, target audience 18+, ads: none, **account deletion**: in-app (Account → Delete my account) and web URL.
5. Send for review → **Production**.
