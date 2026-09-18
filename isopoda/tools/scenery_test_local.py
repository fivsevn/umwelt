#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import webbrowser

ROOT = Path(__file__).resolve().parents[2]
HOST = "127.0.0.1"
PORT = 8765

PAGE = r"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ISOPODA / 场景要素本地测试</title>
<style>
:root{color-scheme:dark;font-family:monospace;background:#203c31;color:#d7d8bf}
*{box-sizing:border-box}body{margin:0;background:#18382e;min-height:100vh}
main{width:min(1180px,calc(100% - 28px));margin:24px auto 64px}
header{display:flex;justify-content:space-between;align-items:center;border:2px solid #89917a;background:#526f67;padding:9px 12px;box-shadow:5px 5px 0 #10251e}
header div{display:grid;gap:3px}header small{opacity:.75}
section{margin-top:22px;border:2px solid #667761;background:#2b3b30;padding:14px;box-shadow:5px 5px 0 rgba(10,20,16,.45)}
h1,h2,p{margin:0}h2{font-size:15px;margin-bottom:12px}
.hero{display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px;align-items:start}
.hero p{font-size:12px;line-height:1.7;margin-top:8px;color:#aeb89c}
canvas{display:block;image-rendering:pixelated;background:#40362d;border:2px solid #65715f;max-width:100%}
.hero canvas{width:min(100%,768px);height:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.tile{background:#25342a;border:1px solid #596853;padding:8px}
.tile canvas{width:100%;height:auto}.tile small{display:block;margin-top:6px;color:#9eaa91}
.six{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
@media(max-width:720px){.hero{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<header><div><strong>ISOPODA / 场景要素本地测试</strong><small>仅 localhost · 纯程序化像素绘制 · 无图片资源</small></div></header>
<section class="hero"><div><h1>组合场景</h1><p>这里与游戏使用同一套 scenery renderer。只用于本地测试，不部署成网页。</p></div><canvas id="scene" width="384" height="430"></canvas></section>
<section><h2>枯叶 / leaf.mjs</h2><div id="leaves" class="grid six"></div></section>
<section><h2>水苔 / moss.mjs</h2><div id="moss" class="grid"></div></section>
<section><h2>木片 / bark.mjs</h2><div id="bark" class="grid"></div></section>
<section><h2>墨鱼骨 / cuttlebone.mjs</h2><div id="cuttlebone" class="grid"></div></section>
<section><h2>基质 / substrate.mjs</h2><div id="substrate" class="grid"></div></section>
</main>
<script type="module">
import {drawBaseScene,drawLeaf,drawMossPatch,drawBark,drawCuttlebone,drawSubstrate} from '/isopoda/scenery/index.mjs?v=local';

const $=s=>document.querySelector(s);
function makeCanvas(w=180,h=140){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function tile(parent,label,draw,w=180,h=140){
 const wrap=document.createElement('div');wrap.className='tile';
 const c=makeCanvas(w,h),caption=document.createElement('small');caption.textContent=label;
 wrap.append(c,caption);parent.append(wrap);
 const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;draw(ctx,c);
}
{
 const c=$('#scene'),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
 drawBaseScene(ctx,{wetZones:[{x:48,y:210,rx:72,ry:210,moisture:70}],light:78,seed:57});
}
for(let i=0;i<6;i++)tile($('#leaves'),`variant ${i} · scale ${(.65+i*.08).toFixed(2)}`,(ctx,c)=>{
 drawSubstrate(ctx,{wetZones:[],light:80,seed:70+i});
 drawLeaf(ctx,{x:c.width/2,y:c.height/2,a:-.65+i*.28,variant:i,scale:.65+i*.08,tone:i%4,seed:100+i,gap:i%2===0});
});
tile($('#moss'),'upper wet patch',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[{x:70,y:70,rx:80,ry:65,moisture:78}],light:80,seed:10});drawMossPatch(ctx,{x:85,y:80,rx:75,ry:50,seed:3,wetness:.8,alpha:.72})});
tile($('#moss'),'lower smaller patch',(ctx,c)=>{drawSubstrate(ctx,{wetZones:[{x:65,y:90,rx:60,ry:45,moisture:62}],light:80,seed:11});drawMossPatch(ctx,{x:80,y:88,rx:53,ry:32,seed:11,wetness:.62,alpha:.66})});
tile($('#bark'),'main shelter',(ctx)=>{drawSubstrate(ctx,{wetZones:[],light:82,seed:20});drawBark(ctx,{x:90,y:70,a:-.08,scale:.82,variant:0,seed:57})});
tile($('#bark'),'secondary fragment',(ctx)=>{drawSubstrate(ctx,{wetZones:[],light:82,seed:21});drawBark(ctx,{x:90,y:70,a:.10,scale:.78,variant:1,seed:61})});
tile($('#cuttlebone'),'calcium source',(ctx)=>{drawSubstrate(ctx,{wetZones:[],light:82,seed:25});drawCuttlebone(ctx,{x:90,y:70,a:-.42,scale:1.15,seed:67})});
tile($('#substrate'),'dry',(ctx)=>drawSubstrate(ctx,{wetZones:[],light:82,seed:57}));
tile($('#substrate'),'moisture gradient',(ctx,c)=>drawSubstrate(ctx,{wetZones:[{x:35,y:c.height/2,rx:58,ry:120,moisture:80}],light:82,seed:57}));
</script>
</body>
</html>
"""

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/__scenery_test__", "/__scenery_test__/", "/__scenery_test__/index.html"):
            data = PAGE.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

if __name__ == "__main__":
    os.chdir(ROOT)
    url = f"http://{HOST}:{PORT}/__scenery_test__/"
    print(f"Scenery test: {url}")
    print("Only bound to 127.0.0.1; this page is not deployed.")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
