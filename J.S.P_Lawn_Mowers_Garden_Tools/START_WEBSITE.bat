@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  echo Open http://localhost:8000 in your browser. Press Ctrl+C to stop.
  py -m http.server 8000 --directory public --bind 127.0.0.1
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  echo Open http://localhost:8000 in your browser. Press Ctrl+C to stop.
  python -m http.server 8000 --directory public --bind 127.0.0.1
  goto :end
)
echo Python was not found. Use VS Code Live Server on public/index.html.
pause
:end

