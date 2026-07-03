# Script to strip metadata from all media files
# Usage: .\strip-metadata.ps1 [path]
# If no path is provided, uses ./public relative to script location
param(
    [string]$basePath = (Join-Path $PSScriptRoot "public")
)
$processed = 0
$errors = 0

Write-Host "Starting metadata stripping process..." -ForegroundColor Green
Write-Host ""

# Process all media files recursively
Get-ChildItem -Path $basePath -Recurse -Include *.mp4,*.mov,*.avi,*.png,*.jpg,*.jpeg,*.MP4,*.MOV,*.AVI,*.PNG,*.JPG,*.JPEG | ForEach-Object {
    $processed++
    $file = $_
    $tempFile = Join-Path $file.DirectoryName "$($file.BaseName)_temp$($file.Extension)"
    
    Write-Host "[$processed] Processing: $($file.FullName)" -ForegroundColor Cyan
    
    try {
        if ($file.Extension -match '\.(mp4|mov|avi|MP4|MOV|AVI)$') {
            # Process video files - copy streams without re-encoding
            ffmpeg -i $file.FullName -map_metadata -1 -c:v copy -c:a copy $tempFile -y -loglevel error -hide_banner
            if ($LASTEXITCODE -eq 0 -and (Test-Path $tempFile)) {
                Move-Item -Force $tempFile $file.FullName
                Write-Host "  ✓ Video processed successfully" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Error processing video" -ForegroundColor Red
                $errors++
                if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
            }
        } else {
            # Process image files
            ffmpeg -i $file.FullName -map_metadata -1 $tempFile -y -loglevel error -hide_banner
            if ($LASTEXITCODE -eq 0 -and (Test-Path $tempFile)) {
                Move-Item -Force $tempFile $file.FullName
                Write-Host "  ✓ Image processed successfully" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Error processing image" -ForegroundColor Red
                $errors++
                if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
            }
        }
    } catch {
        Write-Host "  ✗ Exception: $_" -ForegroundColor Red
        $errors++
        if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Completed! Processed $processed files." -ForegroundColor Green
if ($errors -gt 0) {
    Write-Host "Errors: $errors" -ForegroundColor Red
} else {
    Write-Host "All files processed successfully!" -ForegroundColor Green
}
Write-Host "========================================" -ForegroundColor Yellow

