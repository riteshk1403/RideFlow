@echo off
set "PATH=C:\Users\shrad\AppData\Local\Programs\apache-maven\apache-maven-3.9.9\bin;%PATH%"

if exist "%~dp0.env" (
    for /f "usebackq tokens=1* delims==" %%A in ("%~dp0.env") do (
        if not "%%A"=="" set "%%A=%%B"
    )
)

echo ==============================================
echo    Starting RideFlow Spring Boot Backend...
echo ==============================================
cd /d "%~dp0backend"
mvn spring-boot:run
pause
