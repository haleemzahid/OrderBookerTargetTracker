@echo off
echo Testing Tauri Auto-Update Setup for Windows...
echo.

echo 1. Checking if signing keys exist...
if exist "~\.tauri\orderbookertargettracker.key" (
    echo ✅ Private key found
) else (
    echo ❌ Private key not found
)

if exist "~\.tauri\orderbookertargettracker.key.pub" (
    echo ✅ Public key found
) else (
    echo ❌ Public key not found
)

echo.
echo 2. Environment variables needed for building:
echo Set these before running 'pnpm tauri build':
echo.
echo $env:TAURI_SIGNING_PRIVATE_KEY="D:\repos\tauri\OrderBookerTargetTracker\~\.tauri\orderbookertargettracker.key"
echo $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="your_password_here"
echo.

echo 3. Next steps:
echo - Update the GitHub repository URL in tauri.conf.json
echo - Set up GitHub secrets (TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD)
echo - Create a tag and push to trigger the first release
echo.
pause
