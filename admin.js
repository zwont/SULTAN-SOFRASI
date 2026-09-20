const MENU_KEY='sultanAdminMenu';
const DEFAULT_MENU=[
 {key:'yemek',title:'Yemekler',icon:'🍽️',items:['Etli Kuru Fasulye','Bulgur Pilavı','Pirinç Pilavı','Köfte & Patates']},
 {key:'salata',title:'Salatalar',icon:'🥗',items:['Havuç Tarator','Mor Lahana','Mevsim Salata','Çoban Salata']},
 {key:'tatli',title:'Tatlılar',icon:'🍰',items:['Sütlaç','Baklava']},
 {key:'icecek',title:'İçecekler',icon:'🥤',items:['Ayran','Kola Zero']}
];

function togglePanel(panelId,arrowId){
  const panel=document.getElementById(panelId);
  const arrow=document.getElementById(arrowId);
  if(!panel)return;
  const open=panel.classList.toggle('open');
  if(arrow)arrow.textContent=open?'−':'＋';
}

function clone(v){return JSON.parse(JSON.stringify(v))}
function loadMenu(){try{const m=JSON.parse(localStorage.getItem(MENU_KEY));if(Array.isArray(m)&&m.length)return m}catch(e){} return clone(DEFAULT_MENU)}
let menu=loadMenu();
let openAdminCategoryKey=null;
function menuSignature(m){return JSON.stringify(m||[])}
async function loadMenuFromServer(){try{const r=await fetch('/api/menu',{cache:'no-store'});if(!r.ok)throw 0;const m=await r.json();if(Array.isArray(m)&&m.length&&menuSignature(menu)!==menuSignature(m)){menu=m;localStorage.setItem(MENU_KEY,JSON.stringify(menu));renderMenuAdmin()}}catch(e){}}

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function saveMenu(){localStorage.setItem(MENU_KEY,JSON.stringify(menu));renderMenuAdmin();try{await fetch('/api/menu',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({menu})})}catch(e){alert('Menü sunucuya kaydedilemedi.')} }
function toggleCat(i){const el=document.getElementById('admin-cat-'+i);if(!el)return;const was=el.classList.contains('open');document.querySelectorAll('.admin-cat').forEach(x=>x.classList.remove('open'));openAdminCategoryKey=was?null:(menu[i]?.key||String(i));if(!was)el.classList.add('open')}
function editCategory(i){const title=prompt('Kategori adı',menu[i].title);if(title===null||!title.trim())return;const icon=prompt('Kategori ikonu (ör: 🍽️)',menu[i].icon||'');if(icon===null)return;menu[i].title=title.trim();menu[i].icon=icon.trim();saveMenu()}
function deleteCategory(i){if(menu.length<=1)return alert('En az bir kategori kalmalı.');if(!confirm(`"${menu[i].title}" kategorisi ve içindeki ürünler silinsin mi?`))return;menu.splice(i,1);saveMenu()}
function addCategory(){const title=prompt('Yeni kategori adı');if(!title||!title.trim())return;const icon=prompt('Kategori ikonu (ör: 🍕)','🍽️');if(icon===null)return;const key='cat_'+Date.now();menu.push({key,title:title.trim(),icon:icon.trim(),items:[]});saveMenu();setTimeout(()=>{const i=menu.length-1;toggleCat(i)},30)}
function addItem(i){const n=prompt(`${menu[i].title} için yeni içerik`);if(!n||!n.trim())return;menu[i].items.push(n.trim());saveMenu();setTimeout(()=>toggleCat(i),20)}
function editItem(i,j){const n=prompt('İçerik adı',menu[i].items[j]);if(n===null||!n.trim())return;menu[i].items[j]=n.trim();saveMenu();setTimeout(()=>toggleCat(i),20)}
function deleteItem(i,j){if(!confirm(`"${menu[i].items[j]}" kaldırılsın mı?`))return;menu[i].items.splice(j,1);saveMenu();setTimeout(()=>toggleCat(i),20)}
function renderMenuAdmin(){const root=document.getElementById('adminCats');if(!root)return;root.innerHTML=menu.map((c,i)=>`<div class="admin-cat" id="admin-cat-${i}"><div class="cat-head" onclick="toggleCat(${i})"><div><span style="font-size:22px">${esc(c.icon||'🍽️')}</span> <h3 style="display:inline">${esc(c.title)}</h3></div><span class="admin-head-actions"><button type="button" class="small-btn" onclick="event.stopPropagation();editCategory(${i})">Düzenle</button><button type="button" class="small-btn danger" onclick="event.stopPropagation();deleteCategory(${i})">Sil</button><button type="button" class="cat-plus" onclick="event.stopPropagation();addItem(${i})">Ekle</button></span></div><div class="cat-body"><div class="cat-body-inner"><button type="button" class="add-content" onclick="addItem(${i})">Ekle</button>${c.items.length?c.items.map((x,j)=>`<div class="admin-item"><span>• ${esc(x)}</span><span><button type="button" onclick="editItem(${i},${j})">Düzenle</button><button type="button" class="danger" onclick="deleteItem(${i},${j})">Sil</button></span></div>`).join(''):'<div class="empty-admin">Bu kategoride içerik yok.</div>'}</div></div></div>`).join('')+`<button type="button" class="new-category" onclick="addCategory()">＋ Yeni kategori ekle</button>`;if(openAdminCategoryKey){const i=menu.findIndex(c=>(c.key||String(menu.indexOf(c)))===openAdminCategoryKey);if(i>=0){const el=document.getElementById('admin-cat-'+i);if(el)el.classList.add('open')}}}

let orders=[];
let knownOrderIds=null;
let audioCtx=null;
function unlockOrderSound(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){}
}
function playOrderBell(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended'){ audioCtx.resume().then(()=>playOrderBell()).catch(()=>{}); return; }
    const now=audioCtx.currentTime;
    [0,0.16,0.32].forEach((delay,i)=>{
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type='sine'; osc.frequency.value=[880,1047,1319][i];
      gain.gain.setValueAtTime(0.0001,now+delay);
      gain.gain.exponentialRampToValueAtTime(0.16,now+delay+0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.13);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(now+delay); osc.stop(now+delay+0.14);
    });
  }catch(e){}
}
document.addEventListener('pointerdown',unlockOrderSound,{once:false});
function demoOrders(){
  const all=menu.flatMap(c=>c.items.map(name=>({name,cat:c.title})));
  const pick=()=>all[Math.floor(Math.random()*all.length)]||{name:'Etli Kuru Fasulye'};
  const names=['Ahmet Yılmaz','Mehmet Kaya','Zeynep Demir','Can Şahin'];
  return names.map((name,i)=>{
    const a=pick(), b=pick();
    return {name,items:[{name:a.name,qty:1+(i%2)},{name:b.name,qty:1+(i%3===0?1:0)}],message:['Az pilav olsun','Kapıya bırakabilir misiniz?','Ayran da ekleyelim',''][i],time:`20:0${i}:2${i}`};
  });
}
function orderKey(o,i){return 'seen_'+[o.name||'',o.time||'',i].join('|')}
function isSeen(o,i){return localStorage.getItem(orderKey(o,i))==='1'}
function markSeen(i){const o=orders[i];if(!o)return;localStorage.setItem(orderKey(o,i),'1');renderOrders()}
async function deleteOrder(i){const o=orders[i];if(!o)return;if(!confirm('Bu sipariş silinsin mi?'))return;try{if(o.id){const r=await fetch('/api/orders/'+encodeURIComponent(o.id),{method:'DELETE'});if(!r.ok)throw 0;}}catch(e){}orders.splice(i,1);renderOrders()}
function renderOrders(){
  const el=document.getElementById('orders');
  if(!el)return;
  el.innerHTML=orders.length?orders.map((o,i)=>{
    const seen=isSeen(o,i);
    return `<div class="order ${seen?'seen':''}"><div class="order-top"><b>👤 ${esc(o.name)}</b><div class="order-head-right"><span>🕒 ${esc(o.time||'')}</span><button type="button" class="seen-btn ${seen?'done':''}" onclick="markSeen(${i})">${seen?'✓ Görüldü':'✓ Gördüm'}</button><button type="button" class="delete-order-btn" onclick="deleteOrder(${i})">Sil</button></div></div><div class="order-items">${(o.items||[]).map(x=>`<div class="order-line"><span>${esc(typeof x==='object'?x.name:x)}</span><strong>× ${typeof x==='object'?(Number(x.qty)||1):1}</strong></div>`).join('')}</div>${o.message?`<div class="order-message">💬 ${esc(o.message)}</div>`:''}</div>`;
  }).join(''):'<p>Henüz sipariş yok.</p>';
}
async function loadOrders(){
  try{
    const r=await fetch('/api/orders');
    if(!r.ok)throw 0;
    const fresh=await r.json();
    const freshIds=new Set(fresh.map(o=>String(o.id||'' )).filter(Boolean));
    if(knownOrderIds!==null){
      let newCount=0;
      freshIds.forEach(id=>{if(!knownOrderIds.has(id))newCount++;});
      if(newCount>0) playOrderBell();
    }
    knownOrderIds=freshIds;
    orders=fresh;
    renderOrders();
  }catch(e){
    orders=demoOrders();
    renderOrders();
  }
}
function readPhoto(file){return new Promise(resolve=>{if(!file)return resolve(null);const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)})}
async function savePhotos(){const a=await readPhoto(document.getElementById('photo1')?.files[0]);const b=await readPhoto(document.getElementById('photo2')?.files[0]);try{await fetch('/api/photos',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({photoA:a||'',photoB:b||''})});if(a)localStorage.customPhotoA=a;if(b)localStorage.customPhotoB=b;alert('Fotoğraflar güncellendi.')}catch(e){alert('Fotoğraflar sunucuya kaydedilemedi.')}}
renderMenuAdmin();
loadOrders();
loadMenuFromServer();
setInterval(loadOrders,2000);
setInterval(loadMenuFromServer,3000);
window.addEventListener('storage',e=>{if(e.key===MENU_KEY){menu=loadMenu();renderMenuAdmin()}});
