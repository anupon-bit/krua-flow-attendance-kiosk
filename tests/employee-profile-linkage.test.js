'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const admin = fs.readFileSync('admin.html', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');

for (const match of admin.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  new vm.Script(match[1], { filename: 'admin.html' });
}

assert.match(admin, /call\(\{op:'adminGetOrgMasters',adminToken:state\.token,includeDevices:false\},\{timeoutMs:45000/, 'employee profile must use the authenticated Settings master source without loading devices');
assert.match(admin, /maxPollAttempts:80/, 'Settings request must be allowed to poll for its full timeout');
assert.match(admin, /maxPollAttempts:Number\(opts\.maxPollAttempts\)\|\|10/);
assert.match(admin, /var pending=pendingCalls\[id\];if\(!pending\)return/);
assert.match(admin, /id="refreshOrgMastersBtn"/);
assert.match(admin, /id="orgShiftSummary"/);
assert.match(admin, /id="adminHeaderBar"/);
assert.match(admin, /body\.kfEmployeeRoster #adminHeaderBar/);
assert.match(admin, /document\.body\.classList\.add\('kfEmployeeRoster'\)/);
assert.match(admin, /ค้นหาชื่อ-นามสกุล \/ ชื่อเล่น \/ รหัสพนักงาน/);
assert.match(admin, /อายุ '\+ageLabel\(e\.birthDate\)/);
assert.match(admin, /อายุงาน '\+tenureLabel\(e\.startDate,e\.resignationDate\)/);
assert.match(admin, /includeRosterDetails:true/);
assert.match(admin, /adminGetPermissionUsers',adminToken:state\.token,includeRosterDetails:true/);
assert.match(admin, /body\.kfEmployeeRoster #adminHeaderBar/);
assert.match(admin, /ค้นหาชื่อ-นามสกุล \/ ชื่อเล่น \/ รหัสพนักงาน/);
assert.match(admin, /ageLabel\(e\.birthDate\)/);
assert.match(admin, /tenureLabel\(e\.startDate,e\.resignationDate\)/);
assert.match(admin, /ไม่มีสาขาที่เปิดใช้งาน/);
assert.match(admin, /แผนกปัจจุบันไม่อยู่ในรายการที่เปิดใช้งาน/);
assert.match(admin, /schedule\.html\?admin=1&amp;embed=1/, 'shift assignment must link to dated schedules');
assert.doesNotMatch(admin, /id="dBranch"><option value="KORAT"/);
assert.doesNotMatch(admin, /id="dDepartment"><option value="KITCHEN"/);
assert.match(admin, /response\.employee/);
assert.match(admin, /บันทึกสำเร็จ · ยืนยันข้อมูลจากฐานข้อมูลแล้ว/);
assert.match(admin, /มีการแก้ไขที่ยังไม่ได้บันทึก/);
assert.match(admin, /op:'adminGetPermissionUsers',adminToken:state\.token,includeRosterDetails:true/);
assert.match(admin, /e\.firstName,e\.lastName,e\.nickname/);

const helperStart = admin.indexOf('function setEmployeeMasterSelect(');
const helperEnd = admin.indexOf('\nfunction renderEmployeeOrgMasters', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'organization select helper missing');
const select = {
  options: [],
  set innerHTML(value) { this.options = [{ value: '', textContent: '-' }]; },
  appendChild(option) { this.options.push(option); },
  set value(value) { this.selected = value; },
  get value() { return this.selected; },
  disabled: true
};
const context = vm.createContext({
  $() { return select; },
  document: { createElement() { return { value: '', textContent: '' }; } }
});
new vm.Script(admin.slice(helperStart, helperEnd) + '\nthis.populate = setEmployeeMasterSelect;').runInContext(context);
context.populate('dBranch', [{ code: 'A', name: 'Active', active: true }, { code: 'OLD', name: 'Old', active: false }], 'A');
assert.deepEqual(Array.from(select.options, option => option.value), ['', 'A']);
context.populate('dBranch', [{ code: 'A', name: 'Active', active: true }, { code: 'OLD', name: 'Old', active: false }], 'OLD');
assert.equal(select.value, 'OLD');
assert.match(select.options[2].textContent, /ปิดใช้งาน/);
assert.equal(select.options[2].disabled, true, 'inactive settings must remain visible but unavailable for new assignments');
context.populate('dBranch', [{ code: 'A', name: 'Active', active: true }], 'MISSING');
assert.match(select.options[2].textContent, /ไม่มีในรายการ Settings ที่เปิดใช้งาน/);
assert.equal(select.options[2].disabled, true, 'unknown legacy values must not be assignable');

assert.match(backend, /if \(nextBranch !== currentBranch\) validateBranchV7_\(nextBranch, true\)/);
assert.match(backend, /if \(nextDepartment !== currentDepartment\) validateDepartmentV7_\(nextDepartment, true\)/);
assert.match(backend, /const nextName = \[nextFirstName, nextLastName\]\.filter\(Boolean\)\.join\(' '\) \|\| currentName/);
assert.match(backend, /sh\.getRange\(row,2\)\.setValue\(nextName\)/);
assert.match(backend, /return \{ok:true,employee:adminGetEmployeeDetail_\(token,id\)\}/);
assert.match(backend, /employee:r\.employee/);
assert.match(backend, /if\(payload\.includeDevices!==false\)result\.devices=deviceRowsV7_\(\)/);
assert.match(backend, /if\(payload\.includeRosterDetails\)Object\.assign\(employee,\{firstName:/);
assert.match(backend, /startDate:formatDateInputForClient_\(r\[9\]\),birthDate:formatDateInputForClient_\(r\[16\]\)/);

console.log('employee profile linkage tests: pass');
