# Save this as cleanup-local.ps1 in the project root directory
# Run this script in PowerShell to safely stop Minikube and clean up all local containers and images.

Write-Host "[*] Starting DevOps stack cleanup..." -ForegroundColor Cyan

# 1. Stop Minikube safely saving its configuration
Write-Host ""
Write-Host "[*] Stopping Minikube cluster..." -ForegroundColor Yellow
minikube stop

# 2. Shut down and clean up local Docker Compose containers & volumes
if (Test-Path "docker-compose.yml") {
    Write-Host ""
    Write-Host "[*] Tearing down Docker Compose containers and volumes..." -ForegroundColor Yellow
    docker compose down -v --remove-orphans
}

# 3. Remove only Docker images specific to this Student ERP project
Write-Host ""
Write-Host "[*] Pruning only Student ERP Docker images..." -ForegroundColor Yellow
$erpImages = docker images -q "*student-erp*"
if ($erpImages) {
    docker rmi $erpImages -f 2>$null
    Write-Host "Deleted Student ERP project images." -ForegroundColor Green
} else {
    Write-Host "No Student ERP project images found to delete." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[SUCCESS] Cleanup complete! Only this project's resources have been stopped and deleted." -ForegroundColor Green
