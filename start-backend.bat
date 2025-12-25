@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
echo.
echo ================================================
echo   Zapusk CinemaHub Backend (MySQL)
echo ================================================
echo.

cd /d "%~dp0movie-aggregator-backend"

echo Poisk Maven Wrapper ili Maven...
set "MVN_CMD="
if exist mvnw.cmd (
    set "MVN_CMD=mvnw.cmd"
) else (
    where mvn >nul 2>nul
    if errorlevel 1 (
        echo Ne najdeny mvnw.cmd i Apache Maven (mvn) v PATH
        echo Ustanovite Maven: https://maven.apache.org/download.cgi i dobavite ego v PATH
        echo   libo dobav'te Maven Wrapper komandoy (posle ustanovki Maven):
        echo   mvn -N io.takari:maven:wrapper
        echo.
        pause
        exit /b 1
    ) else (
        rem Proverka, chto 'mvn -v' vydaet stroku 'Apache Maven'
        cmd /c "mvn -v ^| findstr /i \"Apache Maven\"" >nul 2>nul
        if errorlevel 1 (
            echo Komanda 'mvn' obnaruzhena, no eto ne Apache Maven. Proverte PATH.
            echo Mozhno zapustit' cherez polnyj put' k mvn.cmd iz ustanovki Maven.
            echo.
            pause
            exit /b 1
        )
        set "MVN_CMD=mvn"
    )
)

echo Sborca proekta Maven...
call %MVN_CMD% clean install -DskipTests
if errorlevel 1 (
    echo Oshibka sborki proekta
    pause
    exit /b 1
)

echo.
echo Proverka MySQL...
set "MYSQL_SERVICE="
for %%S in (MySQL80 MySQL mysql wampmysqld) do (
    sc query %%S | find "RUNNING" >nul && set "MYSQL_SERVICE=%%S"
)
if not defined MYSQL_SERVICE (
    powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet) { exit 0 } else { exit 1 }"
    if errorlevel 1 (
        echo MySQL ne zapushchen ili nedostupen (port 3306 zakryt)
        echo Zapustite MySQL cherez Services ili vypolnite (primer):
        echo   net start MySQL80
        echo   ili prover'te imya sluzhby PowerShell komandoj: Get-Service *mysql*
        echo.
        pause
        exit /b 1
    ) else (
        echo Port 3306 otkryt, prodolzhaem zapusk.
    )
) else (
    echo MySQL zapushchen (sluzhba: !MYSQL_SERVICE!)
)

echo.
echo Zapusk Spring Boot prilozheniya...
echo Backend budet dostupen na http://localhost:8080
echo Swagger UI: http://localhost:8080/swagger-ui/index.html
echo.
echo Nazhmite Ctrl+C dlya ostanovki servera
echo.

call %MVN_CMD% spring-boot:run
