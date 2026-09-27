'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/admin-session.js'), 'utf8');
const uxSource = fs.readFileSync(path.join(root, 'ux.js'), 'utf8');
const workspace = fs.readFileSync(path.join(root, 'workspace.html'), 'utf8');
const workforce = fs.readFileSync(path.join(root, 'workforce.html'), 'utf8');
const manager = fs.readFileSync(path.join(root, 'manager.html'), 'utf8');
const portal = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, String(value))
  };
}

let now = 1_000_000;
const localStorage = storage();
const sessionStorage = storage();
const windowStub = {};
vm.runInNewContext(source, {
  Date: { now: () => now },
  localStorage,
  sessionStorage,
  window: windowStub
}, { filename: 'js/admin-session.js' });

const session = windowStub.KruaFlowAdminSession;
assert(session, 'shared admin session helper must be exported');
session.save('staging-token', 14400);
assert.strictEqual(session.get(), 'staging-token', 'login token must be available in the current tab');
assert.strictEqual(Number(localStorage.getItem(session.expiryKey)), now + 14400 * 1000, 'frontend expiry must match backend expiresIn');

sessionStorage.removeItem(session.sessionKey);
assert.strictEqual(session.get(), 'staging-token', 'refresh must restore a non-expired token');
now += 1000;
assert.strictEqual(session.touch(), true, 'successful authenticated activity must extend the client expiry');
assert.strictEqual(Number(localStorage.getItem(session.expiryKey)), now + session.defaultTtlSeconds * 1000);

now += session.defaultTtlSeconds * 1000 + 1;
assert.strictEqual(session.get(), '', 'expired token must fail closed');
assert.strictEqual(localStorage.getItem(session.persistentKey), null, 'expired persistent token must be removed');
assert.strictEqual(session.isAuthError(new Error('สิทธิ์ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่')), true);
assert.strictEqual(session.isAuthError(new Error('PIN Admin ไม่ถูกต้อง')), false, 'wrong PIN is not an expired session');

assert(workspace.includes("op: 'adminLogin'"), 'UAT page must support direct admin PIN login without loading an unused summary');
assert(workspace.includes('saveToken(value, result.expiresIn)'), 'login must store the backend token lifetime');
assert(workspace.includes("type === 'KruaFlowAdminSessionExpired'"), 'workspace must return to login when the child session expires');
assert(workspace.includes("type === 'KruaFlowAdminSessionActive'"), 'workspace must extend active sessions');
assert(workforce.includes("type: 'KruaFlowAdminSessionExpired'"), 'workforce must notify the workspace about an expired session');
assert(workforce.includes("type: 'KruaFlowAdminSessionActive'"), 'workforce must notify the workspace about authenticated activity');

[workspace, workforce].forEach((html, index) => {
  assert(html.includes('./js/admin-session.js'), `page ${index + 1} must use the shared session helper`);
  assert(html.includes("isStaging ? 'STAGING_API_URL' : 'API_URL'"), `page ${index + 1} must select an environment-specific endpoint`);
  assert(html.includes('new KruaFlowApi.Client({ url: configuredApiUrl'), `page ${index + 1} must pass the selected endpoint explicitly`);
});

const topbar = workspace.match(/<header class="topbar">([\s\S]*?)<\/header>/);
assert(topbar, 'workspace top bar is missing');
assert.strictEqual((topbar[1].match(/data-language=/g) || []).length, 2, 'top bar must contain one TH/EN language switcher');
assert(topbar[1].includes('environmentBadge'), 'top bar must contain the environment badge');
assert(workspace.includes("isStaging ? 'environment.staging' : 'environment.production'"), 'environment badge must distinguish STAGING and PRODUCTION');
assert(topbar[1].includes('workspace.openFull'), 'top bar must contain full-screen control');
assert(topbar[1].includes('workspace.logout'), 'top bar must contain logout control');
assert(!workforce.includes('class="headActions"'), 'embedded workforce content must not render a second control bar');
assert(workforce.includes('<h1 id="title">') && workforce.includes('<p class="subtitle"'), 'content must begin with page title and description');

assert(workspace.includes('function loadGroupState()') && workspace.includes('function openView('), 'existing sidebar behavior must remain intact');
assert(workspace.includes("frameUrl.pathname.endsWith('/portal.html')"), 'fullscreen Portal must use the Admin bridge');
assert(workspace.includes("popup.sessionStorage.setItem(PORTAL_VIEW_TOKEN, viewToken)"), 'fullscreen Admin view must carry only its read-only token');
assert(manager.includes("id=\"employeeBtn\"") && portal.includes("id=\"managerBtn\""), 'Manager and Portal navigation controls must remain available');
assert(manager.includes('./ux.js?v=env-nav-1') && portal.includes('./ux.js?v=env-nav-1'), 'Manager and Portal must refresh the shared navigation helper');

function loadUxPage(href, fields) {
  const documentEvents = {}, windowEvents = {}, elements = fields || {};
  const address = new URL(href);
  const location = { href:address.href, search:address.search, pathname:address.pathname, assigned:'', assign(value) { this.assigned = value; } };
  const document = {
    head:{ appendChild(){} }, body:{ appendChild(){} },
    addEventListener(type, handler) { documentEvents[type] = handler; },
    getElementById(id) { return elements[id] || null; },
    createElement() { return {}; },
    querySelectorAll() { return []; }
  };
  const window = {};
  vm.runInNewContext(uxSource, {
    window, document, location, URL, URLSearchParams,
    navigator:{ userAgent:'test', onLine:true },
    addEventListener(type, handler) { windowEvents[type] = handler; },
    alert(){}
  }, { filename:'ux.js' });
  return { window, documentEvents, windowEvents, location };
}

let refreshCount = 0;
const stagingPage = loadUxPage('https://example.test/manager.html?staging=1', {
  branch:{ value:'KORAT' }, department:{ value:'OFFICE' }, refresh:{ click(){ refreshCount += 1; } }
});
assert.strictEqual(stagingPage.window.KF_ENVIRONMENT_URL('./portal.html'), 'https://example.test/portal.html?staging=1');
let prevented = false, propagationStopped = false;
stagingPage.documentEvents.click({
  target:{ closest(){ return { id:'scheduleBtn' }; } },
  preventDefault(){ prevented = true; },
  stopImmediatePropagation(){ propagationStopped = true; }
});
assert.strictEqual(stagingPage.location.assigned, 'https://example.test/schedule.html?staging=1&branch=KORAT&department=OFFICE');
assert(prevented && propagationStopped, 'shared routing must replace legacy direct navigation');
stagingPage.documentEvents.click({
  target:{ closest(){ return { id:'employeeBtn' }; } },
  preventDefault(){}, stopImmediatePropagation(){}
});
assert.strictEqual(stagingPage.location.assigned, 'https://example.test/portal.html?staging=1');
stagingPage.windowEvents.pageshow({ persisted:true });
assert.strictEqual(refreshCount, 1, 'restored Manager page must refresh team data');
const productionPage = loadUxPage('https://example.test/manager.html');
assert.strictEqual(productionPage.window.KF_ENVIRONMENT_URL('./portal.html?staging=1'), 'https://example.test/portal.html');

console.log('uat session and top bar: pass');
