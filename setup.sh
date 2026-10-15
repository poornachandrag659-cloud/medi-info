#!/usr/bin/env bash
# One-time Android project setup. Run on a machine with Node 22+, JDK 21 and Android Studio (SDK 35) installed.
# NOTE: written for Capacitor 7; verify against https://capacitorjs.com/docs/android after upgrades.
set -euo pipefail
cd "$(dirname "$0")/.."
npm install
[ -d android/app ] || npx cap add android
npx capacitor-assets generate --android          # icons + splash from ./assets (made from your logo)
npx cap sync android

MAN=android/app/src/main/AndroidManifest.xml
grep -q ACCESS_FINE_LOCATION "$MAN" || sed -i 's|<uses-permission android:name="android.permission.INTERNET" />|&\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />|' "$MAN"
# UPI app-intent visibility (Android 11+) so payment apps like GPay/PhonePe/Paytm can be opened from checkout
grep -q 'upi://pay' "$MAN" || sed -i 's|</manifest>|    <queries><intent><action android:name="android.intent.action.VIEW" /><data android:scheme="upi" android:host="pay" /></intent></queries>\n</manifest>|' "$MAN"

echo "Done. Next: set API URL in www/config.js, then follow docs/ANDROID_RELEASE.md to sign and build the .aab"
