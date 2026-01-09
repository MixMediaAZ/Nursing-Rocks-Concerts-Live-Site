# Meticulous Project Copy Script - Simplified
$ErrorActionPreference = "Stop"

$source = "C:\Users\Dave\Downloads\Nursing-Rocks-Concerts-Live-Site v1.0\Nursing-Rocks-Concerts-Live-Site"
$dest = "C:\Users\Dave\Downloads\Nursing-Rocks-Concerts-Live-Site v1.0\Nursing-Rocks-Concerts-Live-Site - 2.0"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Meticulous Project Copy to v2.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $source" -ForegroundColor Yellow
Write-Host "Destination: $dest" -ForegroundColor Yellow
Write-Host ""

# Verify source exists
if (-not (Test-Path $source)) {
    Write-Host "ERROR: Source directory does not exist!" -ForegroundColor Red
    exit 1
}

# Create destination directory
Write-Host "[1/3] Preparing destination directory..." -ForegroundColor Green
if (Test-Path $dest) {
    Write-Host "WARNING: Destination already exists. Removing..." -ForegroundColor Yellow
    Remove-Item -Path $dest -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "[2/3] Copying all files (excluding build artifacts)..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

# Use robocopy with proper exclusions
$robocopyResult = robocopy $source $dest /E /XD node_modules dist .git .cache .turbo build .next .qodo .config .cursor /XF *.log .DS_Store Thumbs.db *.tmp *.temp /NFL /NDL /NP /R:2 /W:1

# Robocopy exit codes: 0-7 are success, 8+ are errors
if ($LASTEXITCODE -lt 8) {
    Write-Host "✓ Copy completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Some files may not have copied (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Verifying critical files..." -ForegroundColor Green

# Verify critical files exist
$criticalFiles = @(
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vercel.json',
    'VIDEO_SETUP_GUIDE.md',
    'client\index.html',
    'server\index.ts',
    'api\index.ts',
    '.env'
)

$allGood = $true
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $dest $file
    if (Test-Path $filePath) {
        Write-Host "  ✓ $file" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ MISSING: $file" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "Copy Complete - All Critical Files Present!" -ForegroundColor Green
} else {
    Write-Host "Copy Complete - Some Files Missing!" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Destination: $dest" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd `"$dest`"" -ForegroundColor White
Write-Host "  2. npm install" -ForegroundColor White
Write-Host "  3. npm run build" -ForegroundColor White
Write-Host ""
Write-Host "Excluded folders (will regenerate):" -ForegroundColor Gray
Write-Host "  - node_modules (reinstall with npm install)" -ForegroundColor DarkGray
Write-Host "  - dist (rebuild with npm run build)" -ForegroundColor DarkGray
Write-Host "  - .git (version control history)" -ForegroundColor DarkGray
Write-Host ""

# Calculate size
try {
    $destSize = (Get-ChildItem -Path $dest -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $destSizeMB = [math]::Round($destSize / 1MB, 2)
    Write-Host "Total size copied: $destSizeMB MB" -ForegroundColor Cyan
} catch {
    Write-Host "Size calculation skipped" -ForegroundColor DarkGray
}
Write-Host ""

