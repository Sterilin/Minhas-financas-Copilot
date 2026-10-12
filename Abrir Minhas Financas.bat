@echo off
title Minhas Financas
cd /d "%~dp0"

echo ========================================================
echo   Abrindo Minhas Financas...
echo ========================================================

:: Tenta abrir em modo App (janela independente sem barra de navegacao)
where msedge >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start msedge --app=https://sterilin.github.io/Minhas-financas-Copilot/
    exit /b
)

where chrome >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start chrome --app=https://sterilin.github.io/Minhas-financas-Copilot/
    exit /b
)

:: Caso nao tenha Edge ou Chrome instalado, abre no navegador padrao
start https://sterilin.github.io/Minhas-financas-Copilot/
exit /b

