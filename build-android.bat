@echo off
echo Cleaning up previous build artifacts...
if exist android\app\build rmdir /s /q android\app\build
if exist android\.gradle rmdir /s /q android\.gradle

echo Starting Android build with EAS...
npx eas build --platform android --profile android-test --non-interactive
echo Build command completed. 