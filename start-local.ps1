param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$env:IA_LOCAL_DEVELOPMENT = "1"

if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    throw "PHP no esta instalado o no se encuentra en PATH."
}

$phpArguments = @()
$certificateCandidates = @(
    $env:SSL_CERT_FILE,
    "C:\Program Files\Git\mingw64\etc\ssl\certs\ca-bundle.crt",
    "C:\Program Files\Git\usr\ssl\certs\ca-bundle.crt"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

if ($certificateCandidates.Count -gt 0) {
    $certificateBundle = $certificateCandidates[0]
    $phpArguments += @(
        "-d", "curl.cainfo=$certificateBundle",
        "-d", "openssl.cafile=$certificateBundle"
    )
}

$phpArguments += @("-S", "127.0.0.1:$Port", "-t", $projectRoot)

Write-Host "Sitio disponible en http://127.0.0.1:$Port/"
Write-Host "Presiona Ctrl+C para detenerlo."

& php @phpArguments
