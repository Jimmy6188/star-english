@echo off
chcp 65001 >nul
cd /d %~dp0
echo ========================================
echo   星际英语站 启动中...
echo ========================================
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8123
  python -m http.server 8123
  goto :end
)
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8123
  npx --yes http-server -p 8123 -c-1 .
  goto :end
)
echo 未找到 python/node，直接用浏览器打开 index.html（功能完整，仅无法离线安装）
start "" index.html
:end
