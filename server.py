from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime
from zoneinfo import ZoneInfo
import json, threading, uuid, os

ROOT = Path(__file__).resolve().parent
LOCK = threading.Lock()
TZ = ZoneInfo('Europe/Istanbul')
DATABASE_URL = os.environ.get('DATABASE_URL', '').strip()
DB_ENABLED = bool(DATABASE_URL)

try:
    import psycopg
except Exception:
    psycopg = None
    DB_ENABLED = False

DEFAULT_MENU = [
    {'key':'yemek','title':'Yemekler','icon':'🍽️','items':['Etli Kuru Fasulye','Bulgur Pilavı','Pirinç Pilavı','Köfte & Patates']},
    {'key':'salata','title':'Salatalar','icon':'🥗','items':['Havuç Tarator','Mor Lahana','Mevsim Salata','Çoban Salata']},
    {'key':'tatli','title':'Tatlılar','icon':'🍰','items':['Sütlaç','Baklava']},
    {'key':'icecek','title':'İçecekler','icon':'🥤','items':['Ayran','Kola Zero']},
]
MENU_FILE = ROOT / 'menu.json'
ORDERS_FILE = ROOT / 'orders.json'
PHOTOS_FILE = ROOT / 'photos.json'

def read_json(path, default):
    with LOCK:
        try:
            if path.exists():
                return json.loads(path.read_text(encoding='utf-8'))
        except Exception:
            pass
        return default

def write_json(path, value):
    tmp = path.with_suffix(path.suffix + '.tmp')
    with LOCK:
        tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
        tmp.replace(path)

def db_conn():
    if not DB_ENABLED or psycopg is None:
        return None
    return psycopg.connect(DATABASE_URL, connect_timeout=10)

def db_init():
    global DB_ENABLED
    if not DATABASE_URL or psycopg is None:
        DB_ENABLED = False
        return
    try:
        with db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
                cur.execute('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, name TEXT NOT NULL, message TEXT NOT NULL DEFAULT \'\', items TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL)')
                # Migrate existing JSON files only when the DB is empty.
                cur.execute("SELECT 1 FROM app_state WHERE key='menu'")
                if cur.fetchone() is None:
                    menu = read_json(MENU_FILE, DEFAULT_MENU)
                    cur.execute('INSERT INTO app_state(key,value) VALUES(%s,%s)', ('menu', json.dumps(menu, ensure_ascii=False)))
                cur.execute("SELECT 1 FROM app_state WHERE key='photos'")
                if cur.fetchone() is None:
                    photos = read_json(PHOTOS_FILE, {'photoA':'','photoB':''})
                    cur.execute('INSERT INTO app_state(key,value) VALUES(%s,%s)', ('photos', json.dumps(photos, ensure_ascii=False)))
                cur.execute('SELECT COUNT(*) FROM orders')
                if cur.fetchone()[0] == 0:
                    old = read_json(ORDERS_FILE, [])
                    if isinstance(old, list):
                        for o in old:
                            if not isinstance(o, dict):
                                continue
                            oid = str(o.get('id') or uuid.uuid4().hex[:10])
                            raw_time = o.get('time') or datetime.now(TZ).strftime('%d.%m.%Y %H:%M:%S')
                            try:
                                dt = datetime.strptime(raw_time, '%d.%m.%Y %H:%M:%S').replace(tzinfo=TZ)
                            except Exception:
                                dt = datetime.now(TZ)
                            cur.execute('INSERT INTO orders(id,name,message,items,created_at) VALUES(%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING', (oid, str(o.get('name',''))[:80], str(o.get('message',''))[:500], json.dumps(o.get('items',[]), ensure_ascii=False), dt))
            conn.commit()
        print('PostgreSQL bağlantısı aktif.')
    except Exception as e:
        DB_ENABLED = False
        print('PostgreSQL kullanılamadı, dosya yedeğine geçildi:', e)

def db_get_state(key, default):
    try:
        with db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT value FROM app_state WHERE key=%s', (key,))
                row = cur.fetchone()
                return json.loads(row[0]) if row else default
    except Exception:
        return default

def db_set_state(key, value):
    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('INSERT INTO app_state(key,value) VALUES(%s,%s) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value', (key, json.dumps(value, ensure_ascii=False)))
        conn.commit()

def get_menu():
    return db_get_state('menu', DEFAULT_MENU) if DB_ENABLED else read_json(MENU_FILE, DEFAULT_MENU)

def set_menu(menu):
    if DB_ENABLED:
        db_set_state('menu', menu)
    else:
        write_json(MENU_FILE, menu)

def get_photos():
    return db_get_state('photos', {'photoA':'','photoB':''}) if DB_ENABLED else read_json(PHOTOS_FILE, {'photoA':'','photoB':''})

def set_photos(photos):
    if DB_ENABLED:
        db_set_state('photos', photos)
    else:
        write_json(PHOTOS_FILE, photos)

def get_orders():
    if not DB_ENABLED:
        return read_json(ORDERS_FILE, [])
    try:
        with db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT id,name,message,items,created_at FROM orders ORDER BY created_at DESC')
                out=[]
                for oid,name,message,items,created_at in cur.fetchall():
                    if created_at.tzinfo is None: created_at=created_at.replace(tzinfo=TZ)
                    out.append({'id':oid,'name':name,'message':message,'items':json.loads(items),'time':created_at.astimezone(TZ).strftime('%d.%m.%Y %H:%M:%S')})
                return out
    except Exception:
        return []

def add_order(order):
    if DB_ENABLED:
        dt=datetime.fromisoformat(order['created_iso'])
        with db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('INSERT INTO orders(id,name,message,items,created_at) VALUES(%s,%s,%s,%s,%s)', (order['id'],order['name'],order['message'],json.dumps(order['items'],ensure_ascii=False),dt))
            conn.commit()
    else:
        orders=read_json(ORDERS_FILE,[])
        if not isinstance(orders,list): orders=[]
        public={k:v for k,v in order.items() if k!='created_iso'}
        orders.insert(0,public)
        write_json(ORDERS_FILE,orders)

def delete_order(oid):
    if DB_ENABLED:
        with db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('DELETE FROM orders WHERE id=%s',(oid,))
                changed=cur.rowcount
            conn.commit()
        return changed > 0
    orders=read_json(ORDERS_FILE,[])
    new=[o for o in orders if str(o.get('id'))!=oid]
    if len(new)==len(orders): return False
    write_json(ORDERS_FILE,new)
    return True

def clean_menu(menu):
    if not isinstance(menu, list) or not menu: return None
    out=[]
    for i,c in enumerate(menu[:50]):
        if not isinstance(c,dict): continue
        items=c.get('items',[])
        if not isinstance(items,list): items=[]
        out.append({'key':str(c.get('key') or f'cat_{i}')[:80],'title':str(c.get('title','Kategori'))[:100],'icon':str(c.get('icon','🍽️'))[:20],'items':[str(x)[:100] for x in items[:100]]})
    return out or None

def init_files():
    if not MENU_FILE.exists(): write_json(MENU_FILE, DEFAULT_MENU)
    if not ORDERS_FILE.exists(): write_json(ORDERS_FILE, [])
    if not PHOTOS_FILE.exists(): write_json(PHOTOS_FILE, {'photoA':'','photoB':''})

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def send_json(self,obj,code=200):
        raw=json.dumps(obj,ensure_ascii=False).encode('utf-8'); self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store, no-cache, must-revalidate'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def read_body(self):
        n=int(self.headers.get('Content-Length','0')); return json.loads(self.rfile.read(n) or b'{}')
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/menu': return self.send_json(get_menu())
        if path=='/api/orders': return self.send_json(get_orders())
        if path=='/api/photos': return self.send_json(get_photos())
        if path=='/': self.path='/index.html'
        return super().do_GET()
    def do_PUT(self):
        path=urlparse(self.path).path
        try: data=self.read_body()
        except Exception as e: return self.send_json({'error':str(e)},400)
        if path=='/api/menu':
            menu=clean_menu(data.get('menu'))
            if menu is None: return self.send_json({'error':'menu required'},400)
            try: set_menu(menu); return self.send_json(menu)
            except Exception as e: return self.send_json({'error':str(e)},500)
        if path=='/api/photos':
            current=get_photos()
            for key in ('photoA','photoB'):
                if key in data:
                    val=data[key] or ''
                    if not isinstance(val,str) or len(val)>8_000_000: return self.send_json({'error':'invalid photo'},400)
                    current[key]=val
            try: set_photos(current); return self.send_json({'ok':True})
            except Exception as e: return self.send_json({'error':str(e)},500)
        return self.send_json({'error':'not found'},404)
    def do_POST(self):
        if urlparse(self.path).path!='/api/orders': return self.send_json({'error':'not found'},404)
        try:
            data=self.read_body(); name=str(data.get('name','')).strip(); items=data.get('items',[])
            if not name or not isinstance(items,list) or not items: return self.send_json({'error':'name/items required'},400)
            clean=[]
            for x in items[:50]:
                if isinstance(x,dict):
                    try: qty=max(1,int(x.get('qty',1)))
                    except Exception: qty=1
                    clean.append({'name':str(x.get('name','Ürün'))[:100],'qty':qty})
                else: clean.append({'name':str(x)[:100],'qty':1})
            now=datetime.now(TZ)
            order={'id':uuid.uuid4().hex[:10],'name':name[:80],'message':str(data.get('message',''))[:500],'items':clean,'time':now.strftime('%d.%m.%Y %H:%M:%S'),'created_iso':now.isoformat()}
            add_order(order)
            return self.send_json({k:v for k,v in order.items() if k!='created_iso'},201)
        except Exception as e: return self.send_json({'error':str(e)},500)
    def do_DELETE(self):
        path=urlparse(self.path).path
        if not path.startswith('/api/orders/'): return self.send_json({'error':'not found'},404)
        try:
            if delete_order(path.rsplit('/',1)[-1]): return self.send_json({'ok':True})
            return self.send_json({'error':'order not found'},404)
        except Exception as e: return self.send_json({'error':str(e)},500)

if __name__=='__main__':
    init_files(); db_init(); port=int(os.environ.get('PORT','8000')); print(f'Sultan Sofrası: 0.0.0.0:{port} | PostgreSQL={DB_ENABLED}'); ThreadingHTTPServer(('0.0.0.0',port),Handler).serve_forever()
