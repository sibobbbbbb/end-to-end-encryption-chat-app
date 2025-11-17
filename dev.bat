@echo off
REM dev.bat 

SETLOCAL

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo ==[ 1/3 ] Start Docker Compose (database) ==
pushd "%BACKEND%"
docker compose up -d
popd

echo ==[ 2/3 ] Start BACKEND ==
start "backend-dev" cmd /K "cd /d ""%BACKEND%"" && bun run dev"

echo ==[ 3/3 ] Start FRONTEND ==
start "frontend-dev" cmd /K "cd /d ""%FRONTEND%"" && bun run dev"

echo.
echo All services started.

ENDLOCAL
