# ClinikChat Setup Script — Windows (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        ClinikChat Setup Script           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function New-Password {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes) -replace '[=/+]', '' | Select-Object -First 1
}

$Domain = Read-Host "Domain name (e.g., chat.example.com) [localhost]"
if (-not $Domain) { $Domain = "localhost" }

$AdminEmail = Read-Host "Admin email [admin@$Domain]"
if (-not $AdminEmail) { $AdminEmail = "admin@$Domain" }

Write-Host ""
Write-Host "Generating secure passwords..." -ForegroundColor Yellow

$PostgresPassword = New-Password
$JwtSecret = New-Password
$JwtRefreshSecret = New-Password
$MinioPassword = New-Password

if ($Domain -eq "localhost") {
    $CorsOrigin = "http://localhost"
    $Protocol = "http"
} else {
    $CorsOrigin = "https://$Domain"
    $Protocol = "https"
}

$EnvFile = "docker\.env.production"
$Timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")

$EnvContent = @"
# ClinikChat Production — generated $Timestamp
DOMAIN=$Domain

# PostgreSQL
POSTGRES_USER=clinikchat
POSTGRES_PASSWORD=$PostgresPassword
POSTGRES_DB=clinikchat

# MinIO / S3
MINIO_ROOT_USER=clinikchat-minio
MINIO_ROOT_PASSWORD=$MinioPassword

# JWT
JWT_SECRET=$JwtSecret
JWT_REFRESH_SECRET=$JwtRefreshSecret

# CORS
CORS_ORIGIN=$CorsOrigin

# Ports
HTTP_PORT=80
HTTPS_PORT=443
"@

Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
Write-Host "Environment file created: $EnvFile" -ForegroundColor Green

Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker compose -f docker/docker-compose.prod.yml --env-file $EnvFile build

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
docker compose -f docker/docker-compose.prod.yml --env-file $EnvFile up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

for ($i = 1; $i -le 30; $i++) {
    $status = docker compose -f docker/docker-compose.prod.yml --env-file $EnvFile ps 2>&1
    if ($status -match "healthy") { break }
    Write-Host "  Waiting... ($i/30)"
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
try {
    docker compose -f docker/docker-compose.prod.yml --env-file $EnvFile exec api npx prisma migrate deploy
} catch {
    Write-Host "  (No migrations to run yet)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ClinikChat is running!            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  URL:   ${Protocol}://${Domain}" -ForegroundColor Cyan
Write-Host "  Admin: ${AdminEmail}" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Save your credentials from $EnvFile" -ForegroundColor Yellow
Write-Host ""
