@echo off
echo ================================================
echo   Pushing to GitHub Repository
echo ================================================
echo.

REM Add remote repository
echo Adding remote repository...
git remote add origin https://github.com/TheLilGibby/mud-revelation-vibe.git
if errorlevel 1 (
    echo Remote already exists, updating...
    git remote set-url origin https://github.com/TheLilGibby/mud-revelation-vibe.git
)
echo.

REM Add all files
echo Adding files to git...
git add .
echo.

REM Commit
echo Committing files...
git commit -m "Initial commit: Revelation MUD Game Library - React version with real game data"
echo.

REM Create main branch and push
echo Pushing to GitHub...
git branch -M main
git push -u origin main
echo.

echo ================================================
echo   Push Complete!
echo ================================================
echo.
echo Repository: https://github.com/TheLilGibby/mud-revelation-vibe
echo.
pause

