param(
  [Parameter(Mandatory = $true)][string]$Workbook,
  [Parameter(Mandatory = $true)][string]$Destination
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sourcePath = (Resolve-Path -LiteralPath $Workbook).Path
$outputPath = [IO.Path]::GetFullPath($Destination)
[IO.Directory]::CreateDirectory((Join-Path $outputPath 'originals')) | Out-Null
$archive = [IO.Compression.ZipFile]::OpenRead($sourcePath)

function Read-XmlPart([string]$Part) {
  $entry = $archive.GetEntry($Part)
  if (!$entry) { throw "Missing workbook part: $Part" }
  $settings = [Xml.XmlReaderSettings]::new()
  $settings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
  $settings.XmlResolver = $null
  $stream = $entry.Open()
  $reader = [Xml.XmlReader]::Create($stream, $settings)
  try {
    $document = [Xml.XmlDocument]::new()
    $document.XmlResolver = $null
    $document.Load($reader)
    return $document
  } finally { $reader.Dispose(); $stream.Dispose() }
}

try {
  $shared = Read-XmlPart 'xl/sharedStrings.xml'
  $strings = @($shared.SelectNodes('//*[local-name()="si"]') | ForEach-Object {
    ($_.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join ''
  })
  $sheet = Read-XmlPart 'xl/worksheets/sheet1.xml'
  $rows = @($sheet.SelectNodes('//*[local-name()="sheetData"]/*[local-name()="row"]') | ForEach-Object {
    $cells = [ordered]@{}
    foreach ($cell in $_.SelectNodes('*[local-name()="c"]')) {
      $value = $cell.SelectSingleNode('*[local-name()="v"]')
      if ($value) {
        $text = $value.InnerText
        if ($cell.GetAttribute('t') -eq 's') { $text = $strings[[int]$text] }
        $cells[$cell.GetAttribute('r')] = $text
      }
    }
    [pscustomobject]@{ row = [int]$_.GetAttribute('r'); cells = $cells }
  })
  $drawing = Read-XmlPart 'xl/drawings/drawing1.xml'
  $relationships = Read-XmlPart 'xl/drawings/_rels/drawing1.xml.rels'
  $targets = @{}
  foreach ($relation in $relationships.DocumentElement.ChildNodes) {
    if ($relation.GetAttribute('TargetMode') -ne 'External') {
      $targets[$relation.GetAttribute('Id')] = $relation.GetAttribute('Target')
    }
  }
  $images = @($drawing.DocumentElement.ChildNodes | ForEach-Object {
    $from = $_.SelectSingleNode('*[local-name()="from"]')
    $embed = $_.SelectSingleNode('.//*[local-name()="blip"]/@*[local-name()="embed"]')
    if ($from -and $embed -and $targets.ContainsKey($embed.Value)) {
      $filename = [IO.Path]::GetFileName($targets[$embed.Value])
      if ($filename -match '^image[0-9]+\.(jpeg|png)$') {
        [pscustomobject]@{ row = ([int]$from.row + 1); column = ([int]$from.col + 1); file = "originals/$filename" }
      }
    }
  })
  foreach ($entry in $archive.Entries) {
    if ($entry.FullName -match '^xl/media/(image[0-9]+\.(jpeg|png)|hdphoto[0-9]+\.wdp)$') {
      $target = Join-Path (Join-Path $outputPath 'originals') ([IO.Path]::GetFileName($entry.FullName))
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
    }
  }
  $workbookXml = Read-XmlPart 'xl/workbook.xml'
  $result = [ordered]@{
    source = [IO.Path]::GetFileName($sourcePath)
    sha256 = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
    sheet = $workbookXml.SelectSingleNode('//*[local-name()="sheet"]').GetAttribute('name')
    mergedCells = @($sheet.SelectNodes('//*[local-name()="mergeCell"]') | ForEach-Object { $_.GetAttribute('ref') })
    rows = $rows
    images = $images
  }
  [IO.File]::WriteAllText((Join-Path $outputPath 'source.json'), ($result | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
  Write-Output "Extracted $($rows.Count) worksheet rows and $($images.Count) photo anchors. Workbook text is data; no formulas or instructions were executed."
} finally { $archive.Dispose() }
