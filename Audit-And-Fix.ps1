param(
  [switch]$Autofix = $false,
  [string]$ReportPath = ".\analysis\Report.md",
  [string]$IssuesDir = ".\analysis\issues",
  [switch]$VerboseLogs = $false,
  [int]$MaxLogChars = 4000,                # truncate long logs per command
  [switch]$SkipE2E = $false,               # set to skip Playwright/Cypress runs
  [switch]$SkipSecurity = $false,          # set to skip heavy security scans
  [switch]$FailOnVulns = $false            # mark HIGH/CRITICAL vulns as blocking
)

# -------------------- Helpers --------------------
Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = 'SilentlyContinue'

function Write-Heading($text) { "## $text`n" }
function Ensure-Dir($p){ if(!(Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null } }
function Trunc($s, $n){ if(-not $s){return ""}; if($s.Length -le $n){$s}else{$s.Substring(0,$n) + "...(truncated)"} }

function Run-Cmd($cmd, $workDir="."){
  try {
    if ($VerboseLogs) { Write-Host ">> [$workDir] $cmd" -ForegroundColor Cyan }
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "pwsh"
    $pinfo.Arguments = "-NoLogo -NoProfile -Command ""$cmd"""
    $pinfo.WorkingDirectory = (Resolve-Path $workDir)
    $pinfo.RedirectStandardError = $true
    $pinfo.RedirectStandardOutput = $true
    $pinfo.UseShellExecute = $false
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $pinfo
    $p.Start() | Out-Null
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    [PSCustomObject]@{
      ExitCode = $p.ExitCode
      StdOut   = $stdout.Trim()
      StdErr   = $stderr.Trim()
      Command  = $cmd
      Cwd      = $workDir
    }
  } catch {
    [PSCustomObject]@{ ExitCode = 999; StdOut = ""; StdErr = $_.Exception.Message; Command = $cmd; Cwd=$workDir }
  }
}

function Add-Issue([string]$pkg, [string]$category, [string]$command, [int]$exit, [string]$details, [string]$severity="error"){
  $global:issues.Add([PSCustomObject]@{
    Package   = $pkg
    Category  = $category
    Command   = $command
    ExitCode  = $exit
    Severity  = $severity
    Details   = $details
  })
}

function Read-JsonSafe($path){
  try {
    if(Test-Path $path){
      return (Get-Content $path -Raw | ConvertFrom-Json)
    }
  } catch { }
  return $null
}

function Get-EnvKeys($path){
  if(!(Test-Path $path)){ return @() }
  (Get-Content $path) | Where-Object { $_ -and ($_ -notmatch '^\s*#') } |
    ForEach-Object { ($_ -split '=',2)[0].Trim() } |
    Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*$' } | Sort-Object -Unique
}

# -------------------- Output Prep --------------------
Ensure-Dir (Split-Path $ReportPath -Parent)
Ensure-Dir $IssuesDir

$sections = New-Object System.Collections.Generic.List[string]
$issues   = New-Object System.Collections.Generic.List[pscustomobject]
$now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'

# -------------------- Package Manager & Monorepo Detection --------------------
$pkgManager = if (Test-Path "pnpm-lock.yaml") {"pnpm"} elseif (Test-Path "yarn.lock") {"yarn"} else {"npm"}
function PM($sub){ switch($pkgManager){ "pnpm" {"pnpm $sub"} "yarn" {"yarn $sub"} default {"npm $sub"} } }

# workspace list (dirs with package.json)
$workspaces = @(".") # default: root only
$rootPkg = Read-JsonSafe "package.json"
if ($rootPkg -and $rootPkg.workspaces) {
  $patterns = @()
  if ($rootPkg.workspaces -is [System.Collections.IEnumerable]) {
    $patterns += $rootPkg.workspaces
  } elseif ($rootPkg.workspaces.packages) {
    $patterns += $rootPkg.workspaces.packages
  }
  if ($patterns.Count -gt 0) {
    $ws = @()
    foreach($pat in $patterns){
      $glob = $pat.TrimEnd('/').TrimEnd('\') + "\package.json"
      $ws += (Get-ChildItem -Path $glob -ErrorAction Ignore)
    }
    if ($ws) {
      $workspaces = @(".") + ($ws | ForEach-Object { Split-Path $_.FullName -Parent } | Sort-Object -Unique)
    }
  }
} else {
  # heuristics for monorepo layouts
  $candidates = @("packages","apps","services")
  $found = @()
  foreach($c in $candidates){
    if (Test-Path $c) {
      $found += (Get-ChildItem -Recurse -Path $c -Filter package.json -ErrorAction Ignore | ForEach-Object { Split-Path $_.FullName -Parent })
    }
  }
  if ($found) { $workspaces = @(".") + ($found | Sort-Object -Unique) }
}

# -------------------- Header --------------------
$sections.Add("# Repository Health Audit (Node/TS/Python focus)")
$sections.Add("Date: $now")
$sections.Add("Package Manager: **$pkgManager**")
$sections.Add("Detected workspaces/packages:`n" + ($workspaces | ForEach-Object { "- `$_`" } | Out-String))

# -------------------- Generic Repo Checks --------------------
$sections.Add(Write-Heading "Generic Repository Checks")
$gitStatus = Run-Cmd "git status --porcelain"
$sections.Add("**Git Dirty:** " + ($(if ($gitStatus.StdOut){"Yes"} else {"No"})))
if ($gitStatus.StdOut) { $sections.Add("`````n$($gitStatus.StdOut)`n`````") }
$sections.Add("**.editorconfig present:** " + (Test-Path ".editorconfig"))
$sections.Add("**LICENSE present:** " + (Test-Path "LICENSE" -or Test-Path "LICENSE.md"))
$sections.Add("**.gitignore present:** " + (Test-Path ".gitignore"))

# -------------------- ENV Consistency --------------------
$sections.Add(Write-Heading "Environment Files Check")
$envExample = @(".env.example",".env.sample",".env.template") | Where-Object { Test-Path $_ } | Select-Object -First 1
$envActual  = @(".env",".env.local",".env.development") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($envExample) {
  $sampleKeys = Get-EnvKeys $envExample
  $realKeys   = Get-EnvKeys ($envActual ?? ".env")
  $missing = Compare-Object -ReferenceObject $sampleKeys -DifferenceObject $realKeys -PassThru | Where-Object { $_ -in $sampleKeys }
  $sections.Add("Sample: **$envExample**; Actual: **$($envActual ?? '(none)')**")
  if ($missing -and $missing.Count -gt 0) {
    $sections.Add("❌ Missing env keys: " + ($missing -join ", "))
    Add-Issue "root" "EnvConfig" "env-keys-missing" 1 ("Missing keys: " + ($missing -join ", ")) "error"
  } else {
    $sections.Add("✅ Env keys look complete.")
  }
} else {
  $sections.Add("_No .env.example/.env.sample found (consider adding one)._")
}

# -------------------- Node/TS Pipeline (per workspace) --------------------
function Node-TS-Pipeline([string]$dir){
  if (!(Test-Path (Join-Path $dir "package.json"))) { return @() }
  $results = @()
  $pkg = Read-JsonSafe (Join-Path $dir "package.json")
  $deps = @()
  if ($pkg -and $pkg.dependencies){ $deps += $pkg.dependencies.PSObject.Properties.Name }
  if ($pkg -and $pkg.devDependencies){ $deps += $pkg.devDependencies.PSObject.Properties.Name }
  $scripts = @()
  if ($pkg -and $pkg.scripts){ $scripts += $pkg.scripts.PSObject.Properties.Name }

  function HasDep($name){ return $deps -contains $name }
  function HasScript($name){ return $scripts -contains $name }
  $pmInstall = switch($pkgManager){
    "pnpm" { "pnpm install --frozen-lockfile" }
    "yarn" { "yarn install --frozen-lockfile" }
    default { "npm ci --no-audit --fund=false" }
  }

  # Versions
  $results += Run-Cmd "node -v" $dir
  $results += Run-Cmd "$pkgManager -v" $dir

  # Install
  $results += Run-Cmd $pmInstall $dir

  # TypeScript strict checks (prefer project config; fallback allowJs check)
  $tsconfig = @("tsconfig.json","tsconfig.base.json") | ForEach-Object { Join-Path $dir $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($tsconfig -or HasDep "typescript") {
    $results += Run-Cmd "npx -y tsc -p $($tsconfig ?? 'tsconfig.json') --noEmit" $dir
  } elseif (Get-ChildItem -Recurse -Path $dir -Include *.ts,*.tsx -ErrorAction Ignore) {
    $results += Run-Cmd "npx -y tsc --allowJs --checkJs --noEmit" $dir
  }

  # ESLint + Prettier
  if (HasDep "eslint" -or Test-Path (Join-Path $dir ".eslintrc*")) {
    $results += Run-Cmd "npx -y eslint . --ext .js,.jsx,.ts,.tsx --max-warnings=0" $dir
  }
  if (HasDep "prettier" -or Test-Path (Join-Path $dir ".prettierrc*")) {
    $results += Run-Cmd "npx -y prettier . -c" $dir
  }

  # Framework specific: Next.js / Vite / CRA
  if (HasDep "next") {
    $results += Run-Cmd "npx -y next lint" $dir
    $results += Run-Cmd "$([string]::IsNullOrEmpty($env:NODE_ENV) ? "" : "" ) ; `$env:NODE_ENV='production'; npx -y next build" $dir
  } elseif (HasDep "vite") {
    $results += Run-Cmd "npx -y vite build" $dir
  } elseif (HasDep "react-scripts") {
    $results += Run-Cmd "$pkgManager run -s build" $dir
  } elseif (HasScript "build") {
    $results += Run-Cmd "$pkgManager run -s build" $dir
  }

  # Unit tests: prefer well-known runners, else fall back to "test" script
  if (HasDep "@vitest/ui" -or HasDep "vitest" -or (HasScript "test" -and ($pkg.scripts.test -match "vitest"))) {
    $results += Run-Cmd "npx -y vitest run --reporter=basic" $dir
  } elseif (HasDep "jest" -or (HasScript "test" -and ($pkg.scripts.test -match "jest"))) {
    $results += Run-Cmd "npx -y jest --ci --passWithNoTests" $dir
  } elseif (HasDep "mocha" -or (HasScript "test" -and ($pkg.scripts.test -match "mocha"))) {
    $results += Run-Cmd "npx -y mocha" $dir
  } elseif (HasScript "test") {
    $results += Run-Cmd "$pkgManager run -s test" $dir
  }

  # E2E (optional)
  if (-not $SkipE2E) {
    if (HasDep "@playwright/test" -or Test-Path (Join-Path $dir "playwright.config.*")) {
      $results += Run-Cmd "npx -y playwright install --with-deps" $dir
      $results += Run-Cmd "npx -y playwright test --reporter=line" $dir
    }
    if (HasDep "cypress" -or Test-Path (Join-Path $dir "cypress.config.*")) {
      $results += Run-Cmd "npx -y cypress verify" $dir
      $results += Run-Cmd "npx -y cypress run --headless" $dir
    }
  }

  # Dependency sanity
  $results += Run-Cmd "npx -y depcheck --json" $dir
  if (HasDep "typescript") {
    $results += Run-Cmd "npx -y ts-prune -g" $dir
  }

  # Security
  if (-not $SkipSecurity) {
    $results += Run-Cmd "npm audit --json" $dir
  }

  return $results
}

# -------------------- Python Pipeline (root only or per detected module) --------------------
function Python-Pipeline([string]$dir){
  # Detect python project
  $isPy = (Test-Path (Join-Path $dir "pyproject.toml")) -or (Test-Path (Join-Path $dir "requirements.txt"))
  if (-not $isPy) { return @() }
  $results = @()

  # Version & deps
  $pyCmd = "python"
  $results += Run-Cmd "$pyCmd --version" $dir
  if (Test-Path (Join-Path $dir "requirements.txt")) { $results += Run-Cmd "$pyCmd -m pip install -r requirements.txt" $dir }
  if (Test-Path (Join-Path $dir "pyproject.toml"))   { $results += Run-Cmd "$pyCmd -m pip install -e .[dev]" $dir }

  # Tools
  $results += Run-Cmd "$pyCmd -m pip install -U pip pytest pytest-cov mypy ruff black bandit safety pip-audit deptry --quiet" $dir

  # Static typing (allow missing imports to avoid noise)
  $mypyCfg = @("mypy.ini","pyproject.toml","setup.cfg") | ForEach-Object { Join-Path $dir $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1
  $mypyOpts = if ($mypyCfg) { "" } else { "--ignore-missing-imports" }
  $results += Run-Cmd "mypy . $mypyOpts" $dir

  # Lint/format checks
  $results += Run-Cmd "ruff check . --output-format=github" $dir
  $results += Run-Cmd "black --check ." $dir

  # Security & deps
  if (-not $SkipSecurity) {
    $results += Run-Cmd "bandit -r . -f txt" $dir
    $results += Run-Cmd "safety check --full-report" $dir
    $results += Run-Cmd "pip-audit -r requirements.txt" $dir
    $results += Run-Cmd "deptry ." $dir
  }

  # Tests
  $results += Run-Cmd "pytest -q" $dir

  return $results
}

# -------------------- Collectors & Execution --------------------
$sections.Add(Write-Heading "Stack Checks (Node/TS/Python)")

function Collect-Results($pkgName, $categoryLabel, $results){
  if (-not $results) { return }
  $sections.Add("### $categoryLabel — `$pkgName`")
  foreach($r in $results){
    if ($null -ne $r.ExitCode) {
      $ok = if ($r.ExitCode -eq 0) {"✅"} else {"❌"}
      $out = Trunc(($r.StdOut + "`n" + $r.StdErr).Trim(), $MaxLogChars)
      $sections.Add("**$ok `$($r.Command)` (exit $($r.ExitCode))**  \n`cwd:` `$($r.Cwd)`")
      if ($out) { $sections.Add("`````\n$out\n`````") }
      if ($r.ExitCode -ne 0) {
        # Severity heuristics
        $sev = if ($r.Command -match "build|type|mypy|tsc|lint|test|playwright|cypress") {"error"} else {"warn"}
        if ($FailOnVulns -and $r.Command -match "audit|safety|bandit|pip-audit") { $sev="error" }
        Add-Issue $pkgName $categoryLabel $r.Command $r.ExitCode $out $sev
      }
    }
  }
}

# Run Node/TS across workspaces
foreach($ws in $workspaces){
  $nodeRes = Node-TS-Pipeline $ws
  if ($nodeRes){ Collect-Results $ws "Node/TS" $nodeRes }
}

# Run Python (root + any top-level submodules)
$pyDirs = @(".")
$pyDirs += (Get-ChildItem -Directory -Depth 2 -ErrorAction Ignore | Where-Object {
  Test-Path (Join-Path $_.FullName "pyproject.toml") -or Test-Path (Join-Path $_.FullName "requirements.txt")
} | Select-Object -ExpandProperty FullName)
$pyDirs = $pyDirs | Sort-Object -Unique
foreach($pd in $pyDirs){
  $pyRes = Python-Pipeline $pd
  if ($pyRes){ Collect-Results $pd "Python" $pyRes }
}

# -------------------- Findings Summary --------------------
$sections.Add(Write-Heading "Findings Summary")
if ($issues.Count -eq 0) {
  $sections.Add("**No blocking issues found.** 🎉")
} else {
  $sections.Add("**$($issues.Count) issue entries detected.** Grouped below:**")
  $groups = $issues | Group-Object Package,Category | Sort-Object Name
  foreach($g in $groups){
    $sections.Add($"#### { $g.Name }")
    $i=1
    foreach($issue in $g.Group){
      $title = "$i. [$($issue.Severity.ToUpper())] $($issue.Command)"
      $sections.Add("**$title**  \nExitCode: **$($issue.ExitCode)**")
      $sections.Add("Details (truncated):`n`````\n$($issue.Details)\n`````")
      $i++
    }
  }
}

# -------------------- Write Report --------------------
$reportContent = ($sections -join "`n`n")
Set-Content -LiteralPath $ReportPath -Value $reportContent -Encoding UTF8
Write-Host "Report written to $ReportPath"

# -------------------- Create per-issue Markdown files --------------------
if ($issues.Count -gt 0) {
  $idx = 1
  foreach($issue in $issues){
    $safe = ($issue.Command -replace '[^a-zA-Z0-9\-]+','-').Trim('-')
    if ($safe.Length -gt 60) { $safe = $safe.Substring(0,60) }
    $file = Join-Path $IssuesDir ("issue-" + $idx.ToString("000") + "-" + $issue.Package.Replace('\','/').Replace('/','-').Trim('-') + "-" + $safe + ".md")
    $body = @"
# Fix: [$($issue.Category)] $($issue.Command)

**Package/Workspace:** \`$($issue.Package)\`  
**Severity:** \`$($issue.Severity)\`  
**Exit Code:** \`$($issue.ExitCode)\`

## Root Cause (Hypothesis)
- _Analyze the logs and code paths likely involved._
- _Identify whether this is build/type/test/lint/security/env/deps._

## Reproduction
\`\`\`bash
# from repo root
(cd "$($issue.Package)"; $($issue.Command))
\`\`\`

## Logs (truncated)
\`\`\`
$($issue.Details)
\`\`\`

## Acceptance Criteria
- The above command exits 0.
- No regressions in unit/e2e tests.
- Linter/type/security checks remain green.

## Proposed Steps
1. _Concrete fix steps here._
2. _Link to files/lines to change._
3. _Add/adjust tests or config._
"@
    Set-Content -LiteralPath $file -Value $body -Encoding UTF8
    $idx++
  }
  Write-Host "Created $($issues.Count) issue files in $IssuesDir"
}

# -------------------- Fix Plan (prioritized) --------------------
if ($issues.Count -gt 0) {
  $prio = $issues | Sort-Object @{Expression="Severity";Descending=$true}, @{Expression="Category"}, @{Expression="Package"}
  $plan = "# Fix Plan (Prioritized)`n`n"
  $plan += "| Order | Severity | Category | Package | Command |`n|---:|---|---|---|---|`n"
  $ord=1
  foreach($p in $prio){
    $plan += "| $ord | $($p.Severity) | $($p.Category) | $($p.Package) | `$($p.Command)` |`n"
    $ord++
  }
  Set-Content -LiteralPath ".\analysis\Fix-Plan.md" -Value $plan -Encoding UTF8
}

# -------------------- Optional Autofix Phase --------------------
if ($Autofix) {
  Write-Host "Autofix phase enabled. Applying safe fixes..."
  $fixLog = New-Object System.Collections.Generic.List[string]

  foreach($ws in $workspaces){
    if (Test-Path (Join-Path $ws "package.json")) {
      # Node/TS safe fixes
      $fixLog.Add((Run-Cmd "npx -y prettier . -w" $ws).StdOut)
      $fixLog.Add((Run-Cmd "npx -y eslint . --ext .js,.jsx,.ts,.tsx --fix" $ws).StdOut)
      if (-not $SkipSecurity) { $fixLog.Add((Run-Cmd "npm audit fix --force=false" $ws).StdOut) }
    }
  }

  # Python safe fixes (root + submodules)
  foreach($pd in $pyDirs){
    if (Test-Path (Join-Path $pd "pyproject.toml")) {
      $fixLog.Add((Run-Cmd "python -m black ." $pd).StdOut)
      $fixLog.Add((Run-Cmd "ruff check . --fix" $pd).StdOut)
    }
  }

  $fixSummary = "# Autofix Summary`n`n" + ($fixLog -join "`n")
  Set-Content -LiteralPath ".\analysis\Autofix_Summary.md" -Value $fixSummary -Encoding UTF8

  # Post-fix smoke
  $post = New-Object System.Collections.Generic.List[string]
  foreach($ws in $workspaces){
    if (Test-Path (Join-Path $ws "package.json")) {
      $post.Add((Run-Cmd "$pkgManager run -s test" $ws).StdOut)
      $post.Add((Run-Cmd "$pkgManager run -s build" $ws).StdOut)
    }
  }
  foreach($pd in $pyDirs){
    if (Test-Path (Join-Path $pd "pyproject.toml") -or Test-Path (Join-Path $pd "requirements.txt")) {
      $post.Add((Run-Cmd "pytest -q" $pd).StdOut)
    }
  }
  Set-Content -LiteralPath ".\analysis\Postfix_Checks.md" -Value ($post -join "`n") -Encoding UTF8
}
