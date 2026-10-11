from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[3]
PAGE='/docs/art/rooftop-furniture-02/preview/'
class LocalPreview(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  route=urlsplit(self.path).path
  if route=='/':
   self.send_response(302);self.send_header('Location',PAGE);self.end_headers();return
  super().do_GET()
 def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
print('本地物品页：http://127.0.0.1:4186'+PAGE,flush=True)
print('本地空场景页：http://127.0.0.1:4186/rooftop/?stage=background',flush=True)
ThreadingHTTPServer(('127.0.0.1',4186),LocalPreview).serve_forever()
