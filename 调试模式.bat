@echo off
chcp 65001 >nul
cd /d %~dp0
echo ========================================
echo   星际求知号 · 调试模式（无痕窗口）
echo ========================================
echo 用无痕窗口打开：每次都是全新的 Service Worker 缓存，
echo 改完代码刷新就能看到最新效果，不会被旧缓存挡住。
echo （正式使用请用「启动学习站.bat」或线上地址）
echo ----------------------------------------
where node >nul 2>nul
if not %errorlevel%==0 (
  echo 未找到 node，请先安装 Node.js
  pause
  goto :end
)
start "" msedge --inprivate "http://127.0.0.1:8791" 2>nul
if not %errorlevel%==0 start "" "http://127.0.0.1:8791"
node -e "const h=require('http'),f=require('fs'),p=require('path');const m={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/json','.png':'image/png'};h.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const F=p.join(process.cwd(),u);f.readFile(F,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':m[p.extname(F)]||'application/octet-stream','Cache-Control':'no-store'});r.end(d);});}).listen(8791,'127.0.0.1',()=>console.log('调试服务已启动：http://127.0.0.1:8791（关掉本窗口即停止）'));"
goto :end
:end
pause
