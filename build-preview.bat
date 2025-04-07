@echo off
echo Starting Android build for PREVIEW channel...

REM Clean up any existing build artifacts
call clean-for-build.bat

REM Ensure gradlew has executable permissions in git
git update-index --chmod=+x android/gradlew

REM Start the build process using the preview profile
npx eas build --platform android --profile preview

echo Build command completed.
pause 