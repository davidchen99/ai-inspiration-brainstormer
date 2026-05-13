param(
  [Parameter(Mandatory = $true)]
  [string]$CsvPath,

  [string]$BaseUrl = "",
  [string]$BaseToken = "",
  [string]$TableName = "公众号选题库",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Resolve-BaseToken {
  param(
    [string]$Token,
    [string]$Url
  )

  if ($Token.Trim()) {
    return $Token.Trim()
  }

  if ($Url -match "(app[A-Za-z0-9_]+)") {
    return $Matches[1]
  }

  throw "没有找到 Base Token。请传入 -BaseUrl 飞书多维表格链接，或直接传 -BaseToken app_xxx。"
}

function Convert-EmptyToNull {
  param([object]$Value)

  if ($null -eq $Value) { return $null }
  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return $text
}

function Split-IntoChunks {
  param(
    [array]$Items,
    [int]$Size = 200
  )

  for ($i = 0; $i -lt $Items.Count; $i += $Size) {
    $end = [Math]::Min($i + $Size - 1, $Items.Count - 1)
    @($Items[$i..$end])
  }
}

$resolvedCsv = Resolve-Path -LiteralPath $CsvPath
$base = Resolve-BaseToken -Token $BaseToken -Url $BaseUrl
$records = Import-Csv -LiteralPath $resolvedCsv

if (-not $records -or $records.Count -eq 0) {
  throw "CSV 里没有可同步的数据。"
}

$fields = @(
  "分类",
  "选题",
  "标题",
  "一句话简介",
  "目标读者",
  "切入角度",
  "标题类型",
  "推荐指数",
  "推荐理由",
  "来源模式",
  "状态",
  "同步批次",
  "创建时间"
)

$rows = foreach ($record in $records) {
  ,@($fields | ForEach-Object {
    if ($_ -eq "推荐指数") {
      $score = Convert-EmptyToNull $record.$_
      if ($null -eq $score) { $null } else { [int]$score }
    } else {
      Convert-EmptyToNull $record.$_
    }
  })
}

$rows = @($rows)
$chunks = @(Split-IntoChunks -Items $rows -Size 200)

Write-Host "CSV: $resolvedCsv"
Write-Host "BaseToken: $base"
Write-Host "Table: $TableName"
Write-Host "Rows: $($records.Count)"
Write-Host "Batches: $($chunks.Count)"

if ($DryRun) {
  Write-Host "DryRun: 只预览，不写入飞书。去掉 -DryRun 后执行同步。"
  exit 0
}

$lark = Get-Command lark-cli -ErrorAction SilentlyContinue
if (-not $lark) {
  throw "未找到 lark-cli。请先确认 lark-cli 已安装并完成登录。"
}

$tempDir = Join-Path $PSScriptRoot ".sync-temp"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$batchIndex = 0
foreach ($chunk in $chunks) {
  $batchIndex += 1
  $body = @{
    fields = $fields
    rows = @($chunk)
  }
  $jsonPath = Join-Path $tempDir "batch-$batchIndex.json"
  $body | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

  Write-Host "同步批次 $batchIndex / $($chunks.Count)，行数 $($chunk.Count)..."
  $argsList = @(
    "base",
    "+record-batch-create",
    "--base-token",
    $base,
    "--table-id",
    $TableName,
    "--json",
    "@$jsonPath"
  )
  & lark-cli @argsList
}

Write-Host "同步完成。"
