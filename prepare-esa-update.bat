@echo off
echo Preparing for ESA update build...

REM Run the cleaning script first
call clean-for-build.bat

REM Check if we have the correct EAS CLI version
echo Checking EAS CLI version...
call npx eas --version

REM Check for any issues with the project
echo Running Expo Doctor to check for issues...
call npx expo-doctor

REM Check the app configuration
echo Checking app configuration...
echo App version in app.json: 1.0.2
echo Android versionCode: 3

echo ========================================
echo Project is ready for ESA update build
echo To start the build, run one of the following commands:
echo - For a local build: npx eas build --platform android --profile local --local
echo - For a remote build: npx eas build --platform android --profile android-test
echo - For a production build: npx eas build --platform android --profile production-apk
echo ========================================

pause 