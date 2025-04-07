@echo off
echo Starting remote Android build with EAS...

REM Clean up any existing build artifacts
call clean-for-build.bat

REM Ensure gradlew has executable permissions in git
git update-index --chmod=+x android/gradlew

REM Start the build process
npx eas build --platform android --profile android-test

echo Build command completed.
pause 