@echo off
title 管理后台
set MAIN_JS=%~dp0\app.js
call node.exe %MAIN_JS%
@echo on

pause