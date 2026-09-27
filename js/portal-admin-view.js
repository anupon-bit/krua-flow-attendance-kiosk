(function () {
  'use strict';

  const TOKEN_KEY = 'kruaFlowPortalTokenV7';
  const EXPIRY_KEY = 'kruaFlowPortalTokenV7Exp';
  const EMPLOYEE_ID_KEY = 'kfPortalSessionEmployeeV73';
  const EMPLOYEE_PIN_KEY = 'kfPortalSessionPinV73';
  const VIEW_TOKEN_KEY = 'kfAdminPortalViewTokenV1';
  const VIEW_BOOT_KEY = 'kfAdminPortalViewBootV1';
  const isEmbedded = window.parent !== window;
  let adminHost = isEmbedded ? window.parent : window.opener;
  let hasFullscreenView = false;
  try { hasFullscreenView = !isEmbedded && Boolean(sessionStorage.getItem(VIEW_TOKEN_KEY)); } catch (error) {}
  if (!adminHost && !hasFullscreenView) return;

  const originalLocalGet = localStorage.getItem.bind(localStorage);
  const originalLocalRemove = localStorage.removeItem.bind(localStorage);
  const originalSessionGet = sessionStorage.getItem.bind(sessionStorage);
  const originalSessionSet = sessionStorage.setItem.bind(sessionStorage);
  const originalSessionRemove = sessionStorage.removeItem.bind(sessionStorage);
  const isViewBoot = originalSessionGet(VIEW_BOOT_KEY) === '1';

  if (isViewBoot) originalSessionRemove(VIEW_BOOT_KEY);
  else if (adminHost) originalSessionRemove(VIEW_TOKEN_KEY);

  const viewToken = originalSessionGet(VIEW_TOKEN_KEY) || '';
  let adminToken = '';
  let client = null;

  localStorage.getItem = function (key) {
    if (key === TOKEN_KEY) return viewToken;
    if (key === EXPIRY_KEY) return viewToken ? String(Date.now() + 21600000) : null;
    return originalLocalGet(key);
  };
  localStorage.removeItem = function (key) {
    if (key === TOKEN_KEY || key === EXPIRY_KEY) {
      originalSessionRemove(VIEW_TOKEN_KEY);
      return;
    }
    originalLocalRemove(key);
  };
  sessionStorage.getItem = function (key) {
    if (key === EMPLOYEE_ID_KEY || key === EMPLOYEE_PIN_KEY) return null;
    return originalSessionGet(key);
  };
  sessionStorage.setItem = function (key, value) {
    if (key === EMPLOYEE_ID_KEY || key === EMPLOYEE_PIN_KEY) return;
    originalSessionSet(key, value);
  };
  sessionStorage.removeItem = function (key) {
    if (key === EMPLOYEE_ID_KEY || key === EMPLOYEE_PIN_KEY) return;
    originalSessionRemove(key);
  };

  const style = document.createElement('style');
  style.textContent = [
    '#app.adminReadOnly #activityLink',
    '#app.adminReadOnly #managerBtn',
    '#app.adminReadOnly #ackBtn',
    '#app.adminReadOnly #v-attendance > .card:nth-child(2)',
    '#app.adminReadOnly #v-leave > .card:first-child',
    '#app.adminReadOnly #v-profile > .card:nth-child(2)',
    '#app.adminReadOnly .payAccept',
    '#app.adminReadOnly .payDispute { display:none!important; }'
  ].join(',');
  document.head.appendChild(style);

  function apiClient() {
    const config = window.KRUA_FLOW_CONFIG || {};
    const staging = new URLSearchParams(location.search).get('staging') === '1';
    const url = staging ? (config.STAGING_API_URL || '') : (config.API_URL || '');
    return new window.KruaFlowApi.Client({ url: url });
  }

  function notifyAdminExpired() {
    try {
      adminHost.postMessage({ type: 'KruaFlowAdminSessionExpired' }, location.origin);
    } catch (error) {}
  }

  function hideEmployeeLogin() {
    const employeeId = document.getElementById('employeeId');
    const pin = document.getElementById('pin');
    const loginButton = document.getElementById('loginBtn');
    const pinHint = document.querySelector('#login .muted');
    if (employeeId && employeeId.parentElement) employeeId.parentElement.classList.add('hidden');
    if (pin && pin.parentElement) pin.parentElement.classList.add('hidden');
    if (loginButton) loginButton.classList.add('hidden');
    if (pinHint) pinHint.classList.add('hidden');
  }

  function showAdminPicker(rows) {
    const login = document.getElementById('login');
    if (!login) return;
    hideEmployeeLogin();
    const subtitle = login.querySelector('.sub');
    if (subtitle) subtitle.textContent = 'เลือกพนักงานเพื่อดูข้อมูลแบบอ่านอย่างเดียว';

    let picker = document.getElementById('adminPortalPicker');
    if (!picker) {
      picker = document.createElement('div');
      picker.id = 'adminPortalPicker';
      const field = document.createElement('div');
      field.className = 'field';
      const label = document.createElement('label');
      label.htmlFor = 'adminPortalEmployee';
      label.textContent = 'พนักงาน';
      const select = document.createElement('select');
      select.id = 'adminPortalEmployee';
      select.className = 'select';
      const button = document.createElement('button');
      button.id = 'adminPortalOpen';
      button.className = 'btn primary';
      button.type = 'button';
      button.style.cssText = 'width:100%;margin-top:14px';
      button.textContent = 'เปิดพื้นที่พนักงาน';
      field.append(label, select);
      picker.append(field, button);
      login.insertBefore(picker, document.getElementById('loginBtn'));
      button.addEventListener('click', openSelectedEmployee);
    }

    const select = document.getElementById('adminPortalEmployee');
    select.replaceChildren();
    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = rows.length ? 'เลือกพนักงาน' : 'ไม่พบพนักงานที่ใช้งาน';
    select.appendChild(prompt);
    rows.forEach(function (row) {
      const option = document.createElement('option');
      option.value = row.employeeId;
      option.textContent = [row.nickname || row.name, row.employeeId, row.branchCode].filter(Boolean).join(' • ');
      select.appendChild(option);
    });
    document.getElementById('adminPortalOpen').disabled = !rows.length;
    const error = document.getElementById('loginErr');
    if (error) {
      error.textContent = '';
      error.classList.remove('show');
    }
  }

  async function loadEmployeeChoices() {
    try {
      client = apiClient();
      const result = await client.call({ op: 'adminGetEmployeePortalChoices', adminToken: adminToken });
      showAdminPicker(result.rows || []);
    } catch (error) {
      const box = document.getElementById('loginErr');
      if (box) {
        box.textContent = error.message || String(error);
        box.classList.add('show');
      }
      if (/สิทธิ์ Admin|Admin.*หมดอายุ|Session หมดอายุ/i.test(error.message || '')) notifyAdminExpired();
    }
  }

  async function openSelectedEmployee() {
    const employeeId = document.getElementById('adminPortalEmployee').value;
    const button = document.getElementById('adminPortalOpen');
    const error = document.getElementById('loginErr');
    if (!employeeId) {
      if (error) {
        error.textContent = 'กรุณาเลือกพนักงาน';
        error.classList.add('show');
      }
      return;
    }
    try {
      button.disabled = true;
      button.textContent = 'กำลังเปิดข้อมูล...';
      const result = await client.call({
        op: 'adminCreateEmployeePortalView',
        adminToken: adminToken,
        employeeId: employeeId
      });
      originalSessionSet(VIEW_TOKEN_KEY, result.token);
      originalSessionSet(VIEW_BOOT_KEY, '1');
      if (!isEmbedded && window.opener) {
        try { window.opener = null; } catch (error) {}
        adminHost = null;
      }
      location.reload();
    } catch (requestError) {
      if (error) {
        error.textContent = requestError.message || String(requestError);
        error.classList.add('show');
      }
      if (/สิทธิ์ Admin|Admin.*หมดอายุ|Session หมดอายุ/i.test(requestError.message || '')) notifyAdminExpired();
    } finally {
      button.disabled = false;
      button.textContent = 'เปิดพื้นที่พนักงาน';
    }
  }

  function applyReadOnlyUi() {
    if (!viewToken) return;
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.add('adminReadOnly');
    hideEmployeeLogin();
    const logout = document.getElementById('logoutBtn');
    if (logout) logout.textContent = 'เลือกพนักงานอื่น';
    const who = document.getElementById('who');
    const header = app.querySelector('.top');
    if (!who || !header || !who.textContent.trim() || document.getElementById('adminViewNotice')) return;
    const notice = document.createElement('div');
    notice.id = 'adminViewNotice';
    notice.className = 'notice';
    notice.textContent = 'มุมมองผู้ดูแล • อ่านอย่างเดียว';
    header.insertAdjacentElement('afterend', notice);
  }

  function onAdminMessage(event) {
    if (event.origin !== location.origin || event.source !== adminHost) return;
    const message = event.data || {};
    if (message.type !== 'KruaFlowAdminSession' || !message.token) return;
    adminToken = String(message.token);
    if (viewToken) {
      applyReadOnlyUi();
      return;
    }
    loadEmployeeChoices();
  }

  window.addEventListener('message', onAdminMessage);
  document.addEventListener('click', function (event) {
    if (viewToken && event.target.closest('#notifList .notifCard')) event.stopImmediatePropagation();
    if (!viewToken || !event.target.closest('#logoutBtn')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const portalClient = client || apiClient();
    portalClient.call({ op: 'portalLogout', portalToken: viewToken }).finally(function () {
      originalSessionRemove(VIEW_TOKEN_KEY);
      originalSessionRemove(VIEW_BOOT_KEY);
      location.reload();
    });
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    if (!viewToken) {
      hideEmployeeLogin();
      const subtitle = document.querySelector('#login .sub');
      if (subtitle) subtitle.textContent = 'กำลังตรวจสอบสิทธิ์ผู้ดูแล...';
      if (!isEmbedded && adminHost) {
        try { adminHost.postMessage({ type: 'KruaFlowAdminSessionRequest' }, location.origin); } catch (error) {}
      }
      return;
    }
    const app = document.getElementById('app');
    if (app) new MutationObserver(applyReadOnlyUi).observe(app, {
      attributes: true,
      subtree: true,
      childList: true,
      characterData: true
    });
    applyReadOnlyUi();
  });
})();