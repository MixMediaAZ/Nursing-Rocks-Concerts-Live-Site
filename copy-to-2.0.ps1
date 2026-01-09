# Meticulous Project Copy Script
# Copies all essential files to version 2.0, excluding build artifacts

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
Write-Host "[1/5] Creating destination directory..." -ForegroundColor Green
if (Test-Path $dest) {
    Write-Host "WARNING: Destination already exists. Removing..." -ForegroundColor Yellow
    Remove-Item -Path $dest -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# Define exclusions (folders to skip)
$excludeFolders = @(
    'node_modules',
    'dist',
    '.git',
    '.cache',
    '.turbo',
    'build',
    '.next',
    '.qodo',
    '.config',
    '.cursor'
)

# Define file patterns to exclude
$excludeFilePatterns = @(
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    '*.tmp',
    '*.temp'
)

Write-Host "[2/5] Copying essential directories..." -ForegroundColor Green

# Essential directories to copy
$essentialDirs = @(
    'api',
    'attached_assets',
    'client',
    'migrations',
    'public',
    'scripts',
    'server',
    'shared',
    'plans'
)

$copiedFiles = 0
$skippedFiles = 0

foreach ($dir in $essentialDirs) {
    $sourcePath = Join-Path $source $dir
    if (Test-Path $sourcePath) {
        Write-Host "  Copying: $dir/" -ForegroundColor Cyan
        
        # Use robocopy for efficient copying with exclusions
        $excludeArgs = $excludeFolders | ForEach-Object { "/XD", $_ }
        $excludeFileArgs = $excludeFilePatterns | ForEach-Object { "/XF", $_ }
        
        $robocopyArgs = @(
            $sourcePath,
            (Join-Path $dest $dir),
            "/E",           # Copy subdirectories including empty ones
            "/NFL",         # No file list
            "/NDL",         # No directory list
            "/NJH",         # No job header
            "/NJS",         # No job summary
            "/NC",          # No class
            "/NS",          # No size
            "/NP"           # No progress
        ) + $excludeArgs + $excludeFileArgs
        
        $result = robocopy @robocopyArgs
        
        # Robocopy exit codes: 0-7 are success, 8+ are errors
        if ($LASTEXITCODE -lt 8) {
            Write-Host "    ✓ Completed" -ForegroundColor Green
        } else {
            Write-Host "    ⚠ Warning: Some files may not have copied" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Skipping: $dir/ (not found)" -ForegroundColor Gray
    }
}

Write-Host "[3/5] Copying root configuration files..." -ForegroundColor Green

# Essential root files to copy
$essentialFiles = @(
    '.dockerignore',
    '.env',
    '.gitignore',
    '.replit',
    '.vercelignore',
    'BackBlaze - nursing-rocks-uploader key.txt',
    'BUG_CHECK_REPORT.md',
    'DEPLOYMENT.md',
    'Dockerfile',
    'drizzle.config.ts',
    'EMPLOYER_SYSTEM_DEPLOYMENT.md',
    'env.example',
    'generated-icon.png',
    'package.json',
    'package-lock.json',
    'postcss.config.js',
    'PRODUCTION_READINESS.md',
    'products.json',
    'README.md',
    'response.json',
    'run-employers-migration.js',
    'run-migration.js',
    'run-migrations.js',
    'tailwind.config.ts',
    'theme.json',
    'tsconfig.json',
    'vercel.json',
    'VIDEO_SETUP_GUIDE.md',
    'vite.config.ts'
)

foreach ($file in $essentialFiles) {
    $sourcePath = Join-Path $source $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination (Join-Path $dest $file) -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
        $copiedFiles++
    } else {
        Write-Host "  ⚠ $file (not found)" -ForegroundColor DarkGray
        $skippedFiles++
    }
}

Write-Host "[4/5] Creating empty directories for runtime..." -ForegroundColor Green

# Create directories that should exist but might be empty
$runtimeDirs = @(
    'uploads',
    'uploads/gallery'
)

foreach ($dir in $runtimeDirs) {
    $dirPath = Join-Path $dest $dir
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
        Write-Host "  ✓ Created: $dir/" -ForegroundColor Gray
    }
}

Write-Host "[5/5] Verifying copy..." -ForegroundColor Green

# Verify critical files exist
$criticalFiles = @(
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vercel.json',
    'VIDEO_SETUP_GUIDE.md',
    'client/index.html',
    'server/index.ts',
    'api/index.ts'
)

$allCriticalFilesExist = $true
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $dest $file
    if (-not (Test-Path $filePath)) {
        Write-Host "  ✗ MISSING: $file" -ForegroundColor Red
        $allCriticalFilesExist = $false
    }
}

if ($allCriticalFilesExist) {
    Write-Host "  ✓ All critical files verified" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Copy Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Destination: $dest" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd `"$dest`"" -ForegroundColor White
Write-Host "  2. npm install" -ForegroundColor White
Write-Host "  3. npm run build" -ForegroundColor White
Write-Host ""
Write-Host "Note: node_modules and dist folders were excluded (will be regenerated)" -ForegroundColor Gray
Write-Host ""

# Calculate approximate size
$destSize = (Get-ChildItem -Path $dest -Recurse -File | Measure-Object -Property Length -Sum).Sum
$destSizeMB = [math]::Round($destSize / 1MB, 2)
Write-Host "Total size copied: $destSizeMB MB" -ForegroundColor Cyan
Write-Host ""

