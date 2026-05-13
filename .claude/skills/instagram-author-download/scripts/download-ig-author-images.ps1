param(
  [Parameter(Mandatory = $true)]
  [string]$Username,

  [int]$Count = 0,

  [string]$OutputDir,

  [switch]$AttachEdge,

  [switch]$OpenFreshEdge,

  [switch]$All,

  [switch]$Resume,

  [switch]$ForceNewTab,

  [switch]$IncludeCarousel,

  [int]$Concurrency = 6,

  [int]$BatchSize = 25,

  [ValidateSet("None", "Quick", "Sample", "Full")]
  [string]$Preset = "None"
)

$ErrorActionPreference = "Stop"

switch ($Preset) {
  "Quick"  {
    if ($Count -eq 0 -and -not $All) { $Count = 12 }
    $AttachEdge = $true
    $Resume = $true
  }
  "Sample" {
    if ($Count -eq 0 -and -not $All) { $Count = 3 }
    $AttachEdge = $true
    $Resume = $true
    $IncludeCarousel = $true
  }
  "Full"   {
    $All = $true
    $AttachEdge = $true
    $Resume = $true
    $IncludeCarousel = $true
  }
}

if (-not $OutputDir) {
  $OutputDir = "downloads/ig-$Username"
}
$metaDir = Join-Path $OutputDir "_meta"
$postsCachePath = Join-Path $metaDir "posts.json"

if ($AttachEdge -and $OpenFreshEdge) { throw "Use either -AttachEdge or -OpenFreshEdge, not both." }
if ($All -and $Count -gt 0)          { throw "Use either -All or -Count, not both." }
if (-not $All -and $Count -lt 1)     { $Count = 6 }

$profileUrl    = "https://www.instagram.com/$Username/"
$gridScript    = ".claude/skills/instagram-author-download/scripts/extract-ig-media-urls.js"
$batchScript   = ".claude/skills/instagram-author-download/scripts/extract-ig-posts-batch.js"

# ---------- helpers ----------

function Invoke-PlaywrightCommand {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)
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
      $isCurrent = $true; $rest = $Matches[1]
    } else {
      $rest = ($rest -replace "^\s*-\s*", "")
    }
    if ($rest -notmatch "^(\d+):\s*\[([^\]]*)\]\(([^)]+)\)\s*$") { continue }
    $entries += [pscustomobject]@{
      Index = [int]$Matches[1]; Title = $Matches[2]; Url = $Matches[3]; Current = $isCurrent
    }
  }
  return $entries
}

function Select-PlaywrightTabForIgProfile {
  param([Parameter(Mandatory = $true)][string]$Username)
  $entries = Get-PlaywrightTabEntries
  if (-not $entries -or $entries.Count -eq 0) { return $false }
  $userLower = $Username.ToLowerInvariant()
  $candidates = $entries | Where-Object {
    $u = $_.Url.ToLowerInvariant()
    $u -like "https://www.instagram.com/$userLower/*" -or
    $u -like "https://www.instagram.com/$userLower" -or
    $u -like "https://instagram.com/$userLower/*" -or
    $u -like "https://instagram.com/$userLower"
  }
  if (-not $candidates) { return $false }
  $picked = @($candidates | Where-Object { $_.Current }) | Select-Object -First 1
  if (-not $picked) { $picked = $candidates | Select-Object -First 1 }
  Invoke-PlaywrightCommand -Arguments @("tab-select", "$($picked.Index)") | Out-Null
  return $true
}

function Get-IgBasename {
  param([Parameter(Mandatory = $true)][string]$Url)
  try {
    $u = [System.Uri]$Url
    $last = $u.AbsolutePath.Split('/')[-1]
    if ([string]::IsNullOrWhiteSpace($last)) { return $null }
    return $last
  } catch { return $null }
}

function Save-PostList {
  param([Parameter(Mandatory = $true)]$Posts)
  New-Item -ItemType Directory -Path $metaDir -Force | Out-Null
  $Posts | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $postsCachePath
}

function Load-PostList {
  if (-not (Test-Path $postsCachePath)) { return $null }
  try {
    $raw = Get-Content $postsCachePath -Raw -Encoding UTF8
    $arr = $raw | ConvertFrom-Json
    if ($arr -is [array]) { return $arr } else { return @($arr) }
  } catch {
    return $null
  }
}

function Invoke-ParallelDownload {
  param(
    [Parameter(Mandatory = $true)][string[]]$Urls,
    [Parameter(Mandatory = $true)][string]$Dir,
    [int]$Concurrency = 6,
    [switch]$Resume
  )

  New-Item -ItemType Directory -Path $Dir -Force | Out-Null

  $headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    "Referer"   = "https://www.instagram.com/"
  }

  $work = [System.Collections.Generic.List[hashtable]]::new()
  foreach ($url in $Urls) {
    $id = Get-IgBasename -Url $url
    if (-not $id) { continue }
    $filename = $id
    if ($filename -notmatch "\.(jpg|jpeg|png|webp)$") { $filename = "$filename.jpg" }
    $path = Join-Path $Dir $filename
    if ($Resume -and (Test-Path $path)) {
      $len = (Get-Item $path).Length
      if ($len -gt 0) { continue }
    }
    $work.Add(@{ Url = $url; Path = $path }) | Out-Null
  }

  if ($work.Count -eq 0) {
    return @{ Downloaded = 0; Skipped = ($Urls.Count); Failed = 0 }
  }

  $eff = [Math]::Max(1, [Math]::Min($Concurrency, $work.Count))
  $pool = [runspacefactory]::CreateRunspacePool(1, $eff)
  $pool.Open()

  $script = {
    param($Url, $Path, $Headers)
    try {
      Invoke-WebRequest -Uri $Url -OutFile $Path -Headers $Headers -UseBasicParsing -TimeoutSec 60
      $item = Get-Item $Path
      if ($item.Length -le 0) { return "fail:empty" }
      return "ok"
    } catch {
      return "fail:" + $_.Exception.Message
    }
  }

  $jobs = New-Object System.Collections.Generic.List[hashtable]
  foreach ($w in $work) {
    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($script).AddArgument($w.Url).AddArgument($w.Path).AddArgument($headers)
    $handle = $ps.BeginInvoke()
    $jobs.Add(@{ PS = $ps; Handle = $handle; Url = $w.Url; Path = $w.Path }) | Out-Null
  }

  $downloaded = 0; $failed = 0
  foreach ($j in $jobs) {
    try {
      $result = $j.PS.EndInvoke($j.Handle)
      $status = if ($result -is [array]) { $result[0] } else { $result }
      if ($status -eq "ok") { $downloaded++ }
      else { $failed++; Write-Warning "fail $($j.Path): $status" }
    } catch {
      $failed++
      Write-Warning "exception $($j.Path): $($_.Exception.Message)"
    } finally {
      $j.PS.Dispose()
    }
  }
  $pool.Close(); $pool.Dispose()

  $skipped = $Urls.Count - $work.Count
  return @{ Downloaded = $downloaded; Skipped = $skipped; Failed = $failed }
}

# ---------- 1. browser ----------

$usedCachedPosts = $false
$cachedPosts = $null
if ($Resume -and (Test-Path $postsCachePath)) {
  $age = (Get-Date) - (Get-Item $postsCachePath).LastWriteTime
  # postUrl never expires; thumbUrl carries a signed URL with ~hours TTL.
  # In carousel mode we only use postUrl, so any age is fine.
  if ($IncludeCarousel -or $age.TotalHours -lt 1) {
    $cachedPosts = Load-PostList
  }
}

$needBrowser = -not $cachedPosts -or $IncludeCarousel
if ($needBrowser) {
  if ($AttachEdge) {
    Invoke-PlaywrightCommand -Arguments @("attach", "--cdp=msedge") | Out-Null
  }
  if ($OpenFreshEdge) {
    Invoke-PlaywrightCommand -Arguments @("open", "--browser=msedge", $profileUrl) | Out-Null
  }
  $usedExistingTab = $false
  if (-not $ForceNewTab -and $AttachEdge -and -not $OpenFreshEdge) {
    $usedExistingTab = Select-PlaywrightTabForIgProfile -Username $Username
  }
  if (-not $usedExistingTab -and -not $OpenFreshEdge) {
    Invoke-PlaywrightCommand -Arguments @("tab-new", $profileUrl) | Out-Null
    Start-Sleep -Seconds 2
  }
}

# ---------- 2. post list ----------

if ($cachedPosts -and $cachedPosts.Count -gt 0) {
  $uniquePosts = @($cachedPosts)
  $usedCachedPosts = $true
} else {
  Invoke-PlaywrightCommand -Arguments @("goto", $profileUrl) | Out-Null
  Start-Sleep -Seconds 3

  $rawGrid = Invoke-PlaywrightCommand -Arguments @("--raw", "run-code", "--filename=$gridScript")
  $parsedGrid = $rawGrid | ConvertFrom-Json
  if ($null -eq $parsedGrid) {
    throw "No grid items returned. The page may be at a login wall — confirm logged-in Edge."
  }
  $gridItems = if ($parsedGrid -is [array]) { @($parsedGrid) } else { @($parsedGrid) }
  if ($gridItems.Count -eq 0) {
    throw "No grid items returned. The page may be at a login wall — confirm logged-in Edge."
  }
  $seenPostMap = @{}
  $uniquePosts = @()
  foreach ($g in $gridItems) {
    if (-not $g.postUrl) { continue }
    if ($seenPostMap.ContainsKey($g.postUrl)) { continue }
    $seenPostMap[$g.postUrl] = $true
    $uniquePosts += $g
  }
  Save-PostList -Posts $uniquePosts
}

if ($All)                                { $selectedPosts = @($uniquePosts) }
elseif ($uniquePosts.Count -lt $Count)   { $selectedPosts = @($uniquePosts) }
else                                     { $selectedPosts = @($uniquePosts | Select-Object -First $Count) }

# ---------- 3. image URLs ----------

$allImageUrls = New-Object System.Collections.Generic.List[string]
$visitedPosts = 0
$batchCalls   = 0

if ($IncludeCarousel) {
  $i = 0
  while ($i -lt $selectedPosts.Count) {
    $end = [Math]::Min($i + $BatchSize - 1, $selectedPosts.Count - 1)
    $chunk = $selectedPosts[$i..$end]
    $chunkUrls = $chunk | ForEach-Object { $_.postUrl }

    $env:IG_POSTS = ($chunkUrls | ConvertTo-Json -Compress)
    try {
      $rawBatch = Invoke-PlaywrightCommand -Arguments @("--raw", "run-code", "--filename=$batchScript")
    } catch {
      Write-Warning "batch [$i..$end] failed: $($_.Exception.Message). Falling back to per-post thumbs."
      foreach ($p in $chunk) {
        if ($p.thumbUrl) { $allImageUrls.Add($p.thumbUrl) | Out-Null }
      }
      $i = $end + 1
      continue
    } finally {
      Remove-Item Env:IG_POSTS -ErrorAction SilentlyContinue
    }

    $batchCalls++
    $parsed = $rawBatch | ConvertFrom-Json
    if ($parsed.error) {
      Write-Warning "batch script error: $($parsed.error)"
      foreach ($p in $chunk) {
        if ($p.thumbUrl) { $allImageUrls.Add($p.thumbUrl) | Out-Null }
      }
    } else {
      $items = if ($parsed -is [array]) { @($parsed) } else { @($parsed) }
      foreach ($item in $items) {
        $visitedPosts++
        if ($item.images) {
          foreach ($u in $item.images) {
            if ($u) { $allImageUrls.Add($u) | Out-Null }
          }
        }
        # If carousel walk returned nothing (e.g. video-only post), fall back to grid thumb
        if (-not $item.images -or $item.images.Count -eq 0) {
          $match = $chunk | Where-Object { $_.postUrl -eq $item.postUrl } | Select-Object -First 1
          if ($match -and $match.thumbUrl) { $allImageUrls.Add($match.thumbUrl) | Out-Null }
        }
      }
    }
    $i = $end + 1
  }
} else {
  foreach ($p in $selectedPosts) {
    if ($p.thumbUrl) { $allImageUrls.Add($p.thumbUrl) | Out-Null }
  }
}

# ---------- 4. dedupe + parallel download ----------

$uniqueImageUrls = New-Object System.Collections.Generic.List[string]
$seenBase = @{}
foreach ($u in $allImageUrls) {
  $id = Get-IgBasename -Url $u
  if (-not $id) { continue }
  if ($seenBase.ContainsKey($id)) { continue }
  $seenBase[$id] = $true
  $uniqueImageUrls.Add($u) | Out-Null
}

$stats = Invoke-ParallelDownload -Urls $uniqueImageUrls.ToArray() -Dir $OutputDir -Concurrency $Concurrency -Resume:$Resume

# ---------- 5. summary ----------

Write-Output ("posts_found="       + $uniquePosts.Count)
Write-Output ("posts_selected="    + $selectedPosts.Count)
Write-Output ("posts_visited="     + $visitedPosts)
Write-Output ("batch_calls="       + $batchCalls)
Write-Output ("used_cached_posts=" + $usedCachedPosts)
Write-Output ("unique_image_urls=" + $uniqueImageUrls.Count)
Write-Output ("concurrency="       + $Concurrency)
Write-Output ("downloaded="        + $stats.Downloaded)
Write-Output ("skipped="           + $stats.Skipped)
Write-Output ("failed="            + $stats.Failed)
Write-Output ("output_dir="        + (Resolve-Path $OutputDir))

if ($stats.Failed -gt 0) { exit 2 }
