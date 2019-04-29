@echo off
title ³¶Ðý¶ù(9600,9601)
set MAIN_JS=%~dp0\gserver\GameServer.js
set GAME_JS=%~dp0\gserver\GameCXER.js
call node.exe %MAIN_JS% 9600 9601
@echo on

pause