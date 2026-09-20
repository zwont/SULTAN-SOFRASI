from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json, threading, uuid
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parent
DB=ROOT/'orders.json'
LOCK=threading.Lock()

def read_orders():
    with LOCK:
        if not DB.exists(): return []
        try: return json.loads(DB.read_text(encoding='utf-8'))
        except: return []

def write_orders(data):
    with LOCK: DB.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def send_json(self, obj, code=200):
        raw=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if urlparse(self.path).path=='/api/orders': return self.send_json(read_orders())
        if self.path=='/': self.path='/index.html'
        return super().do_GET()
    def do_DELETE(self):
        path=urlparse(self.path).path
        if not path.startswith('/api/orders/'):
            return self.send_json({'error':'not found'},404)
        oid=path.rsplit('/',1)[-1]
        orders=read_orders()
        new=[o for o in orders if str(o.get('id',''))!=oid]
        if len(new)==len(orders):
            return self.send_json({'error':'order not found'},404)
        write_orders(new)
        return self.send_json({'ok':True})

    def do_POST(self):
        if urlparse(self.path).path!='/api/orders': return self.send_json({'error':'not found'},404)
        try:
            n=int(self.headers.get('Content-Length','0')); data=json.loads(self.rfile.read(n) or b'{}')
            name=str(data.get('name','')).strip(); items=data.get('items',[])
            if not name or not isinstance(items,list) or not items: return self.send_json({'error':'name/items required'},400)
            clean=[]
            for x in items[:50]:
                if isinstance(x,dict): clean.append({'name':str(x.get('name','Ürün'))[:100],'qty':max(1,int(x.get('qty',1)))})
                else: clean.append({'name':str(x)[:100],'qty':1})
            order={'id':uuid.uuid4().hex[:10],'name':name[:80],'items':clean,'time':__import__('datetime').datetime.now().strftime('%d.%m.%Y %H:%M:%S')}
            orders=read_orders(); orders.insert(0,order); write_orders(orders)
            return self.send_json(order,201)
        except Exception as e: return self.send_json({'error':str(e)},400)

if __name__=='__main__':
    print('Sultan Sofrası çalışıyor: http://localhost:8000')
    print('Telefondan aynı Wi-Fi için PC IP adresini kullan: http://PC-IP:8000')
    ThreadingHTTPServer(('0.0.0.0',8000),Handler).serve_forever()
