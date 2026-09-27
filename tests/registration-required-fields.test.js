'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const register = fs.readFileSync(path.resolve(__dirname, '..', 'register.html'), 'utf8');
const backend = fs.readFileSync(path.resolve(__dirname, '..', 'apps-script', 'รหัส.js'), 'utf8');

for (const id of ['branch','department','position','firstName','lastName','phone','birthDate','employeePin','employeePinConfirm','registeredAddress','currentAddress','emergencyName','emergencyPhone','bankName','bankAccountNo','bankAccountName','docIdCard','docHouse','photo','consent']) {
  assert.match(register, new RegExp('id="' + id + '"[^>]*\\brequired\\b'), id + ' must remain required');
}

for (const id of ['docEducation','docOther']) {
  const tag = register.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
  assert(tag, id + ' input missing');
  assert.doesNotMatch(tag[0], /\brequired\b/, id + ' must remain optional');
}

assert.match(register, /\*<\/span> จำเป็นต้องกรอก \/ แนบเอกสาร/);
assert.match(register, /querySelectorAll\('\[required\]'\)/);
assert.match(register, /fields\.find\(el=>!requiredFieldComplete\(el\)\)/);
assert.match(register, /if\(!validateRequiredFields\(\)\|\|!validateSelectedFiles\(\)\)return/);
assert.match(register, /scrollIntoView\(\{behavior:'smooth',block:'center'\}\)/);
assert.match(register, /กรุณาแนบบัตรประชาชน/);
assert.match(register, /กรุณาแนบทะเบียนบ้าน/);
assert.match(register, /กรุณาแนบรูปถ่ายพนักงาน/);
assert.match(register, /กรุณาทำเครื่องหมายยืนยันว่าข้อมูลถูกต้อง/);
assert.match(backend, /validateDepartmentV7_\(registration\.department, false\)/);
assert.match(backend, /throw new Error\('กรุณากรอกข้อมูลที่จำเป็นให้ครบ'\)/);
assert.match(backend, /throw new Error\('กรุณายืนยันว่าข้อมูลถูกต้อง'\)/);
assert.match(backend, /function requiredEmployeeDocumentTypes_\(\) \{ return \['ID_CARD','HOUSE_REGISTRATION','EMPLOYEE_PHOTO'\]; \}/);

const validationStart = register.indexOf('const requiredMessages=');
const validationEnd = register.indexOf("documentInputs.forEach(input=>$(input.id).addEventListener", validationStart);
assert(validationStart >= 0 && validationEnd > validationStart, 'validation functions missing');

function requiredControl(id, options = {}) {
  return {
    id,
    type: options.type || 'text',
    value: options.value === undefined ? 'ครบแล้ว' : options.value,
    checked: options.checked === undefined ? true : options.checked,
    files: options.files === undefined ? [{ name: id + '.jpg' }] : options.files,
    checkValidity: () => options.valid !== false,
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolled = true; }
  };
}

for (const missingId of ['docIdCard','docHouse','photo','consent']) {
  const controls = [
    requiredControl('branch'),
    requiredControl('docIdCard', { type:'file' }),
    requiredControl('docHouse', { type:'file' }),
    requiredControl('photo', { type:'file' }),
    requiredControl('consent', { type:'checkbox' })
  ];
  const missing = controls.find(control => control.id === missingId);
  if (missing.type === 'file') missing.files = [];
  if (missing.type === 'checkbox') missing.checked = false;
  const observed = { error:'' };
  const sandbox = {
    Array,
    showErr(message) { observed.error = message; },
    $(id) { return id === 'form' ? { querySelectorAll: () => controls } : null; }
  };
  vm.runInNewContext(register.slice(validationStart, validationEnd) + ';this.validateRequiredFields=validateRequiredFields;', sandbox);
  assert.equal(sandbox.validateRequiredFields(), false, missingId + ' must block submit');
  assert.equal(missing.focused, true, missingId + ' must receive focus');
  assert.equal(missing.scrolled, true, missingId + ' must be scrolled into view');
  assert.match(observed.error, /^กรุณา/);
}

console.log('registration required fields tests: pass');
