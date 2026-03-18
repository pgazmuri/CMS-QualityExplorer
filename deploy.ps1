# deploy.ps1 — Build locally and zip-deploy to Azure App Service
param(
    [string]$AppName = "cms-quality-explorer",
    [string]$ResourceGroup = "TeamsTelehealth",
    [string]$Plan = "asp-cvsvirtualcaresupport",
    [string]$Location = "eastus2"
)

$ErrorActionPreference = "Continue"

Write-Host "=== 1. Creating web app (if needed) ===" -ForegroundColor Cyan
$exists = $null
try { $exists = az webapp show --name $AppName --resource-group $ResourceGroup 2>&1 | Out-String } catch {}
if (-not $exists -or $exists -match "ERROR") {
    az webapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --plan $Plan `
        --runtime "NODE:22-lts" `
        --startup-file "node server.js"
    if ($LASTEXITCODE -ne 0) { throw "Failed to create web app" }
    Write-Host "Web app created."
} else {
    Write-Host "Web app already exists."
}

# Configure app settings
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings WEBSITES_PORT=3000 SCM_DO_BUILD_DURING_DEPLOYMENT=false NODE_ENV=production | Out-Null

Write-Host "=== 2. Building Next.js ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

Write-Host "=== 3. Assembling standalone package ===" -ForegroundColor Cyan
$staging = ".\.deploy-staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

# Copy standalone server (use -Force to include hidden folders like .next)
Copy-Item -Path ".\.\.next\standalone\*" -Destination $staging -Recurse -Force

# Copy static assets (Next.js standalone doesn't include these)
Copy-Item -Path ".\.\.next\static" -Destination "$staging\.next\static" -Recurse -Force

# Copy public folder
Copy-Item -Path ".\public" -Destination "$staging\public" -Recurse -Force

# Copy CMS Data files
Copy-Item -Path ".\CMS Data" -Destination "$staging\CMS Data" -Recurse -Force

# Install Linux-x64 DuckDB native bindings (build runs on Windows, but deploy target is Linux)
Write-Host "Installing Linux DuckDB bindings..."
$linuxPkg = "@duckdb/node-bindings-linux-x64"
npm pack $linuxPkg --pack-destination "$staging" 2>&1 | Out-Null
$tgz = Get-ChildItem "$staging\duckdb-node-bindings-linux-x64-*.tgz" | Select-Object -First 1
if ($tgz) {
    Push-Location $staging
    tar -xzf $tgz.Name
    $pkgDir = "node_modules\@duckdb\node-bindings-linux-x64"
    New-Item -ItemType Directory -Path $pkgDir -Force | Out-Null
    Copy-Item -Path ".\package\*" -Destination $pkgDir -Recurse -Force
    Remove-Item ".\package" -Recurse -Force
    Remove-Item $tgz.Name -Force
    Pop-Location
    Write-Host "Linux DuckDB bindings installed."
}

# Remove Windows-only DuckDB bindings (not needed on Linux)
$winBindings = "$staging\node_modules\@duckdb\node-bindings-win32-x64"
if (Test-Path $winBindings) { Remove-Item $winBindings -Recurse -Force }

# Remove typescript from standalone (not needed at runtime)
$tsDir = "$staging\node_modules\typescript"
if (Test-Path $tsDir) { Remove-Item $tsDir -Recurse -Force }

# Remove dev/build artifacts that get traced into standalone
foreach ($item in @("e2e", "src", "app-logs", "app-logs.zip", "deploy.zip", "deploy.ps1",
    "eslint.config.mjs", "jest.config.ts", "jest.setup.ts", "playwright.config.ts",
    "postcss.config.mjs", "tsconfig.json", "components.json", "README.md",
    "next.config.ts", "package-lock.json", "next-env.d.ts")) {
    $p = Join-Path $staging $item
    if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}

Write-Host "=== 4. Creating zip ===" -ForegroundColor Cyan
$zipPath = Join-Path $PSScriptRoot "deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Use .NET ZipFile to create zip with forward-slash paths (Linux-compatible)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stagingFull = (Resolve-Path $staging).Path
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
Get-ChildItem $stagingFull -Recurse -Force -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($stagingFull.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $_.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
}
$zip.Dispose()

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "Zip created: $zipSize MB"

Write-Host "=== 5. Deploying ===" -ForegroundColor Cyan
$deployOutput = az webapp deploy `
    --name $AppName `
    --resource-group $ResourceGroup `
    --src-path $zipPath `
    --type zip `
    --async false 2>&1 | Out-String
if ($deployOutput -match '"status":\s*"RuntimeSuccessful"') {
    Write-Host "Deployment successful!" -ForegroundColor Green
} elseif ($deployOutput -match 'error' -and $deployOutput -notmatch 'RuntimeSuccessful') {
    Write-Host $deployOutput
    throw "Deployment failed"
} else {
    Write-Host $deployOutput
}

Write-Host "=== 6. Cleanup ===" -ForegroundColor Cyan
Remove-Item $staging -Recurse -Force

Write-Host ""
Write-Host "Deployed to: https://$AppName.azurewebsites.net" -ForegroundColor Green
