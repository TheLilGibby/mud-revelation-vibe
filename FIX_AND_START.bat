@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  Fixing GameData Location and Starting React App             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Create the GameData folder if it doesn't exist
if not exist "public\GameData" (
    echo Creating public\GameData folder...
    mkdir "public\GameData"
    echo ✓ Folder created
)

REM Move WorldData.json if it's in the wrong place
if exist "public\WorldData.json" (
    echo Moving WorldData.json to correct location...
    move /Y "public\WorldData.json" "public\GameData\WorldData.json" >nul
    echo ✓ WorldData.json moved
) else if not exist "public\GameData\WorldData.json" (
    echo Copying WorldData.json...
    copy /Y "GameData\WorldData.json" "public\GameData\WorldData.json" >nul
    echo ✓ WorldData.json copied
) else (
    echo ✓ WorldData.json already in correct location
)

REM Move EnabledZones.json if it's in the wrong place
if exist "public\EnabledZones.json" (
    echo Moving EnabledZones.json to correct location...
    move /Y "public\EnabledZones.json" "public\GameData\EnabledZones.json" >nul
    echo ✓ EnabledZones.json moved
) else if not exist "public\GameData\EnabledZones.json" (
    echo Copying EnabledZones.json...
    copy /Y "GameData\EnabledZones.json" "public\GameData\EnabledZones.json" >nul
    echo ✓ EnabledZones.json copied
) else (
    echo ✓ EnabledZones.json already in correct location
)

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  ✓ Files are now in the correct location!                    ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo   public\GameData\WorldData.json
echo   public\GameData\EnabledZones.json
echo.
echo Starting React app...
echo.
echo The browser will open automatically.
echo Try clicking Epiach and pressing Enter - it should work now!
echo.
echo Press Ctrl+C to stop the server when done.
echo.

npm start

