@echo off
echo Cleaning up build folders manually...
if exist android\app\build rmdir /s /q android\app\build
if exist android\.gradle rmdir /s /q android\.gradle
if exist build-output rmdir /s /q build-output
mkdir build-output

echo Building APK directly with Gradle...
cd android
call gradlew.bat --no-daemon :app:assembleRelease -x clean
cd ..

echo Copying APK to build-output folder...
if exist android\app\build\outputs\apk\release\app-release.apk (
  copy android\app\build\outputs\apk\release\app-release.apk build-output\
  echo Build completed successfully! APK is in build-output folder.
) else (
  echo Build failed or APK not found.
) 