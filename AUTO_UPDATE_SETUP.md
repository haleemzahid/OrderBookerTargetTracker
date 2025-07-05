# Tauri Auto-Update Setup Guide (Windows Only)

## Overview
This guide will help you set up auto-update for your Tauri React app using GitHub Releases as the update server. This setup is configured specifically for Windows.

## What's been set up:

### 1. Updater Plugin
- ✅ Installed `tauri-plugin-updater` and `tauri-plugin-process`
- ✅ Generated signing keys in `~/.tauri/orderbookertargettracker.key`
- ✅ Configured `tauri.conf.json` with updater settings (Windows targets: MSI and NSIS)
- ✅ Added permissions to `desktop.json`

### 2. Frontend Integration
- ✅ Created `UpdateChecker` component in `src/components/common/UpdateChecker.tsx`
- ✅ Added UpdateChecker to the Header component
- ✅ Component provides:
  - Manual update checking
  - Automatic periodic checks (every 30 minutes)
  - Progress tracking during download
  - User-friendly update prompts

### 3. GitHub Actions Workflow
- ✅ Created `.github/workflows/release.yml` for automated Windows releases
- ✅ Builds MSI and NSIS installers for Windows
- ✅ Automatically creates GitHub releases with update artifacts

## Next Steps:

### 1. Set up GitHub Repository
1. Create a new repository on GitHub named `OrderBookerTargetTracker`
2. Push your code to the repository
3. Update the endpoint URL in `tauri.conf.json`:
   ```json
   "endpoints": [
     "https://github.com/YOUR_USERNAME/OrderBookerTargetTracker/releases/latest/download/latest.json"
   ]
   ```

### 2. Set up GitHub Secrets
You need to add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Add these secrets:

#### TAURI_SIGNING_PRIVATE_KEY
```bash
# Copy the content of your private key file
cat ~/.tauri/orderbookertargettracker.key
```
Copy the entire content and paste it as the secret value.

#### TAURI_SIGNING_PRIVATE_KEY_PASSWORD
This is the password you entered when generating the keys.

### 3. Create Your First Release
1. Update the version in `package.json` and `src-tauri/tauri.conf.json`
2. Create a git tag and push it:
   ```bash
   git add .
   git commit -m "feat: add auto-update functionality"
   git tag v0.1.0
   git push origin main
   git push origin v0.1.0
   ```

### 4. Test the Update Process
1. Build and distribute your app to users
2. Create a new version (e.g., v0.1.1)
3. Push a new tag - the workflow will automatically create a release
4. The app will automatically check for updates and notify users

## Development Commands:

### Set Environment Variables for Local Building
```powershell
# Set the private key path
$env:TAURI_SIGNING_PRIVATE_KEY="D:\repos\tauri\OrderBookerTargetTracker\~\.tauri\orderbookertargettracker.key"

# Set the password (if you set one)
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="your_password_here"

# Build with updater artifacts
pnpm tauri build
```

### Manual Update Check
The UpdateChecker component in your app provides:
- A "Check for Updates" button in the header
- Automatic checks every 30 minutes
- Download progress tracking
- Automatic app restart after update

## File Structure:
```
.github/workflows/release.yml          # GitHub Actions workflow
src/components/common/UpdateChecker.tsx # Update checker component
src-tauri/tauri.conf.json             # Tauri configuration with updater
src-tauri/capabilities/desktop.json   # Permissions for updater
~/.tauri/orderbookertargettracker.key  # Private key (keep secret!)
~/.tauri/orderbookertargettracker.key.pub # Public key (in config)
```

## Important Notes:
1. **Keep your private key secure** - never commit it to version control
2. **The public key is safe** - it's already in your tauri.conf.json
3. **Users need to install the first version manually** - updates work from v0.1.0 onwards
4. **Updates are signed and verified** - ensures security and authenticity
5. **The app will restart automatically** after update installation

## Troubleshooting:
- If updates aren't working, check the browser console for errors
- Ensure your GitHub repository is public or the release is public
- Verify that the endpoint URL in tauri.conf.json matches your repository
- Check that GitHub secrets are correctly set
