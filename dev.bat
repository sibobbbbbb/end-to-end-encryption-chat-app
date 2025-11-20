@echo off
REM dev.bat 

SETLOCAL

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo == [ 1/4 ] Start Docker Compose (database) ==
pushd "%BACKEND%"
docker compose up -d

echo == [ 2/4 ] Start DB Migration ==
bun db:migrate

popd

echo.
echo == [ 3/4 ] Start BACKEND ==
start "backend-dev" cmd /K "cd /d ""%BACKEND%"" && bun run dev"

echo == [ 4/4 ] Start FRONTEND ==
start "frontend-dev" cmd /K "cd /d ""%FRONTEND%"" && bun run dev"

echo.
echo All services started.

ENDLOCAL
