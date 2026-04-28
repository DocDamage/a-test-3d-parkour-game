# check.ps1 — Mechanical validation for agent-generated code (Windows).
# Run this before committing to catch syntax errors and file size violations.

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$jsDir = Join-Path $repoRoot "js"
$errors = 0

Write-Host "=== Syntax Check (node -c) ===" -ForegroundColor Cyan
Get-ChildItem -Path $jsDir -Filter "*.js" | ForEach-Object {
    $result = node -c $_.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAIL: $($_.Name)" -ForegroundColor Red
        $errors++
    }
}

Write-Host "=== File Size Check ===" -ForegroundColor Cyan
$maxLines = 2000
Get-ChildItem -Path $jsDir -Filter "*.js" | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    if ($lines -gt $maxLines) {
        Write-Host "  WARN: $($_.Name) has ${lines} lines (max ${maxLines})" -ForegroundColor Yellow
    }
}

Write-Host "=== Module Count Check ===" -ForegroundColor Cyan
$moduleCount = (Get-ChildItem -Path $jsDir -Filter "*.js").Count
Write-Host "  ${moduleCount} JS modules"

Write-Host "=== Unit Tests ===" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot "unit-tests.mjs")
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL: unit tests" -ForegroundColor Red
    $errors++
}

Write-Host "=== Balance Simulation ===" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot "balance-sim.mjs")
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL: balance simulation" -ForegroundColor Red
    $errors++
}

Write-Host "=== Docs Freshness Check ===" -ForegroundColor Cyan
$docs = @("ARCHITECTURE.md", "DESIGN.md", "QUALITY.md")
foreach ($doc in $docs) {
    $path = Join-Path (Join-Path $repoRoot "docs") $doc
    if (-not (Test-Path $path)) {
        Write-Host "  FAIL: docs/${doc} missing" -ForegroundColor Red
        $errors++
    }
}

Write-Host "=== Browser Smoke Check ===" -ForegroundColor Cyan
node (Join-Path $PSScriptRoot "browser-smoke.mjs")
if ($LASTEXITCODE -ne 0) {
    Write-Host "  FAIL: browser smoke" -ForegroundColor Red
    $errors++
}

if ($errors -gt 0) {
    Write-Host ""
    Write-Host "${errors} error(s) found. Fix before committing." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All checks passed." -ForegroundColor Green
