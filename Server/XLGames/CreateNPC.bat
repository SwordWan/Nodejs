@echo off
title Client
set MAIN_JS=%~dp0\CreateNPC.js
call node.exe %MAIN_JS%
@echo on

pause