@echo off
echo Cleaning cache directories that may affect the ESA build...

REM Clean Android build directories
if exist android\app\build rmdir /s /q android\app\build
if exist android\.gradle rmdir /s /q android\.gradle
if exist android\build rmdir /s /q android\build

REM Clean Expo cache directories
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Clean build output
if exist build-output rmdir /s /q build-output

REM Clean Metro bundler cache
if exist node_modules\.metro-cache rmdir /s /q node_modules\.metro-cache

echo All cache directories cleaned. Ready for build.
pause 