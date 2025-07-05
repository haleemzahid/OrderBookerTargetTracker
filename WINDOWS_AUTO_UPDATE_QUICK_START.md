# Windows Auto-Update Setup - Quick Start

## ✅ What's Done:
1. **Updater plugin installed** - Your app can now check for and install updates
2. **Update UI added** - "Check for Updates" button in the header
3. **GitHub Actions workflow** - Automatically builds and releases Windows installers
4. **Signing keys generated** - Security keys for update verification

## 🔧 What You Need To Do:

### 1. Update GitHub Repository URL
Edit `src-tauri/tauri.conf.json` and replace `YOUR_USERNAME` with your actual GitHub username:
```json
"endpoints": [
  "https://github.com/YOUR_USERNAME/OrderBookerTargetTracker/releases/latest/download/latest.json"
]
```

### 2. Set Up GitHub Secrets
In your GitHub repository, go to Settings > Secrets and variables > Actions and add:
- **TAURI_SIGNING_PRIVATE_KEY**: Copy content from `~\.tauri\orderbookertargettracker.key`
- **TAURI_SIGNING_PRIVATE_KEY_PASSWORD**: The password you set when generating keys

### 3. Create Your First Release
```bash
git add .
git commit -m "feat: add auto-update functionality"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

## 🚀 How It Works:
1. Push a new tag → GitHub Actions builds Windows installers
2. Users get update notification in the app
3. They click "Download & Install" → App updates and restarts
4. Done! 🎉

## 📁 Files Created/Modified:
- `src/components/common/UpdateChecker.tsx` - Update checker UI
- `src/components/layouts/Header.tsx` - Added update button
- `src-tauri/tauri.conf.json` - Updater configuration
- `.github/workflows/release.yml` - Build automation
- `~/.tauri/orderbookertargettracker.key*` - Signing keys (keep private!)

That's it! The setup is complete for Windows-only auto-updates. 🎯
