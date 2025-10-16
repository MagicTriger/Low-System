@echo off
setlocal enabledelayedexpansion

:: Step 1: 获取当前版本信息
for /f "tokens=*" %%i in ('git describe --tags') do set version=%%i

:: 检查是否获取到版本信息
if "%version%"=="" (
    echo No version information found. Exiting.
    exit /b
)

:: Step 2: 解析版本号
:: 假设版本号格式为 v1.6.5-6-gdb0b5e3a，提取 v1.6.5
for /f "tokens=1 delims=-" %%i in ("%version%") do set baseVersion=%%i

:: 提取主版本号、次版本号和小版本号
for /f "tokens=1-3 delims=." %%a in ("%baseVersion%") do (
    set major=%%a
    set minor=%%b
    set patch=%%c
)

:: 小版本号加1
set /a patch+=1

:: 构造新的版本号
set newVersion=!major!.!minor!.!patch!

:: Step 3: 创建新的tag
echo Creating new tag: !newVersion!
git tag !newVersion!

:: Step 4: 推送新的tag
echo Pushing new tag to remote repository...
git push origin !newVersion!

echo Tag !newVersion! created and pushed successfully.
endlocal