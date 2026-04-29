param(
  [Parameter(Mandatory = $true)]
  [string]$Handle,

  [int]$Count = 0,

  [string]$OutputDir,

  [switch]$AttachEdge,

  [switch]$OpenFreshEdge,

  [switch]$All,

  [switch]$Resume,

  [switch]$ForceNewTab
)

$ErrorActionPreference = "Stop"

if (-not $OutputDir) {
  $OutputDir = "downloads/x-$Handle"
}

if ($AttachEdge -and $OpenFreshEdge) {
  throw "Use either -AttachEdge or -OpenFreshEdge, not both."
}

if ($All -and $Count -gt 0) {
  throw "Use either -All or -Count, not both."
}

if (-not $All -and $Count -lt 1) {
  $Count = 6
}

$profileUrl = "https://x.com/$Handle"
$mediaUrl = "$profileUrl/media"
$extractScript = ".claude/skills/x-author-download/scripts/extract-x-media-urls.js"

function Invoke-PlaywrightCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $output = & playwright-cli @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output -join [Environment]::NewLine)
  }
  return ($output -join [Environment]::NewLine)
}

function Get-PlaywrightTabEntries {
  $raw = Invoke-PlaywrightCommand -Arguments @("--raw", "tab-list")
  $entries = @()

  foreach ($line in ($raw -split "\r?\n")) {
    if ($line -notmatch "^\s*-\s*") { continue }

    $isCurrent = $false
    $rest = $line

    if ($rest -match "^\s*-\s*\(current\)\s*(.*)$") {
      $isCurrent = $true
      $rest = $Matches[1]
    } else {
      $rest = ($rest -replace "^\s*-\s*", "")
    }

    if ($rest -notmatch "^(\d+):\s*\[([^\]]*)\]\(([^)]+)\)\s*$") { continue }

    $entries += [pscustomobject]@{
      Index   = [int]$Matches[1]
      Title   = $Matches[2]
      Url     = $Matches[3]
      Current = $isCurrent
    }
  }

  return $entries
}

function Select-PlaywrightTabForXMedia {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Handle
  )

  $entries = Get-PlaywrightTabEntries
  if (-not $entries -or $entries.Count -eq 0) {
    return $false
  }

  $handleLower = $Handle.ToLowerInvariant()
  $candidates = $entries | Where-Object {
    $u = $_.Url.ToLowerInvariant()
    $u -like "https://x.com/$handleLower/media*" -or
    $u -like "https://twitter.com/$handleLower/media*"
  }

  if (-not $candidates -or $candidates.Count -eq 0) {
    $candidates = $entries | Where-Object {
      $u = $_.Url.ToLowerInvariant()
      ($u -like "https://x.com/$handleLower*" -or $u -like "https://twitter.com/$handleLower*") -and
      $u -like "*/media*"
    }
  }

  if (-not $candidates -or $candidates.Count -eq 0) {
    return $false
  }

  $picked =
    @($candidates | Where-Object { $_.Current }) |
    Select-Object -First 1

  if (-not $picked) {
    $picked = $candidates | Select-Object -First 1
  }

  Invoke-PlaywrightCommand -Arguments @("tab-select", "$($picked.Index)") | Out-Null
  return $true
}

if ($AttachEdge) {
  Invoke-PlaywrightCommand -Arguments @("attach", "--cdp=msedge") | Out-Null
}

if ($OpenFreshEdge) {
  Invoke-PlaywrightCommand -Arguments @("open", "--browser=msedge", $profileUrl) | Out-Null
}

$usedExistingTab = $false
if (-not $ForceNewTab -and $AttachEdge -and -not $OpenFreshEdge) {
  $usedExistingTab = Select-PlaywrightTabForXMedia -Handle $Handle
}

if (-not $usedExistingTab) {
  Invoke-PlaywrightCommand -Arguments @("tab-new", $profileUrl) | Out-Null
  Start-Sleep -Seconds 2
}

Invoke-PlaywrightCommand -Arguments @("goto", $mediaUrl) | Out-Null
Start-Sleep -Seconds 3

$rawUrls = Invoke-PlaywrightCommand -Arguments @("--raw", "run-code", "--filename=$extractScript")
$parsedUrls = $rawUrls | ConvertFrom-Json

if ($null -eq $parsedUrls) {
  throw "No media image URLs were found on the X media page."
}

if ($parsedUrls -is [string]) {
  $urls = @($parsedUrls)
} else {
  $urls = @($parsedUrls)
}

if (-not $urls -or $urls.Count -eq 0) {
  throw "No media image URLs were found on the X media page."
}

function Get-XMediaId {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  if ($Url -match "pbs\.twimg\.com/media/([^/?#]+)") {
    return $Matches[1]
  }

  return $null
}

$uniqueUrls = @()
$seenIds = @{}
foreach ($url in $urls) {
  $id = Get-XMediaId -Url $url
  if (-not $id) { continue }
  if ($seenIds.ContainsKey($id)) { continue }
  $seenIds[$id] = $true
  $uniqueUrls += $url
}

if ($All) {
  $selectedUrls = @($uniqueUrls)
} else {
  if ($uniqueUrls.Count -lt $Count) {
    throw "Only found $($uniqueUrls.Count) unique media image URLs, but Count is $Count. Scroll further on the Media page or retry with a logged-in Edge session."
  }

  $selectedUrls = @($uniqueUrls | Select-Object -First $Count)
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$downloaded = 0
$skipped = 0
$failed = 0

foreach ($url in $selectedUrls) {
  $id = Get-XMediaId -Url $url
  if (-not $id) { continue }

  $extension = if ($url -match "format=([a-zA-Z0-9]+)") { $Matches[1].ToLowerInvariant() } else { "jpg" }
  $filename = "$id.$extension"
  $path = Join-Path $OutputDir $filename

  if ($Resume -and (Test-Path $path)) {
    $len = (Get-Item $path).Length
    if ($len -gt 0) {
      $skipped++
      continue
    }
  }

  try {
    Invoke-WebRequest -Uri $url -OutFile $path
    $item = Get-Item $path
    if ($item.Length -le 0) {
      throw "Downloaded file is empty: $($item.FullName)"
    }
    $downloaded++
  } catch {
    $failed++
    Write-Warning "Failed to download $id : $($_.Exception.Message)"
  }
}

Write-Output ("unique_urls=" + $uniqueUrls.Count)
Write-Output ("selected_urls=" + $selectedUrls.Count)
Write-Output ("downloaded=" + $downloaded)
Write-Output ("skipped=" + $skipped)
Write-Output ("failed=" + $failed)
Write-Output ("output_dir=" + (Resolve-Path $OutputDir))

if ($failed -gt 0) {
  exit 2
}
