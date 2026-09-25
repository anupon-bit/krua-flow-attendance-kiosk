(function(){
  function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
  let deferred=null;
  function ensureBanner(){
    if(document.getElementById('kfNetBanner'))return;
    const b=document.createElement('div');b.id='kfNetBanner';b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:9999;padding:8px 14px;border-radius:999px;font:800 12px system-ui;background:#7d1d1d;color:white;box-shadow:0 5px 18px #0003;display:none';document.body.appendChild(b);
    const render=()=>{if(!navigator.onLine){b.textContent='ออฟไลน์ — ข้อมูลใหม่อาจยังไม่บันทึก';b.style.display='block'}else if(window.KRUA_FLOW_MOCK&&window.KRUA_FLOW_MOCK.enabled){b.textContent='TEST MODE — ข้อมูลจำลอง ไม่กระทบข้อมูลจริง';b.style.background='#6b3cc9';b.style.display='block'}else b.style.display='none'};
    addEventListener('online',render);addEventListener('offline',render);render();
  }
  function installClick(e){
    e.preventDefault();
    if(deferred){deferred.prompt();deferred.userChoice.finally(()=>{deferred=null;document.querySelectorAll('[data-kf-install]').forEach(x=>x.style.display='none')});return}
    alert(isIOS()?'iPhone/iPad: กดปุ่ม Share แล้วเลือก “Add to Home Screen / เพิ่มไปยังหน้าจอโฮม”':'หาก Browser รองรับ ให้เปิดเมนู Browser แล้วเลือก “ติดตั้งแอป” หรือ “Add to Home screen”');
  }
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;document.querySelectorAll('[data-kf-install]').forEach(x=>x.style.display='inline-flex')});
  addEventListener('DOMContentLoaded',()=>{ensureBanner();document.querySelectorAll('[data-kf-install]').forEach(x=>{x.onclick=installClick;if(!isIOS()&&!deferred)x.style.display='none'});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})});
})();