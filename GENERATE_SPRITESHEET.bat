@echo off
echo ======================================================================
echo   GENERATING MOB SPRITE SHEET
echo ======================================================================
echo.
echo This will generate a single sprite sheet containing all mob pixel art.
echo Performance improvement: 1046 HTTP requests -^> 1 HTTP request
echo.
python generate_mob_spritesheet.py
echo.
pause

