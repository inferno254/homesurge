#!/usr/bin/env pwsh
# Apply Homesurge schema to Supabase via SQL Editor
# Requires: service_role key and manual dashboard access (no direct SQL API in Supabase)

$projectUrl = "https://vxhsftwixqepzxvctsvp.supabase.co"
$serviceRoleKey = "YOUR_SERVICE_ROLE_KEY"

Write-Host "Homesurge Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase-cli is installed
$cliInstalled = $null -ne (Get-Command supabase -ErrorAction SilentlyContinue)

if ($cliInstalled) {
    Write-Host "✅ Supabase CLI detected. Using it to apply schema..." -ForegroundColor Green
    
    # The CLI approach requires you to be logged in
    Write-Host ""
    Write-Host "Running: supabase db push" -ForegroundColor Yellow
    Write-Host "This will apply schema and seed files from supabase/ folder" -ForegroundColor Gray
    Write-Host ""
    
    # Since we can't authenticate the CLI non-interactively here, provide instructions
    Write-Host "⚠️  To use the CLI, run these commands in your terminal:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  # Link to your Supabase project" -ForegroundColor Gray
    Write-Host "  supabase link --project-ref vxhsftwixqepzxvctsvp" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Push the schema" -ForegroundColor Gray
    Write-Host "  supabase db push" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host "⚠️  Supabase CLI not found. Using manual dashboard approach..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 MANUAL SETUP IN SUPABASE DASHBOARD" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Apply Schema" -ForegroundColor Yellow
Write-Host "  1. Open: https://app.supabase.com" -ForegroundColor Gray
Write-Host "  2. Select your project (vxhsftwixqepzxvctsvp)" -ForegroundColor Gray
Write-Host "  3. Go to SQL Editor → New Query" -ForegroundColor Gray
Write-Host "  4. Copy schema from supabase/schema.sql" -ForegroundColor Gray
Write-Host "  5. Paste and click 'Run'" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Create Storage Bucket" -ForegroundColor Yellow
Write-Host "  1. Go to Storage → Buckets" -ForegroundColor Gray
Write-Host "  2. Create new bucket: 'property-images'" -ForegroundColor Gray
Write-Host "  3. Make it PUBLIC (uncheck 'Private bucket')" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 3: Seed Test Data (Optional)" -ForegroundColor Yellow
Write-Host "  1. SQL Editor → New Query" -ForegroundColor Gray
Write-Host "  2. Copy schema from supabase/seed-nairobi.sql" -ForegroundColor Gray
Write-Host "  3. Paste and click 'Run'" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ After completing the above, run 'npm run dev' to test" -ForegroundColor Green
Write-Host ""
