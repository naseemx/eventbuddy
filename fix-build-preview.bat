@echo off
echo Starting Android build for PREVIEW channel with fixed Java settings...

REM Clean up any existing build artifacts
call clean-for-build.bat

REM Ensure gradlew has executable permissions in git
git update-index --chmod=+x android/gradlew
git add -f android/gradlew
git commit -m "Make gradlew executable for EAS build" --no-verify

REM Start the build process using the preview profile
echo Starting build with EAS_SKIP_AUTO_FINGERPRINT=1 to speed up build...
set EAS_SKIP_AUTO_FINGERPRINT=1
npx eas build --platform android --profile preview --non-interactive

echo Build command completed.
pause 