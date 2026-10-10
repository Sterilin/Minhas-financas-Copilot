@echo off
cd /d "%~dp0"
echo ========================================================
echo   Iniciando Minhas Financas no navegador...
echo ========================================================
call "C:\Program Files\nodejs\npm.cmd" run dev
pause
