set VERSION=1.0.0.135
set URL=http://39.98.57.155:9101/update/
set LOCAL_PATH=XuanGame

rd /s/q .\%LOCAL_PATH%\
pause
node version_generator.js -v %VERSION% -u %URL% -s ../build/jsb-default/ -d ../assets/resources/ver/

pause
xcopy ..\build\jsb-default\src .\%LOCAL_PATH%\src\ /s
xcopy ..\build\jsb-default\res .\%LOCAL_PATH%\res\ /s

xcopy ..\assets\resources\ver\project.manifest .\%LOCAL_PATH%\ /s
xcopy ..\assets\resources\ver\version.manifest .\%LOCAL_PATH%\ /s
pause