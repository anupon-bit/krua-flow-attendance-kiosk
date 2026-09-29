'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const page = fs.readFileSync('admin-settings.html', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(x => x[1]);
scripts.forEach((source, index) => new vm.Script(source, {filename:'admin-settings.html#inline-'+(index+1)}));

assert.match(page, /if\(__kfSettingsParams\.get\('view'\)==='devices'\)await loadDeviceData\(true\)/, 'device deep link must use the focused loader');
assert.match(page, /op:'adminGetDevices'/, 'device page must use the dedicated API');
assert.match(page, /state\.masters=Object\.assign\(\{\},current,\{branches:r\.branches\|\|current\.branches\|\|\[\],devices:r\.rows\|\|\[\]\}\)/, 'focused device load must fetch only branches and devices');
assert.match(page, /x\.registered\?'<span class="pill ok">ลงทะเบียนแล้ว<\/span>'/, 'registered devices must have a visible status');
assert.match(page, /<option value="">ยังไม่ผูกสาขา<\/option>/, 'registered devices must be allowed to remain unassigned');
assert.match(page, /const payload=.*r=await call\(\{op:'adminSaveDevice'/, 'device save must use its response without reloading all master data');

assert.match(backend, /cacheJsonV7_\('V7_DEVICES',30/, 'device list must use a short cache');
assert.match(backend, /registered=getRegisteredDevices_\(\)/, 'device list must include activated devices from Script Properties');
assert.match(backend, /branches:getBranchesV7_\(true\)/, 'focused device API must return the branch selector data');
assert.match(backend, /cacheRemoveV7_\(\['V7_DEVICES'\]\)/, 'device updates must invalidate the cache');

const cache = new Map();
const context = {
  console,
  getBackendSpreadsheetId_: () => 'TEST_SHEET',
  CacheService: {getScriptCache: () => ({get:key => cache.get(key) || null,put:(key,value) => cache.set(key,value),remove:key => cache.delete(key)})},
  PropertiesService: {getScriptProperties: () => ({
    getProperty: key => key === 'STORE_DEVICES_JSON' ? JSON.stringify([
      {deviceId:'KIOSK-01',hash:'hash-1',registeredAt:'2026-09-01T00:00:00.000Z'},
      {deviceId:'KIOSK-02',hash:'hash-2',registeredAt:'2026-09-02T00:00:00.000Z'}
    ]) : '',
    setProperty: () => {}
  })},
  SpreadsheetApp: {openById: () => ({getSheetByName: name => name === 'Devices' ? {
    getLastRow: () => 2,
    getRange: () => ({getValues: () => [['KIOSK-01','KORAT','เครื่องหน้าร้าน',true,'2026-09-01','','']]})
  } : null})},
  Utilities: {formatDate: value => String(value)}
};
vm.createContext(context);
vm.runInContext(backend, context);
const merged = context.deviceRowsV7_();
assert.equal(merged.length, 2, 'sheet devices and activated devices must be merged');
assert.equal(merged.find(x => x.deviceId === 'KIOSK-01').branchCode, 'KORAT', 'sheet configuration must be preserved');
assert.equal(merged.find(x => x.deviceId === 'KIOSK-01').registered, true, 'configured activated device must be marked registered');
assert.equal(merged.find(x => x.deviceId === 'KIOSK-02').active, true, 'activated device missing from the sheet must still be visible');

console.log('admin device management tests: pass');
