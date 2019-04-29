@echo off
title ³¶Ðý¶ù(9700,9701)
set MAIN_JS=%~dp0\gserver\GameServer.js
set GAME_JS=%~dp0\gserver\GameCXER.js
call node.exe %MAIN_JS% 9700 9701
@echo on

pause