#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
    red: '\x1b[91m',
    green: '\x1b[92m',
    yellow: '\x1b[93m',
    cyan: '\x1b[96m',
    reset: '\x1b[0m'
};

function colorLog(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
    try {
        return execSync(command, { 
            encoding: 'utf8', 
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
    } catch (error) {
        if (!options.silent) {
            colorLog(`❌ Command failed: ${command}`, 'red');
        }
        throw error;
    }
}

function checkGitStatus() {
    try {
        const status = execCommand('git status --porcelain', { silent: true }).trim();
        if (status) {
            colorLog('❌ Working directory is not clean. Please commit or stash changes first.', 'red');
            colorLog('Uncommitted changes:', 'yellow');
            console.log(execCommand('git status --short', { silent: true }));
            return false;
        }
        return true;
    } catch (error) {
        colorLog('❌ Error checking git status. Make sure you\'re in a git repository.', 'red');
        return false;
    }
}

function getCurrentVersion() {
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packagePath)) {
            colorLog('❌ package.json not found!', 'red');
            return null;
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return packageJson.version;
    } catch (error) {
        colorLog('❌ Error reading package.json', 'red');
        return null;
    }
}

function getNextVersion(currentVersion, releaseType) {
    const versionParts = currentVersion.split('.').map(num => parseInt(num));
    if (versionParts.length !== 3) {
        colorLog(`❌ Invalid version format: ${currentVersion}`, 'red');
        return null;
    }
    
    let [major, minor, patch] = versionParts;
    
    switch (releaseType) {
        case 'patch':
            patch++;
            break;
        case 'minor':
            minor++;
            patch = 0;
            break;
        case 'major':
            major++;
            minor = 0;
            patch = 0;
            break;
        default:
            colorLog(`❌ Invalid release type: ${releaseType}`, 'red');
            return null;
    }
    
    return `${major}.${minor}.${patch}`;
}

function updateVersionInFile(filePath, newVersion) {
    if (!fs.existsSync(filePath)) {
        colorLog(`⚠️  ${filePath} not found, skipping...`, 'yellow');
        return true;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let updatedContent;
        
        if (filePath.endsWith('.json')) {
            // Handle JSON files (package.json, tauri.conf.json)
            const jsonData = JSON.parse(content);
            jsonData.version = newVersion;
            updatedContent = JSON.stringify(jsonData, null, 2) + '\n';
        } else if (filePath.endsWith('.toml')) {
            // Handle TOML files (Cargo.toml)
            updatedContent = content.replace(
                /version\s*=\s*"[^"]*"/,
                `version = "${newVersion}"`
            );
        } else {
            colorLog(`❌ Unsupported file type: ${filePath}`, 'red');
            return false;
        }
        
        fs.writeFileSync(filePath, updatedContent);
        return true;
    } catch (error) {
        colorLog(`❌ Error updating ${filePath}: ${error.message}`, 'red');
        return false;
    }
}

function updateVersion(newVersion) {
    colorLog(`📝 Updating version to ${newVersion}...`, 'cyan');
    
    const files = [
        'package.json',
        'src-tauri/Cargo.toml',
        'src-tauri/tauri.conf.json'
    ];
    
    for (const file of files) {
        if (!updateVersionInFile(file, newVersion)) {
            return false;
        }
    }
    
    colorLog('✅ Version updated successfully!', 'green');
    return true;
}

function confirmRelease(currentVersion, newVersion, releaseType) {
    return new Promise((resolve) => {
        colorLog('🚀 Release Summary:', 'cyan');
        colorLog(`  Current Version: ${currentVersion}`, 'cyan');
        colorLog(`  New Version: ${newVersion}`, 'cyan');
        colorLog(`  Release Type: ${releaseType}`, 'cyan');
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Do you want to proceed with the release? (y/N): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    
    colorLog('🎯 Order Booker Target Tracker Release Script', 'cyan');
    colorLog('=============================================', 'cyan');
    console.log('');
    
    // Validate arguments
    if (args.length === 0) {
        colorLog('❌ Error: Release type is required!', 'red');
        console.log('Usage: node release.js [patch|minor|major]');
        console.log('');
        console.log('Examples:');
        console.log('  node release.js patch   - 1.2.3 → 1.2.4');
        console.log('  node release.js minor   - 1.2.3 → 1.3.0');
        console.log('  node release.js major   - 1.2.3 → 2.0.0');
        process.exit(1);
    }
    
    const releaseType = args[0];
    const validTypes = ['patch', 'minor', 'major'];
    
    if (!validTypes.includes(releaseType)) {
        colorLog(`❌ Error: Invalid release type '${releaseType}'`, 'red');
        colorLog('Valid options: patch, minor, major', 'red');
        process.exit(1);
    }
    
    try {
        // Check git status
        colorLog('🔍 Checking git status...', 'cyan');
        if (!checkGitStatus()) {
            process.exit(1);
        }
        
        // Get current version
        colorLog('📋 Getting current version...', 'cyan');
        const currentVersion = getCurrentVersion();
        if (!currentVersion) {
            process.exit(1);
        }
        
        // Calculate new version
        const newVersion = getNextVersion(currentVersion, releaseType);
        if (!newVersion) {
            process.exit(1);
        }
        
        // Confirm release
        const confirmed = await confirmRelease(currentVersion, newVersion, releaseType);
        if (!confirmed) {
            colorLog('❌ Release cancelled by user.', 'yellow');
            process.exit(0);
        }
        
        // Update version in all files
        if (!updateVersion(newVersion)) {
            process.exit(1);
        }
        
        // Install dependencies and build
        colorLog('🔧 Running build to verify changes...', 'cyan');
        execCommand('pnpm install');
        execCommand('pnpm build');
        colorLog('✅ Build successful!', 'green');
        
        // Commit version changes
        colorLog('📝 Committing version changes...', 'cyan');
        execCommand('git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json');
        execCommand(`git commit -m "chore: bump version to ${newVersion}"`);
        
        // Create and push tag
        colorLog(`🏷️  Creating tag v${newVersion}...`, 'cyan');
        execCommand(`git tag "v${newVersion}"`);
        
        colorLog('🚀 Pushing changes and tag to trigger release...', 'cyan');
        execCommand('git push origin main');
        execCommand(`git push origin "v${newVersion}"`);
        
        console.log('');
        colorLog('🎉 Release process completed successfully!', 'green');
        colorLog('🔗 GitHub Actions will now build and create the release.', 'cyan');
        colorLog('🌐 Check the progress at: https://github.com/your-username/OrderBookerTargetTracker/actions', 'cyan');
        
    } catch (error) {
        colorLog(`❌ An error occurred during the release process:`, 'red');
        colorLog(error.message, 'red');
        process.exit(1);
    }
}

// Handle graceful exit
process.on('SIGINT', () => {
    colorLog('\n❌ Release process interrupted by user.', 'yellow');
    process.exit(0);
});

// Run the script
main();