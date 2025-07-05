# Release script for Order Booker Target Tracker
# This script handles version bumping, tagging, and pushing to trigger GitHub Actions

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("patch", "minor", "major")]
    [string]$ReleaseType
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-GitStatus {
    $status = git status --porcelain
    if ($status) {
        Write-ColorOutput "❌ Working directory is not clean. Please commit or stash changes first." $ErrorColor
        Write-ColorOutput "Uncommitted changes:" $WarningColor
        git status --short
        return $false
    }
    return $true
}

function Get-CurrentVersion {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    return $packageJson.version
}

function Update-Version {
    param([string]$NewVersion)
    
    Write-ColorOutput "📝 Updating version to $NewVersion..." $InfoColor
    
    # Update package.json
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $packageJson.version = $NewVersion
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    
    # Update Cargo.toml
    $cargoToml = Get-Content "src-tauri/Cargo.toml" -Raw
    $cargoToml = $cargoToml -replace 'version = "[\d\.]+"', "version = `"$NewVersion`""
    $cargoToml | Set-Content "src-tauri/Cargo.toml"
    
    # Update tauri.conf.json
    $tauriConf = Get-Content "src-tauri/tauri.conf.json" | ConvertFrom-Json
    $tauriConf.version = $NewVersion
    $tauriConf | ConvertTo-Json -Depth 10 | Set-Content "src-tauri/tauri.conf.json"
    
    Write-ColorOutput "✅ Version updated successfully!" $SuccessColor
}

function Get-NextVersion {
    param(
        [string]$CurrentVersion,
        [string]$ReleaseType
    )
    
    $versionParts = $CurrentVersion.Split('.')
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    switch ($ReleaseType) {
        "patch" { $patch++ }
        "minor" { 
            $minor++
            $patch = 0
        }
        "major" { 
            $major++
            $minor = 0
            $patch = 0
        }
    }
    
    return "$major.$minor.$patch"
}

function Confirm-Release {
    param(
        [string]$CurrentVersion,
        [string]$NewVersion,
        [string]$ReleaseType
    )
    
    Write-ColorOutput "🚀 Release Summary:" $InfoColor
    Write-ColorOutput "  Current Version: $CurrentVersion" $InfoColor
    Write-ColorOutput "  New Version: $NewVersion" $InfoColor
    Write-ColorOutput "  Release Type: $ReleaseType" $InfoColor
    Write-ColorOutput ""
    
    $confirmation = Read-Host "Do you want to proceed with the release? (y/N)"
    return $confirmation -eq "y" -or $confirmation -eq "Y"
}

# Main execution
try {
    Write-ColorOutput "🎯 Order Booker Target Tracker Release Script" $InfoColor
    Write-ColorOutput "=============================================" $InfoColor
    Write-ColorOutput ""
    
    # Check if git is clean
    if (-not (Test-GitStatus)) {
        exit 1
    }
    
    # Get current version
    $currentVersion = Get-CurrentVersion
    $newVersion = Get-NextVersion -CurrentVersion $currentVersion -ReleaseType $ReleaseType
    
    # Confirm release
    if (-not (Confirm-Release -CurrentVersion $currentVersion -NewVersion $newVersion -ReleaseType $ReleaseType)) {
        Write-ColorOutput "❌ Release cancelled by user." $WarningColor
        exit 0
    }
    
    # Update version in all files
    Update-Version -NewVersion $newVersion
    
    # Run tests/build to ensure everything works
    Write-ColorOutput "🔧 Running build to verify changes..." $InfoColor
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ pnpm install failed!" $ErrorColor
        exit 1
    }
    
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Build failed!" $ErrorColor
        exit 1
    }
    
    Write-ColorOutput "✅ Build successful!" $SuccessColor
    
    # Commit version changes
    Write-ColorOutput "📝 Committing version changes..." $InfoColor
    git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
    git commit -m "chore: bump version to $newVersion"
    
    # Create and push tag
    Write-ColorOutput "🏷️  Creating tag v$newVersion..." $InfoColor
    git tag "v$newVersion"
    
    Write-ColorOutput "🚀 Pushing changes and tag to trigger release..." $InfoColor
    git push origin main
    git push origin "v$newVersion"
    
    Write-ColorOutput "" 
    Write-ColorOutput "🎉 Release process completed successfully!" $SuccessColor
    Write-ColorOutput "🔗 GitHub Actions will now build and create the release." $InfoColor
    Write-ColorOutput "🌐 Check the progress at: https://github.com/your-username/OrderBookerTargetTracker/actions" $InfoColor
    
} catch {
    Write-ColorOutput "❌ An error occurred during the release process:" $ErrorColor
    Write-ColorOutput $_.Exception.Message $ErrorColor
    exit 1
}
