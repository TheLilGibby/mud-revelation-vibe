@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║   🎉 REVELATION WORLD MAP - REAL MUD DATA EDITION            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo.
echo ============================================
echo   Step 1: Copying Real MUD Data
echo ============================================
echo.

if not exist public\GameData mkdir public\GameData

echo Copying WorldData.json...
copy /Y GameData\WorldData.json public\GameData\WorldData.json >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to copy WorldData.json
    pause
    exit /b 1
)

echo Copying EnabledZones.json...
copy /Y GameData\EnabledZones.json public\GameData\EnabledZones.json >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to copy EnabledZones.json
    pause
    exit /b 1
)

echo [✓] Game data copied successfully!
echo.
echo ============================================
echo   Step 2: Starting React Development Server
echo ============================================
echo.
echo The browser will open automatically at http://localhost:3000
echo.
echo 🎮 CONTROLS:
echo   • Click any location on the map
echo   • Press ENTER to see real room layouts
echo   • Press ESC to close detailed maps
echo   • Use Arrow Keys to navigate multi-level zones
echo.
echo 📊 NEW FEATURES:
echo   • Real room names and descriptions
echo   • NPC locations (👹 icon)
echo   • Accurate exits (N/S/E/W/Up/Down)
echo   • Multi-level zone support
echo   • Zone exit markers (🚪 icon)
echo.
echo Press Ctrl+C to stop the server when done.
echo.
echo ============================================
echo.

npm start

