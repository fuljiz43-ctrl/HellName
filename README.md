# 🛡️ NullBrowser

**Mini Android browser with maximum adblocking power.**

Built with Capacitor + Vanilla JS. Blocks ads, trackers, coinminers, and social widgets at multiple layers.

---

## ⚡ Features

| Feature | Details |
|---|---|
| **EasyList** | Blocks banner, video & popup ads |
| **EasyPrivacy** | Kills analytics & tracking scripts |
| **Peter Lowe's List** | Blocks known ad-serving domains |
| **Anti-Coinminer** | Blocks cryptominer scripts |
| **Fanboy Social** | Removes social media widgets |
| **Element Hiding** | CSS injection to hide ad containers |
| **Request Interception** | Blocks at fetch + XHR level in JS |
| **Native Android Layer** | `shouldInterceptRequest` blocks at WebView level |
| **Stats Dashboard** | Live count of ads blocked, trackers killed, time saved |

---

## 🔨 Build APK via GitHub Actions (recommended)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/nullbrowser.git
git push -u origin main
```

### Step 2: Watch the build

1. Go to your repo on GitHub
2. Click **Actions** tab
3. You'll see `Build NullBrowser APK` running automatically
4. Wait ~5-10 minutes for it to complete

### Step 3: Download APK

1. Click on the completed workflow run
2. Scroll to **Artifacts** at the bottom
3. Download `NullBrowser-Debug-APK`
4. Install on your Android device

> **Enable Unknown Sources:**
> Settings → Security → Unknown Sources → ON
> (or Settings → Apps → Special Access → Install Unknown Apps)

---

## 🏷️ Create a Release

To get a download link in GitHub Releases:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically build and attach APKs to the release.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Android Studio
- Java 17

### Setup

```bash
# Install dependencies
npm install

# Initialize Android platform
npx cap add android

# Sync web assets
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Build locally

```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🧱 Architecture

```
NullBrowser/
├── src/
│   ├── index.html          # Main UI
│   ├── adblock.js          # AdBlock engine (JS layer)
│   └── browser.js          # Browser logic
├── android-native/
│   └── AdBlockWebViewClient.java  # Native Android blocking
├── .github/workflows/
│   └── build-apk.yml       # GitHub Actions CI/CD
└── capacitor.config.json   # Capacitor config
```

### Blocking Layers

```
Request comes in
      │
      ▼
[Layer 1] Android shouldInterceptRequest (native)
      │ blocked? → return empty response
      ▼
[Layer 2] JS fetch/XHR intercept
      │ blocked? → return empty Response
      ▼
[Layer 3] DOM MutationObserver (element removal)
      │ blocked? → node.remove()
      ▼
[Layer 4] CSS element hiding (injected stylesheet)
      │
      ▼
Request allowed ✅
```

---

## 📊 Block Lists Used

- **EasyList** — ~70,000 rules
- **EasyPrivacy** — ~15,000 rules  
- **Peter Lowe's Adservers** — ~3,000 domains
- **Anti-Coinminer** — ~800 rules
- **Fanboy's Social Blocking** — ~20,000 rules

Total: ~108,000+ rules

---

## 🔐 Signing for Release (optional)

Add these GitHub Secrets for signed release APKs:
- `KEYSTORE_BASE64` — Base64-encoded keystore file
- `STORE_PASSWORD` — Keystore password
- `KEY_ALIAS` — Key alias
- `KEY_PASSWORD` — Key password

---

## 📄 License

MIT — free to use, modify, distribute.
