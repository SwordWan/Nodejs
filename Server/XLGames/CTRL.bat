@echo off

set ti=һ���Զ����ű�

::���ñ���
title %ti%

:List
echo 1 �رշ�����
echo 2 �򿪷���������
echo 3 ����������
echo 4 �����ͻ��˴���

choice /c 1234 /N /m "ѡ������:"
set op=0
if %errorlevel%==1 set /a op=%op%+1
if %errorlevel%==2 set /a op=%op%+2
if %errorlevel%==3 set /a op=%op%+4
if %errorlevel%==4 set /a op=%op%+8

goto All

exit

:All

::�رշ�����
set /a res=%op%"&"1
if %res% GTR 0 (
taskkill /fi "windowtitle eq ��¼������" /im cmd.exe
taskkill /fi "windowtitle eq ������(9600,9601)" /im cmd.exe
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
