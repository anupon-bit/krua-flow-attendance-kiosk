(function(){
  const STATUS_MAP={
    APPROVED:'success',SUCCESS:'success',RESOLVED:'success',ACTIVE:'success',READY:'success',FINAL:'success',PAID:'success',ACCEPT:'success',PUBLISHED:'success',VERIFIED:'success',VERIFIED_PHOTO:'success',
    REJECTED:'danger',FAILED:'danger',ERROR:'danger',INACTIVE:'danger',BLOCKED:'danger',VOID:'danger',ACTION_REQUIRED:'danger',CANCELLED:'danger',
    PENDING:'warning',PENDING_MANAGER:'warning',UNREAD:'warning',HOLD:'warning',WAIT:'warning',RESERVED:'warning',
    REVIEW:'info',DRAFT:'info',READ:'neutral',INFO:'info'
  };
  const STATUS_LABEL_TH={
    APPROVED:'อนุมัติแล้ว',SUCCESS:'สำเร็จ',RESOLVED:'ดำเนินการแล้ว',ACTIVE:'ใช้งาน',READY:'พร้อม',FINAL:'ยืนยันยอดแล้ว',PAID:'จ่ายแล้ว',ACCEPT:'ยืนยันแล้ว',PUBLISHED:'ประกาศแล้ว',VERIFIED:'ตรวจสอบแล้ว',VERIFIED_PHOTO:'ตรวจรูปแล้ว',
    REJECTED:'ไม่อนุมัติ',FAILED:'ไม่สำเร็จ',ERROR:'เกิดข้อผิดพลาด',INACTIVE:'ปิดใช้งาน',BLOCKED:'ถูกระงับ',VOID:'ยกเลิก',ACTION_REQUIRED:'ต้องดำเนินการ',CANCELLED:'ยกเลิกแล้ว',
    PENDING:'รอตรวจ',PENDING_MANAGER:'รอผู้จัดการตรวจ',UNREAD:'ยังไม่อ่าน',HOLD:'พักการดำเนินการ',WAIT:'รอดำเนินการ',RESERVED:'จองสิทธิ์แล้ว',
    REVIEW:'รอตรวจ',DRAFT:'ฉบับร่าง',READ:'อ่านแล้ว',INFO:'ข้อมูล'
  };
  function statusClass(v){const s=String(v||'').toUpperCase();return 'kf-'+(STATUS_MAP[s]|| (s.indexOf('PENDING')===0?'warning':'neutral'))}
  function statusLabel(v){const s=String(v||'').toUpperCase();return STATUS_LABEL_TH[s]||String(v||'')}
  function injectStatusStyles(){
    if(document.getElementById('kfStatusStyles'))return;
    const st=document.createElement('style');st.id='kfStatusStyles';st.textContent=`
      .pill,.chip,.status,.kf-status{font-weight:950}
      .pill.kf-success,.chip.kf-success,.status.kf-success,.kf-status.kf-success,.pill.ok,.chip.on,.pill.ready,.status.published{background:#e7f7ee!important;color:#087747!important;border-color:#9bd5b6!important}
      .pill.kf-danger,.chip.kf-danger,.status.kf-danger,.kf-status.kf-danger,.pill.bad,.chip.off,.pill.check{background:#ffe9e9!important;color:#b42318!important;border-color:#efb0aa!important}
      .pill.kf-warning,.chip.kf-warning,.status.kf-warning,.kf-status.kf-warning,.pill.warn,.pill.wait,.status.pending{background:#fff1d8!important;color:#9a6200!important;border-color:#efcf8b!important}
      .pill.kf-info,.chip.kf-info,.status.kf-info,.kf-status.kf-info,.pill.info,.status.draft{background:#e8f1ff!important;color:#2d67b1!important;border-color:#b9cff0!important}
      .pill.kf-neutral,.chip.kf-neutral,.status.kf-neutral,.kf-status.kf-neutral{background:#eef2f6!important;color:#66788c!important;border-color:#d5dde6!important}
      .kf-status-card-success{background:#f1fbf5!important;border-color:#a9e3c3!important;border-left:6px solid #168a55!important}
      .kf-status-card-danger{background:#fff3f3!important;border-color:#f0b9b9!important;border-left:6px solid #c23b3b!important}
      .kf-status-card-warning{background:#fff9e9!important;border-color:#f0d99a!important;border-left:6px solid #d99513!important}
      .kf-status-card-info{background:#f3f7ff!important;border-color:#bfd3f4!important;border-left:6px solid #3c78d8!important}
      .nav button.kf-nav-warning{background:#fff1d8!important;color:#895700!important;border-color:#e8c36e!important}
      .nav button.kf-nav-danger{background:#ffe6e6!important;color:#a52323!important;border-color:#e7a4a4!important}
      .nav button.kf-nav-success{background:#e6f7ed!important;color:#0b7544!important;border-color:#9dd8b9!important}
      .nav button.kf-nav-info{background:#e8f1ff!important;color:#2d67b1!important;border-color:#b9cff0!important}
      .nav button.active.kf-nav-warning{background:#b97700!important;color:#fff!important}
      .nav button.active.kf-nav-danger{background:#b42318!important;color:#fff!important}
      .nav button.active.kf-nav-success{background:#137a4a!important;color:#fff!important}
      .nav button.active.kf-nav-info{background:#2d67b1!important;color:#fff!important}
      #notifBadge:not(:empty){display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;margin-left:4px;font-size:11px;background:#c62828;color:#fff}
    `;document.head.appendChild(st);
  }
  window.KF_STATUS={classFor:statusClass,typeFor:v=>(statusClass(v).replace('kf-','')),labelFor:statusLabel,apply:(el,v)=>{if(!el)return;['kf-success','kf-danger','kf-warning','kf-info','kf-neutral'].forEach(x=>el.classList.remove(x));el.classList.add(statusClass(v))},applyText:(el,v)=>{if(!el)return;el.textContent=statusLabel(v)}};
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
  injectStatusStyles();
  addEventListener('DOMContentLoaded',()=>{ensureBanner();document.querySelectorAll('[data-kf-install]').forEach(x=>{x.onclick=installClick;if(!isIOS()&&!deferred)x.style.display='none'});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})});
})();