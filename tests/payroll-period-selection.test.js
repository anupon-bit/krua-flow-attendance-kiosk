'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const dashboard = fs.readFileSync('dashboard.html', 'utf8');
const workspace = fs.readFileSync('workspace.html', 'utf8');

assert.doesNotMatch(workspace, /data-view="payroll-period"/, 'payroll period must not remain a separate sidebar item');
assert.match(workspace, /data-view="payroll"[^>]+view=payroll/, 'payroll review remains the single review entry');
assert.match(dashboard, /id="payrollPeriodPicker"/);
assert.match(dashboard, /id="periodStart"/);
assert.match(dashboard, /id="periodEnd"/);
assert.match(dashboard, /id="periodPayDate"/);
assert.match(dashboard, /id="applyPayrollPeriod"/);
assert.match(dashboard, /document\.querySelector\('#payroll \.scroll'\);if\(payrollScroll\)payrollScroll\.style\.maxHeight='none'/, 'payroll rows must expand with the page instead of using an inner vertical scrollbar');
assert.match(dashboard, /op:'adminDashboardPayrollBundle',adminToken:state\.token,startDate:state\.start,endDate:state\.end,payDate:state\.payDate/);

const start = dashboard.indexOf('function payrollDateValue(');
const end = dashboard.indexOf('function updatePayrollCycleButtons', start);
assert.ok(start >= 0 && end > start, 'payroll date validation helpers missing');
const context = vm.createContext({});
new vm.Script(dashboard.slice(start, end) + '\nthis.validate = validatePayrollPeriod;').runInContext(context);
assert.equal(context.validate('2026-09-17', '2026-09-23', '2026-09-29', '2026-09-30'), '');
assert.match(context.validate('2026-09-23', '2026-09-17', '2026-09-29', '2026-09-30'), /สิ้นสุด/);
assert.match(context.validate('2026-09-01', '2026-10-02', '2026-10-05', '2026-10-10'), /31 วัน/);
assert.match(context.validate('2026-09-17', '2026-09-30', '2026-09-30', '2026-09-30'), /ก่อนวันปัจจุบัน/);
assert.match(context.validate('2026-09-17', '2026-09-23', '', '2026-09-30'), /วันที่จ่าย/);

console.log('payroll period selection tests: pass');
