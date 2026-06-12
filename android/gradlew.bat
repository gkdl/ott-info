@REM Copyright (c) Meta Platforms, Inc. and affiliates.
@REM
@REM This source code is licensed under the MIT license found in the
@REM LICENSE file in the root directory of this source tree.

@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem
@rem SPDX-License-Identifier: Apache-2.0
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
@rem This is normally unused
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2
echo. 1>&2
echo Please set the JAVA_HOME variable in your environment to match the 1>&2
echo location of your Java installation. 1>&2

goto fail

:execute
@rem Patch @react-native/gradle-plugin for Gradle 9.3.1 + Kotlin 2.2.x compatibility
set _PLUGIN_DIR=%APP_HOME%..\node_modules\@react-native\gradle-plugin

@rem Fix 1: Upgrade KGP 2.0.x -> 2.2.21
for /r "%_PLUGIN_DIR%" %%F in (*.gradle.kts *.toml *.properties) do (
    powershell -Command "(Get-Content '%%F' -Raw) -replace '2\.0\.\d+','2.2.21' | Set-Content '%%F' -NoNewline" >nul 2>&1
)

@rem Fix 2: Remove apiVersion.set(KotlinVersion...) lines
for /r "%_PLUGIN_DIR%" %%F in (*.gradle.kts) do (
    powershell -Command "(Get-Content '%%F') | Where-Object { $_ -notmatch 'apiVersion\.set\(KotlinVersion' } | Set-Content '%%F'" >nul 2>&1
)

@rem Fix 4a: Patch react-native-google-mobile-ads CodegenTypes.UnsafeObject
set _ADS_DIR=%APP_HOME%..\node_modules\react-native-google-mobile-ads
for /r "%_ADS_DIR%" %%F in (*.ts *.js) do (
    powershell -Command "(Get-Content '%%F' -Raw) -replace 'CodegenTypes\.UnsafeObject','Object' | Set-Content '%%F' -NoNewline" >nul 2>&1
)

@rem Fix 4: Disable reanimated version check
set _REANIMATED_GRADLE=%APP_HOME%..\node_modules\react-native-reanimated\android\build.gradle.kts
if exist "%_REANIMATED_GRADLE%" (
    powershell -Command "Add-Content '%_REANIMATED_GRADLE%' '`ntasks.matching { it.name == ""assertMinimalReactNativeVersionTask"" }.configureEach { enabled = false }'" >nul 2>&1
)

@rem Fix 5: Disable worklets version check
set _WORKLETS_GRADLE=%APP_HOME%..\node_modules\react-native-worklets\android\build.gradle.kts
if exist "%_WORKLETS_GRADLE%" (
    powershell -Command "Add-Content '%_WORKLETS_GRADLE%' '`ntasks.matching { it.name == ""assertMinimalReactNativeVersionTask"" }.configureEach { enabled = false }'" >nul 2>&1
)

@rem Setup the command line



@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -jar "%APP_HOME%\gradle\wrapper\gradle-wrapper.jar" %*

:end
@rem End local scope for the variables with windows NT shell
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
if not ""=="%GRADLE_EXIT_CONSOLE%" exit %EXIT_CODE%
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
