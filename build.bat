@echo off
setlocal enabledelayedexpansion

set IMAGE_NAME=compute-monitor-console
set IMAGE_TAG=0.1.0

if not "%~1"=="" set IMAGE_TAG=%~1

set OUTPUT_DIR=%CD%\releases
set TAR_FILE=%OUTPUT_DIR%\%IMAGE_NAME%_%IMAGE_TAG%.tar

echo [1/4] Checking Docker...
docker version >nul 2>nul
if errorlevel 1 (
  echo Docker is not available. Please start Docker Desktop or install Docker Engine.
  exit /b 1
)

echo [2/4] Building image %IMAGE_NAME%:%IMAGE_TAG% ...
docker build -t %IMAGE_NAME%:%IMAGE_TAG% .
if errorlevel 1 (
  echo Docker image build failed.
  exit /b 1
)

echo [3/4] Creating output directory...
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo [4/4] Saving image tar: %TAR_FILE%
docker save -o "%TAR_FILE%" %IMAGE_NAME%:%IMAGE_TAG%
if errorlevel 1 (
  echo Docker image save failed.
  exit /b 1
)

echo Done.
echo Image: %IMAGE_NAME%:%IMAGE_TAG%
echo Tar: %TAR_FILE%
echo.
echo Load on VM:
echo   docker load -i %IMAGE_NAME%_%IMAGE_TAG%.tar
echo Run on VM:
echo   docker run -d --name compute-monitor-console -p 80:80 -e BACKEND_URL=http://BACKEND_HOST:8080 %IMAGE_NAME%:%IMAGE_TAG%

endlocal
