@echo off
set "PATH=C:\Users\shrad\AppData\Local\Programs\apache-maven\apache-maven-3.9.9\bin;%PATH%"
echo ==============================================
echo    Starting RideFlow Spring Boot Backend...
echo ==============================================
cd /d "%~dp0"
mvn spring-boot:run
pause
