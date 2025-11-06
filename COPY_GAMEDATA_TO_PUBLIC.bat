@echo off
echo ============================================
echo   COPYING GAME DATA TO PUBLIC FOLDER
echo ============================================
echo.

echo Creating public\GameData directory...
if not exist public\GameData mkdir public\GameData

echo Copying WorldData.json...
copy /Y GameData\WorldData.json public\GameData\WorldData.json

echo Copying EnabledZones.json...
copy /Y GameData\EnabledZones.json public\GameData\EnabledZones.json

echo Copying Mobs.json...
copy /Y GameData\Mobs.json public\GameData\Mobs.json

echo.
echo ============================================
echo   COPY COMPLETE!
echo ============================================
echo.
echo The React app can now access real MUD data at runtime.
echo   - WorldData.json (Zones and Rooms)
echo   - EnabledZones.json (Active Zones)
echo   - Mobs.json (Monster Database)
echo.
pause

