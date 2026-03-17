$jsContent = Get-Content -Raw "c:\Users\dell\.gemini\antigravity\scratch\apple-connect-site\data\products.js"
$jsContent = $jsContent -replace "window\.PRODUCTS\s*=\s*", ""
# The JS might contain trailing semicolon or comments at the end
# Or might have single quotes, trailing commas, or comments blocking JSON parsing
# Instead of full JSON parse, let's use regex to find all iphone blocks
$blocks = $jsContent -split '\{'
$iphoneBlocks = $blocks | Where-Object { $_ -match '"category"\s*:\s*"iphone"' }
$count = 0
$missingPrices = 0

foreach ($b in $iphoneBlocks) {
    $count++
    if (-not ($b -match '"price"\s*:\s*\d+')) {
        $missingPrices++
        # Extract model
        if ($b -match '"model"\s*:\s*"([^"]+)"') {
            Write-Host "Missing price for: $($matches[1])"
        } else {
            Write-Host "Missing price for an unknown iphone model - data: $b"
        }
    }
}

Write-Host "Total iPhones found: $count"
Write-Host "Total missing prices: $missingPrices"
