param(
  [string]$CsvPath,

  [string]$PackagePath = "",

  [string]$BaseUrl = "",
  [string]$BaseToken = "",
  [string]$TableName = "公众号选题库",
  [switch]$EnsureFields,
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
  if ($Value -is [bool]) { return $Value }
  if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) { return $Value }
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
    ,@($Items[$i..$end])
  }
}

function Convert-SchemaTypeToFieldJson {
  param(
    [string]$Name,
    [string]$Type
  )

  switch ($Type) {
    "number" {
      return @{
        name = $Name
        type = "number"
        style = @{
          type = "plain"
          precision = 0
          percentage = $false
          thousands_separator = $false
        }
      }
    }
    "checkbox" {
      return @{
        name = $Name
        type = "checkbox"
      }
    }
    "url" {
      return @{
        name = $Name
        type = "text"
        style = @{
          type = "url"
        }
      }
    }
    default {
      return @{
        name = $Name
        type = "text"
      }
    }
  }
}

function Get-FieldNamesFromListResult {
  param([object]$Result)

  $names = New-Object System.Collections.Generic.HashSet[string]
  $candidates = @(
    $Result.items,
    $Result.data.items,
    $Result.fields,
    $Result.data.fields
  )

  foreach ($items in $candidates) {
    if (-not $items) { continue }
    foreach ($field in @($items)) {
      $name = $field.name
      if (-not $name) { $name = $field.field_name }
      if ($name) { [void]$names.Add([string]$name) }
    }
  }
  return $names
}

function Ensure-BaseFields {
  param(
    [string]$Base,
    [string]$Table,
    [array]$Schema
  )

  if (-not $Schema -or $Schema.Count -eq 0) {
    Write-Host "EnsureFields: 没有 schema，跳过字段补齐。"
    return
  }

  Write-Host "EnsureFields: 正在读取已有字段..."
  $fieldJson = & lark-cli base +field-list --base-token $Base --table-id $Table --limit 200
  if ($LASTEXITCODE -ne 0) {
    throw "读取 Base 字段失败，请确认 BaseToken、TableName/TableId 和权限。"
  }
  $fieldResult = $fieldJson | ConvertFrom-Json
  $existing = Get-FieldNamesFromListResult -Result $fieldResult
  $missing = @($Schema | Where-Object { -not $existing.Contains([string]$_.name) })

  if (-not $missing -or $missing.Count -eq 0) {
    Write-Host "EnsureFields: 字段已齐全。"
    return
  }

  Write-Host "EnsureFields: 需要创建 $($missing.Count) 个字段。"
  foreach ($field in $missing) {
    $body = Convert-SchemaTypeToFieldJson -Name ([string]$field.name) -Type ([string]$field.type)
    $json = $body | ConvertTo-Json -Depth 8 -Compress
    Write-Host "创建字段：$($field.name) <$($field.type)>"
    & lark-cli base +field-create --base-token $Base --table-id $Table --json $json
    if ($LASTEXITCODE -ne 0) {
      throw "创建字段失败：$($field.name)"
    }
  }
}

function Read-SyncInput {
  param(
    [string]$Csv,
    [string]$Package
  )

  if ($Package.Trim()) {
    $resolvedPackage = Resolve-Path -LiteralPath $Package
    $payload = Get-Content -LiteralPath $resolvedPackage -Raw | ConvertFrom-Json
    if (-not $payload.records -or $payload.records.Count -eq 0) {
      throw "同步包里没有 records。"
    }
    $fields = @($payload.schema | ForEach-Object { [string]$_.name })
    if (-not $fields -or $fields.Count -eq 0) {
      $fields = @($payload.records[0].fields.PSObject.Properties | ForEach-Object { $_.Name })
    }
    $rows = foreach ($record in $payload.records) {
      ,@($fields | ForEach-Object {
        Convert-EmptyToNull $record.fields.$_
      })
    }
    return @{
      Source = [string]$resolvedPackage
      Fields = $fields
      Schema = @($payload.schema)
      Rows = @($rows)
      Count = @($payload.records).Count
      Mode = "Package"
    }
  }

  if (-not $Csv.Trim()) {
    throw "请传入 -PackagePath 飞书Base同步包 JSON，或传入旧版 -CsvPath。"
  }

  $resolvedCsv = Resolve-Path -LiteralPath $Csv
  $records = Import-Csv -LiteralPath $resolvedCsv
  if (-not $records -or $records.Count -eq 0) {
    throw "CSV 里没有可同步的数据。"
  }
  $fields = @($records[0].PSObject.Properties | ForEach-Object { $_.Name })
  $rows = foreach ($record in $records) {
    ,@($fields | ForEach-Object {
      Convert-EmptyToNull $record.$_
    })
  }
  return @{
    Source = [string]$resolvedCsv
    Fields = $fields
    Schema = @($fields | ForEach-Object { @{ name = $_; type = "text" } })
    Rows = @($rows)
    Count = @($records).Count
    Mode = "CSV"
  }
}

$inputData = Read-SyncInput -Csv $CsvPath -Package $PackagePath
$base = Resolve-BaseToken -Token $BaseToken -Url $BaseUrl
$fields = @($inputData.Fields)
$rows = @($inputData.Rows)
$chunks = @(Split-IntoChunks -Items $rows -Size 200)

Write-Host "Input: $($inputData.Source)"
Write-Host "Mode: $($inputData.Mode)"
Write-Host "BaseToken: $base"
Write-Host "Table: $TableName"
Write-Host "Fields: $($fields.Count)"
Write-Host "Rows: $($inputData.Count)"
Write-Host "Batches: $($chunks.Count)"
Write-Host "FieldNames: $($fields -join ', ')"
if ($EnsureFields) {
  Write-Host "EnsureFields: enabled"
  $preview = @($inputData.Schema | ForEach-Object { "$($_.name)<$($_.type)>" })
  Write-Host "Schema: $($preview -join ', ')"
}

if ($DryRun) {
  Write-Host "DryRun: 只预览，不写入飞书。去掉 -DryRun 后执行同步。"
  exit 0
}

$lark = Get-Command lark-cli -ErrorAction SilentlyContinue
if (-not $lark) {
  throw "未找到 lark-cli。请先确认 lark-cli 已安装并完成登录。"
}

if ($EnsureFields) {
  Ensure-BaseFields -Base $base -Table $TableName -Schema $inputData.Schema
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
