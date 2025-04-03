@echo off
echo Cleaning up previous build artifacts...
if exist android\app\build rmdir /s /q android\app\build
if exist android\.gradle rmdir /s /q android\.gradle
if exist build-output rmdir /s /q build-output
mkdir build-output

echo Starting local Android build with EAS...
npx eas build --platform android --profile local --local
echo Build command completed. 