@echo off
title DO TRAVESSEIRO AO GROOVE
color 0A

echo.
echo  ========================================
echo   DO TRAVESSEIRO AO GROOVE
echo   Curso de Percussao
echo  ========================================
echo.

:: Verifica se o servidor ja esta rodando (so LISTENING real, ignora TIME_WAIT)
netstat -ano 2>nul | findstr "LISTENING" | findstr ":3000 " >nul 2>nul
if %errorlevel% equ 0 (
    echo  [!] Servidor ja esta em execucao.
    echo  [!] Acesse: http://localhost:3000
    echo.
    pause
    exit /b
)

:: Verifica se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo.
    echo  Baixe em: https://nodejs.org
    echo  Instale e tente novamente.
    echo.
    pause
    exit /b
)

:: Verifica se node_modules existe, senao instala
if not exist "node_modules" (
    echo  Primeira execucao - instalando dependencias...
    echo.
    call npm install
    echo.
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao instalar dependencias.
        pause
        exit /b
    )
    echo  Dependencias instaladas com sucesso!
    echo.
)

echo  Iniciando servidor...
echo.

:: Abre o navegador apos 2 segundos (so abre uma vez)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Inicia o servidor
node server.js

pause
