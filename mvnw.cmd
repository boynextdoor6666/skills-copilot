@REM --------------------------------------------------------------------------
@REM Maven Wrapper startup script for Windows
@REM --------------------------------------------------------------------------
@echo off
setlocal

set MAVENW_BASEDIR=%~dp0
if not exist "%MAVENW_BASEDIR%\.mvn\wrapper\maven-wrapper.jar" (
  echo Downloading Maven Wrapper...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "
    $ErrorActionPreference = 'Stop';
    $uri = 'https://repo.maven.apache.org/maven2/io/takari/maven-wrapper/0.5.6/maven-wrapper-0.5.6.jar';
    $out = '%MAVENW_BASEDIR%\.mvn\wrapper\maven-wrapper.jar';
    Invoke-WebRequest -Uri $uri -OutFile $out
  "
  if errorlevel 1 (
    echo Failed to download Maven Wrapper jar.
    exit /b 1
  )
)

set WRAPPER_JAR=%MAVENW_BASEDIR%\.mvn\wrapper\maven-wrapper.jar
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

set JAVA_EXE=java

"%JAVA_EXE%" -cp "%WRAPPER_JAR%" %WRAPPER_LAUNCHER% %*
