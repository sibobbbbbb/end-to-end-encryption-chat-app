@echo off
REM dev.bat 

SETLOCAL

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo == [ 1/6 ] Install BACKEND dependencies (bun install) ==
pushd "%BACKEND%"
bun install
popd
echo.

echo == [ 2/6 ] Install FRONTEND dependencies (bun install) ==
pushd "%FRONTEND%"
bun install
popd
echo.

echo == [ 3/6 ] Start Docker Compose (database) ==
pushd "%BACKEND%"
docker compose up -d
echo.

echo == [ 4/6 ] Run DB Migration ==
bun db:migrate
echo.

popd

echo.
echo == [ 5/6 ] Start BACKEND ==
start "backend-dev" cmd /K "cd /d ""%BACKEND%"" && bun run dev"
echo.

echo == [ 6/6 ] Start FRONTEND ==
start "frontend-dev" cmd /K "cd /d ""%FRONTEND%"" && bun run dev"
echo.

echo.
echo All services started:

ENDLOCAL
