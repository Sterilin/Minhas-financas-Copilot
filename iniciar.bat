@echo off
title Minhas Financas (Servidor Local)
cd /d "%~dp0"

echo ========================================================
echo   Iniciando Minhas Financas (Modo Local)...
echo ========================================================

set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%"

:: Aguarda 2 segundos e abre o navegador automaticamente
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

call "C:\Program Files\nodejs\npm.cmd" run dev
pause
