@echo off
title Criar Atalho na Area de Trabalho
cd /d "%~dp0"

echo Criando atalho na Area de Trabalho...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut(\"$desktop\Minhas Financas.lnk\"); $sc.TargetPath = '%~dp0Abrir Minhas Financas.bat'; $sc.WorkingDirectory = '%~dp0'; $sc.Save()"

if %ERRORLEVEL% equ 0 (
    echo Atalho "Minhas Financas" criado com sucesso na sua Area de Trabalho!
) else (
    echo Ocorreu um erro ao criar o atalho.
)

pause

