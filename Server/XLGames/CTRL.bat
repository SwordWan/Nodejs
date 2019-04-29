@echo off

set ti=一个自动化脚本

::设置标题
title %ti%

:List
echo 1 关闭服务器
echo 2 打开服务器代码
echo 3 启动服务器
echo 4 启动客户端代码

choice /c 1234 /N /m "选择输入:"
set op=0
if %errorlevel%==1 set /a op=%op%+1
if %errorlevel%==2 set /a op=%op%+2
if %errorlevel%==3 set /a op=%op%+4
if %errorlevel%==4 set /a op=%op%+8

goto All

exit

:All

::关闭服务器
set /a res=%op%"&"1
if %res% GTR 0 (
taskkill /fi "windowtitle eq 登录服务器" /im cmd.exe
taskkill /fi "windowtitle eq 扯旋儿(9600,9601)" /im cmd.exe
)

::
set /a res=%op%"&"2
if %res% GTR 0 (
code ../XLGames
)

::
set /a res=%op%"&"4
if %res% GTR 0 (
start /MIN %~dp0/CenterServer.bat
start /MIN %~dp0/GameXuan.bat
)

::
set /a res=%op%"&"8
if %res% GTR 0 (
code ../XLGames
)

goto List
