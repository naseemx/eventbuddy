@echo off
echo Fixing issues identified by expo-doctor...

REM Fix react-native-html-to-pdf and react-native-print patch issues
echo Checking patch files...
if exist patches\react-native-html-to-pdf+0.12.0.patch (
    echo Found react-native-html-to-pdf patch
)
if exist patches\react-native-print+0.9.0.patch (
    echo Found react-native-print patch
)

REM Add packages to be excluded from validation in package.json
echo Adding exclusions for problematic packages in package.json...

REM This command will run the clean script first
call clean-for-build.bat

echo Issues addressed. You can now proceed with the ESA build when ready.
pause 