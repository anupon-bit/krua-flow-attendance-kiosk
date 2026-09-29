'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const settings = fs.readFileSync('admin-settings.html', 'utf8');
const admin = fs.readFileSync('admin.html', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');

for (const [name, source] of [['admin-settings.html', settings], ['admin.html', admin]]) {
  for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: name });
  }
}

assert.equal((settings.match(/id="v-wage-types"/g) || []).length, 1, 'Settings must have one Wage Types view');
assert.match(settings, /data-view="wage-types">ประเภทค่าแรง/);
assert.match(settings, /id="wtCode"/);
assert.match(settings, /id="wtName"/);
assert.match(settings, /id="wtActive"/);
assert.match(settings, /op:'adminSaveWageType'/);
assert.match(settings, /renderWageTypeList\(\)/);

assert.match(backend, /const WAGE_TYPES_SHEET = 'Wage_Types'/);
assert.match(backend, /\['MONTHLY','รายเดือน',true,10/);
assert.match(backend, /\['DAILY','รายวัน',true,20/);
assert.match(backend, /\['HOURLY','รายชั่วโมง',true,30/);
assert.match(backend, /wageTypes:getWageTypesV7_\(true\)/);
assert.match(backend, /if \(op === 'adminSaveWageType'\) return adminSaveWageTypeV7_\(payload\)/);
assert.match(backend, /cacheRemoveV7_\(\['V7_WAGE_TYPES_0','V7_WAGE_TYPES_1'\]\)/);
assert.match(backend, /if \(nextWageType !== currentWageType\) validateWageTypeV7_\(nextWageType, true\)/);
assert.match(backend, /if\(wageType!==originalWageType\)validateWageTypeV7_\(wageType,true\)/);
assert.match(backend, /if\(nextWageType!==currentWageType\)validateWageTypeV7_\(nextWageType,true\)/, 'registration edits must validate only changed wage types');

assert.match(admin, /setEmployeeMasterSelect\('dWageType',types,employee\.wageType\)/);
assert.match(admin, /registration\.dataset\.wageType/);
assert.match(admin, /select\.matches&&select\.matches\('\.rWageType'\)/);
assert.doesNotMatch(admin, /id="dWageType"><option value="MONTHLY"/);

const validator = backend.match(/function validateWageTypeV7_\(code,allowBlank\)\{[^\n]+/);
assert.ok(validator, 'wage type validator must exist');
const context = vm.createContext({
  getWageTypesV7_(includeInactive) {
    return [
      { code:'MONTHLY', active:true },
      { code:'DAILY', active:true },
      { code:'OLD_RATE', active:false }
    ].filter(item => includeInactive || item.active);
  }
});
new vm.Script(validator[0] + '\nthis.validate = validateWageTypeV7_;').runInContext(context);
assert.equal(context.validate('DAILY', false), 'DAILY');
assert.equal(context.validate('', true), '');
assert.throws(() => context.validate('OLD_RATE', true), /ประเภทค่าแรงไม่ถูกต้อง/);

const seedStart = backend.indexOf('function ensureWageTypesSheetV7_');
const seedEnd = backend.indexOf('\nfunction getWageTypesV7_', seedStart);
assert.ok(seedStart >= 0 && seedEnd > seedStart, 'Wage Types seed helper missing');
let seededSheet = null;
const seedWrites = [];
const sheet = {
  getRange(row, column, rowCount, columnCount) {
    return {
      setValues(values) { seedWrites.push({ row, column, rowCount, columnCount, values }); },
      setNumberFormat() {}
    };
  },
  setFrozenRows() {},
  getLastRow() { return 4; }
};
const sheetContext = vm.createContext({
  SPREADSHEET_ID: 'TEST',
  WAGE_TYPES_SHEET: 'Wage_Types',
  SpreadsheetApp: {
    openById() {
      return {
        getSheetByName() { return seededSheet; },
        insertSheet() { seededSheet = sheet; return sheet; }
      };
    }
  }
});
new vm.Script(backend.slice(seedStart, seedEnd) + '\nthis.ensure = ensureWageTypesSheetV7_;').runInContext(sheetContext);
sheetContext.ensure();
sheetContext.ensure();
assert.equal(seedWrites.length, 2, 'defaults are seeded only when the sheet is first created');
assert.deepEqual(Array.from(seedWrites[1].values, row => row[0]), ['MONTHLY', 'DAILY', 'HOURLY']);

console.log('wage type Settings tests: pass');
