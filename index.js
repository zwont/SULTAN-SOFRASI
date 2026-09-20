const fallbackA='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="#f3d6a0"/><circle cx="300" cy="190" r="125" fill="#fff"/><ellipse cx="300" cy="190" rx="100" ry="70" fill="#b85b35"/><circle cx="260" cy="170" r="18" fill="#6d8e3b"/><circle cx="325" cy="210" r="20" fill="#e8b84b"/><circle cx="350" cy="160" r="15" fill="#6d8e3b"/><text x="300" y="55" text-anchor="middle" font-family="Arial" font-size="34" font-weight="bold" fill="#6b351f">Günün Yemeği</text></svg>');
const fallbackB='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="#dceccf"/><circle cx="300" cy="195" r="125" fill="#fff"/><circle cx="300" cy="195" r="85" fill="#6da04b"/><circle cx="260" cy="165" r="20" fill="#e64b3c"/><circle cx="335" cy="180" r="22" fill="#f2d34f"/><circle cx="310" cy="225" r="20" fill="#d94c3d"/><text x="300" y="55" text-anchor="middle" font-family="Arial" font-size="34" font-weight="bold" fill="#35652c">Taze Salata</text></svg>');
const MENU_KEY='sultanAdminMenu';
const DEFAULT_MENU=[
 {key:'yemek',title:'Yemekler',icon:'🍽️',items:['Etli Kuru Fasulye','Bulgur Pilavı','Pirinç Pilavı','Köfte & Patates']},
 {key:'salata',title:'Salatalar',icon:'🥗',items:['Havuç Tarator','Mor Lahana','Mevsim Salata','Çoban Salata']},
 {key:'tatli',title:'Tatlılar',icon:'🍰',items:['Sütlaç','Baklava']},
 {key:'icecek',title:'İçecekler',icon:'🥤',items:['Ayran','Kola Zero']}
];
function escMenu(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;',"\"":'&quot;'}[c]))}
function getCustomerMenu(){try{const m=JSON.parse(localStorage.getItem(MENU_KEY));if(Array.isArray(m)&&m.length)return m}catch(e){}return DEFAULT_MENU}
let menuUpdatePending=false;
async function loadMenuFromServer(){try{const r=await fetch('/api/menu',{cache:'no-store'});if(!r.ok)throw 0;const m=await r.json();if(!Array.isArray(m)||!m.length)return;const next=JSON.stringify(m);const old=localStorage.getItem(MENU_KEY);if(old===next)return;localStorage.setItem(MENU_KEY,next);const open=document.querySelector('.category.open');if(open){menuUpdatePending=true;return}renderCustomerMenu()}catch(e){}}
const customerItemImages={
 'Sütlaç':'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 fill=%22%23261b1d%22/%3E%3Cellipse cx=%2260%22 cy=%2270%22 rx=%2239%22 ry=%2225%22 fill=%22%23e9ddd0%22/%3E%3Cpath d=%22M22 67h76v13c0 15-17 25-38 25S22 95 22 80z%22 fill=%22%23d8c7b5%22/%3E%3Cellipse cx=%2260%22 cy=%2267%22 rx=%2238%22 ry=%2215%22 fill=%22%23f4eadf%22/%3E%3C/svg%3E',
 'Baklava':'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 fill=%22%23271d16%22/%3E%3Cpath d=%22M25 45l35-18 35 18-35 18zM25 63l35-18 35 18-35 18zM25 81l35-18 35 18-35 18z%22 fill=%22%23b97a34%22/%3E%3Cpath d=%22M32 44l28-13 28 13-28 14zM32 62l28-13 28 13-28 14zM32 80l28-13 28 13-28 14z%22 fill=%22%23e0ad55%22/%3E%3C/svg%3E',
 'Ayran':'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 fill=%22%231a2028%22/%3E%3Cpath d=%22M42 25h36l-4 70H46z%22 fill=%22%23d9e7ee%22/%3E%3Cpath d=%22M45 40h30v45H45z%22 fill=%22%23a83d32%22/%3E%3Cpath d=%22M70 25l12-10%22 stroke=%22%23ddd%22 stroke-width=%225%22/%3E%3C/svg%3E',
 'Kola Zero':'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 fill=%22%231a2028%22/%3E%3Cpath d=%22M42 25h36l-4 70H46z%22 fill=%22%23d9e7ee%22/%3E%3Cpath d=%22M45 40h30v45H45z%22 fill=%22%23a83d32%22/%3E%3Cpath d=%22M70 25l12-10%22 stroke=%22%23ddd%22 stroke-width=%225%22/%3E%3C/svg%3E'
};
function renderCustomerMenu(){
  const root=document.getElementById('categories'); if(!root)return;
  const openCategory=root.querySelector('.category.open');
  const openKey=openCategory?.dataset.menuKey||null;
  const menu=getCustomerMenu();
  const validNames=new Set(menu.flatMap(c=>Array.isArray(c.items)?c.items:[]));
  selected=selected.filter(x=>validNames.has(x.name));
  root.innerHTML=menu.map((c,i)=>{
    const items=Array.isArray(c.items)?c.items:[];
    const cls=escMenu(c.key||('cat'+i));
    return `<section class="category ${cls}" data-menu-key="${cls}"><button class="cat-btn" type="button" onclick="toggleCat(this.parentElement)"><span class="cat-label"><span class="cat-icon">${escMenu(c.icon||'🍽️')}</span>${escMenu(c.title)}</span><span class="plus">＋</span></button><div class="options">${items.map(name=>{const img=customerItemImages[name];return `<label class="option"><span class="left">${img?`<img class="food-thumb" alt="${escMenu(name)}" src="${img}">`:''}<span class="name">${escMenu(name)}</span></span><span class="left"><span class="qty" data-name="${escMenu(name)}"><button type="button" class="qty-btn" onclick="changeQty(this,-1)">−</button><span class="qty-num">${selected.find(x=>x.name===name)?.qty||0}</span><button type="button" class="qty-btn" onclick="changeQty(this,1)">＋</button></span></span></label>`}).join('')}</div></section>`;
  }).join('');
  if(openKey){
    const keepOpen=root.querySelector(`.category[data-menu-key="${CSS.escape(openKey)}"]`);
    if(keepOpen){
      keepOpen.classList.add('open');
      const plus=keepOpen.querySelector('.plus');
      if(plus)plus.textContent='−';
    }
  }
  update();
}
let selected=[]; let orders=[]; try{orders=JSON.parse(localStorage.sultanOrders||'[]')}catch(e){orders=[]}

function openPhotoFullscreen(card){
  const img = card && card.querySelector ? card.querySelector("img") : null;
  if(!img) return;
  const overlay=document.getElementById("photoFullscreen");
  const big=document.getElementById("fullscreenPhoto");
  big.src=img.currentSrc || img.src;
  overlay.classList.add("show");
  document.body.classList.add("photo-open");
}
function handlePhotoClick(btn,e){}
function closePhotoFullscreen(e){
  if(e && e.target && e.target.id === "fullscreenPhoto") return;
  const overlay=document.getElementById("photoFullscreen");
  const big=document.getElementById("fullscreenPhoto");
  overlay.classList.remove("show");
  document.body.classList.remove("photo-open");
  setTimeout(()=>{if(!overlay.classList.contains("show")) big.removeAttribute("src")},180);
}



// Fotoğraflar: uzun basınca gerçek büyüteç, kısa dokunuşta tam ekran.
(function initPhotoMagnifier(){
  let pressTimer=null, active=false, moved=false, startX=0, startY=0, currentCard=null, lens=null;
  const HOLD_MS=450, MOVE_TOLERANCE=8, ZOOM=2.25;

  function ensureLens(){
    if(lens) return lens;
    lens=document.createElement('div');
    lens.className='touch-lens';
    document.body.appendChild(lens);
    return lens;
  }
  function setLens(card,x,y){
    const img=card?.querySelector('img'); if(!img) return;
    const l=ensureLens();
    const r=img.getBoundingClientRect();
    const src=img.currentSrc||img.src;
    l.style.backgroundImage=`url("${src}")`;
    l.style.backgroundSize=`${r.width*ZOOM}px ${r.height*ZOOM}px`;
    const ix=Math.max(0,Math.min(r.width,(x-r.left)));
    const iy=Math.max(0,Math.min(r.height,(y-r.top)));
    l.style.left=`${x-110}px`;
    l.style.top=`${y-110}px`;
    l.style.backgroundPosition=`${110-ix*ZOOM}px ${110-iy*ZOOM}px`;
  }
  function hideLens(){
    if(lens) lens.classList.remove('show');
    active=false; currentCard=null;
  }
  function cancelTimer(){ if(pressTimer){clearTimeout(pressTimer);pressTimer=null;} }

  document.addEventListener('pointerdown',e=>{
    const card=e.target.closest('.photo-card');
    if(!card) return;
    const img=card.querySelector('img');
    if(!img) return;
    startX=e.clientX; startY=e.clientY; moved=false; currentCard=card;
    img.draggable=false;
    cancelTimer();
    pressTimer=setTimeout(()=>{
      if(moved || !currentCard) return;
      active=true;
      const l=ensureLens(); l.classList.add('show');
      setLens(currentCard,e.clientX,e.clientY);
    },HOLD_MS);
  },{passive:false});

  document.addEventListener('pointermove',e=>{
    if(!currentCard) return;
    const dx=e.clientX-startX, dy=e.clientY-startY;
    if(Math.hypot(dx,dy)>MOVE_TOLERANCE){
      moved=true;
      if(!active) cancelTimer();
    }
    if(active){
      e.preventDefault();
      setLens(currentCard,e.clientX,e.clientY);
    }
  },{passive:false});

  document.addEventListener('pointerup',e=>{
    const card=currentCard;
    const wasActive=active;
    cancelTimer();
    if(wasActive){ e.preventDefault(); hideLens(); return; }
    currentCard=null;
    if(card && !moved){
      // Kısa dokunuş: resmi aç. Native image drag yok.
      e.preventDefault();
      openPhotoFullscreen(card);
    }
  },{passive:false});

  document.addEventListener('pointercancel',()=>{cancelTimer();hideLens();moved=false;});
  document.addEventListener('dragstart',e=>{ if(e.target.closest('.photo-card')) e.preventDefault(); });
  document.addEventListener('contextmenu',e=>{ if(e.target.closest('.photo-card')) e.preventDefault(); });
  document.addEventListener('selectstart',e=>{ if(e.target.closest('.photo-card')) e.preventDefault(); });

  // Butonun inline click'i/klavye aktivasyonu da tam ekran açabilsin.
  document.querySelectorAll('.photo-card').forEach(card=>card.addEventListener('click',e=>e.preventDefault()));
})();

function openPhotoCategory(type){const el=document.querySelector('.category.'+type);if(!el)return;document.querySelectorAll('.category').forEach(x=>{x.classList.remove('open');const p=x.querySelector('.plus');if(p)p.textContent='＋'});el.classList.add('open');const p=el.querySelector('.plus');if(p)p.textContent='−';setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),40)}
function toggleCat(el){
  if(!el)return;
  const was=el.classList.contains('open');
  document.querySelectorAll('#categories .category').forEach(x=>{x.classList.remove('open');const p=x.querySelector('.plus');if(p)p.textContent='＋'});
  if(!was){el.classList.add('open');const p=el.querySelector('.plus');if(p)p.textContent='−';}
  if(was && menuUpdatePending){menuUpdatePending=false;renderCustomerMenu();}
}
function changeQty(btn, delta){
  const qty=btn.closest('.qty');
  if(!qty)return;
  const name=qty.dataset.name;
  const price=0;
  const current=Number(qty.querySelector('.qty-num').textContent)||0;
  const next=Math.max(0,current+delta);
  qty.querySelector('.qty-num').textContent=next;
  const item=selected.find(x=>x.name===name);
  if(item){
    if(next===0) selected=selected.filter(x=>x.name!==name);
    else item.qty=next;
  }else if(next>0){
    selected.push({name,qty:next});
  }
  update();
}
function pick(name,price,on){
  const existing=selected.find(x=>x.name===name);
  if(on && !existing) selected.push({name,qty:1});
  if(!on) selected=selected.filter(x=>x.name!==name);
  update();
}
function update(){
  const totalCount=selected.reduce((a,x)=>a+(x.qty||1),0);
  const selectedEl=document.getElementById('selected');
  selectedEl.innerHTML=selected.length?selected.map(x=>`${x.name} × ${x.qty||1}`).join('<br>'):'Henüz seçim yapmadın.';
  const cart=document.querySelector('.cart');
  if(cart)cart.textContent=`🛒 ${totalCount}`;
}
function sendOrder(){const name=document.getElementById('customerName').value.trim();if(!selected.length)return alert('Önce ürün seç.');if(!name)return alert('Adını yaz.');fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message:document.getElementById('orderMessage')?.value.trim()||'',items:selected.map(x=>({name:x.name,qty:x.qty||1}))})}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(()=>{alert('Sipariş iletildi');selected=[];document.querySelectorAll('.qty-num').forEach(x=>x.textContent='0');if(document.getElementById('orderMessage'))document.getElementById('orderMessage').value='';update()}).catch(()=>alert('Sipariş gönderilemedi. Sunucu bağlantısını kontrol et.'))}
function readPhoto(file){return new Promise(resolve=>{if(!file)return resolve(null);const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file)})}
async function savePhotos(){const a=await readPhoto(document.getElementById('photo1').files[0]);const b=await readPhoto(document.getElementById('photo2').files[0]);if(a)localStorage.customPhotoA=a;if(b)localStorage.customPhotoB=b;loadPhotos();alert('Fotoğraflar güncellendi.')}
async function loadPhotos(){try{const r=await fetch('/api/photos',{cache:'no-store'});if(r.ok){const p=await r.json();if(p.photoA)localStorage.customPhotoA=p.photoA;if(p.photoB)localStorage.customPhotoB=p.photoB}}catch(e){}const a=localStorage.customPhotoA,b=localStorage.customPhotoB;if(a&&document.getElementById('photoA'))document.getElementById('photoA').src=a;if(b&&document.getElementById('photoB'))document.getElementById('photoB').src=b}
function showAdmin(){document.getElementById('shop').style.display='none';document.getElementById('admin').style.display='block';document.getElementById('orders').innerHTML=orders.length?orders.map(o=>`<div class="order"><b>${o.name}</b><div>${o.items.join('<br>')}</div><b>${o.total} TL</b><small><br>${o.time}</small></div>`).join(''):'<p>Henüz sipariş yok.</p>'}
function showShop(){document.getElementById('shop').style.display='block';document.getElementById('admin').style.display='none'}
renderCustomerMenu(); loadMenuFromServer(); loadPhotos(); update(); setInterval(loadMenuFromServer,3000); setInterval(loadPhotos,5000);
window.addEventListener('storage',e=>{if(e.key===MENU_KEY){renderCustomerMenu()}});

(function(){
  function open(card){ openPhotoFullscreen(card); }
  document.addEventListener("click",function(e){
    const card=e.target.closest(".photo-card");
    if(!card) return;
    if(e.target.closest("button") && !e.target.closest(".photo-card")) return;
    e.preventDefault();
    open(card);
  }, true);
  document.addEventListener("keydown",function(e){
    if(e.key === "Escape") closePhotoFullscreen(e);
  });
  document.addEventListener("dblclick",function(e){
    const card=e.target.closest(".photo-card");
    if(card){ e.preventDefault(); open(card); }
  });
})();
