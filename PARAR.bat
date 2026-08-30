@echo off
title DO TRAVESSEIRO AO GROOVE - PARAR
color 0C

echo.
echo  ========================================
echo   Parando o servidor do curso...
echo  ========================================
echo.

powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*server.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Servidor ' + $_.ProcessId + ' parado.') }"

echo.
if errorlevel 1 (
    echo  Nenhum servidor em execucao ou ja parado.
) else (
    echo  Servidor parado com sucesso.
)
echo.
pause
