@echo off
echo ========================================
echo    OptiAI Installation Script
echo ========================================
echo.

echo Checking for OptiAI.exe...
if not exist "dist\OptiAI.exe" (
    echo ERROR: OptiAI.exe not found in dist folder!
    echo Please make sure you are running this script from the OptiAI project directory.
    echo Current directory: %CD%
    echo Looking for: %CD%\dist\OptiAI.exe
    pause
    exit /b 1
)

echo Creating OptiAI directory in user folder...
if not exist "%USERPROFILE%\OptiAI" mkdir "%USERPROFILE%\OptiAI"

echo Copying OptiAI files...
copy "dist\OptiAI.exe" "%USERPROFILE%\OptiAI\" /Y
copy "dist\index.html" "%USERPROFILE%\OptiAI\" /Y
if exist "dist\assets" xcopy "dist\assets" "%USERPROFILE%\OptiAI\assets\" /E /I /Y

echo Verifying installation...
if exist "%USERPROFILE%\OptiAI\OptiAI.exe" (
    echo OptiAI.exe copied successfully!
) else (
    echo ERROR: Failed to copy OptiAI.exe!
    pause
    exit /b 1
)

echo Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\OptiAI.lnk'); $Shortcut.TargetPath = '%USERPROFILE%\OptiAI\OptiAI.exe'; $Shortcut.WorkingDirectory = '%USERPROFILE%\OptiAI'; $Shortcut.Save()"

echo Creating start menu shortcut...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\OptiAI" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\OptiAI"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\OptiAI\OptiAI.lnk'); $Shortcut.TargetPath = '%USERPROFILE%\OptiAI\OptiAI.exe'; $Shortcut.WorkingDirectory = '%USERPROFILE%\OptiAI'; $Shortcut.Save()"

echo Removing old broken shortcuts...
if exist "%USERPROFILE%\Desktop\OptiAI.lnk" (
    echo Old desktop shortcut found and will be replaced.
)

echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo OptiAI has been installed to:
echo   %USERPROFILE%\OptiAI\
echo.
echo Desktop shortcut created.
echo Start menu shortcut created.
echo.
echo You can now run OptiAI from:
echo   - Desktop shortcut (OptiAI.lnk)
echo   - Start menu (OptiAI folder)
echo   - %USERPROFILE%\OptiAI\OptiAI.exe
echo.
echo Starting OptiAI...
start "" "%USERPROFILE%\OptiAI\OptiAI.exe"
echo.
echo OptiAI is starting up! Please wait a moment for the application to load.
echo.
pause
