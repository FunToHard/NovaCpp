# NovaCpp Sandbox Initialization Script
# Automatically installs VS Code, installs NovaCpp VSIX (if present), and opens the workspace.

$ErrorActionPreference = 'Continue'
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  NovaCpp Windows Sandbox Environment Setup     " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$installerPath = "C:\Users\WDAGUtilityAccount\Desktop\Downloads\VSCodeSetup-x64-1.137.0.exe"
$projectDir = "C:\Users\WDAGUtilityAccount\Desktop\NovaCpp"

# 1. Locate and run installer
if (-not (Test-Path $installerPath)) {
    $found = Get-ChildItem -Path "C:\Users\WDAGUtilityAccount\Desktop" -Filter "VSCodeSetup-*.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $installerPath = $found.FullName
    }
}

if (Test-Path $installerPath) {
    Write-Host "[1/3] Installing Visual Studio Code silently from $installerPath..." -ForegroundColor Yellow
    $installArgs = "/VERYSILENT /NORESTART /MERGETASKS=!runcode,addtopath"
    $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
    Write-Host "      VS Code installer finished with exit code: $($process.ExitCode)" -ForegroundColor Green
} else {
    Write-Host "[!] Warning: VS Code installer not found at $installerPath." -ForegroundColor Red
}

# 2. Locate installed VS Code executable and CLI
$possibleCodeExe = @(
    "C:\Program Files\Microsoft VS Code\Code.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\Code.exe")
)
$possibleCodeCmd = @(
    "C:\Program Files\Microsoft VS Code\bin\code.cmd",
    (Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\bin\code.cmd")
)

$codeExe = $possibleCodeExe | Where-Object { Test-Path $_ } | Select-Object -First 1
$codeCmd = $possibleCodeCmd | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $codeExe) {
    Write-Host "[!] Error: Could not locate installed Code.exe." -ForegroundColor Red
    Start-Sleep -Seconds 5
    Exit 1
}

# 3. Auto-install NovaCpp VSIX extension if available in the mapped project
$vsixFile = Get-ChildItem -Path $projectDir -Filter "*.vsix" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($vsixFile -and $codeCmd) {
    Write-Host "[2/3] Installing extension: $($vsixFile.Name)..." -ForegroundColor Yellow
    Start-Process -FilePath $codeCmd -ArgumentList "--install-extension `"$($vsixFile.FullName)`"" -Wait -NoNewWindow
    Write-Host "      Extension $($vsixFile.Name) installed successfully." -ForegroundColor Green
} else {
    Write-Host "[2/3] Skipping VSIX installation (no .vsix found in $projectDir)." -ForegroundColor Gray
}

# 4. Launch VS Code with project folder
Write-Host "[3/3] Launching VS Code with workspace: $projectDir..." -ForegroundColor Cyan
Start-Process -FilePath $codeExe -ArgumentList "`"$projectDir`""

Write-Host "Setup complete! VS Code is now ready inside Windows Sandbox." -ForegroundColor Green
