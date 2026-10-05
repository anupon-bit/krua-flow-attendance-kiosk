'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const page = fs.readFileSync('dashboard.html', 'utf8');
const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
scripts.forEach((source, index) => new vm.Script(source, {filename:'dashboard.html#inline-'+(index+1)}));

assert.match(page, /event\.source!==sink\.contentWindow/, 'dashboard must accept direct results only from its API iframe');
assert.match(page, /message\.type!=='KruaFlowApiResult'/, 'dashboard must settle oversized responses through postMessage');
assert.match(page, /pendingCalls\.has\(id\)/, 'polling must stop after postMessage settles the request');
assert.match(page, /clientOrigin:location\.origin/, 'backend must receive the dashboard origin for targeted postMessage');
assert.match(page, /PAYROLL_TIMEOUT_MS=120000/, 'payroll must tolerate a slow Apps Script cold start');
assert.match(backend, /Utilities\.newBlob\(json,'application\/json'\)\.getBytes\(\)\.length/, 'cache limits must use UTF-8 bytes, not JavaScript character count');
assert.match(backend, /Cache is only the JSONP fallback/, 'cache failures must preserve a successful postMessage result');

assert.match(backend, /function payrollDashboardPreviewV7_\(/, 'bundle responses must use a compact payroll preview');
assert.match(backend, /preview:payrollDashboardPreviewV7_\(preview\)/, 'full daily payroll previews must not be returned for every employee');
assert.match(backend, /snap\.getRange\(2,1,count,10\)/, 'snapshot reads must stop before Detail JSON');
assert.match(backend, /snap\.getRange\(2,12,count,8\)/, 'snapshot workflow fields must be read without Detail JSON');
assert.doesNotMatch(backend, /snap\.getRange\(2,1,snapLast-1,19\)/, 'dashboard bundle must not read historical Detail JSON payloads');
assert.match(page, /items:r\.map\(x=>\(\{employeeId:x\.employee\.id\}\)\)/, 'review submission must send only IDs because the backend recalculates authoritative previews');

const compactStart = backend.indexOf('function payrollDashboardPreviewV7_(');
const compactEnd = backend.indexOf('\nfunction adminDashboardPayrollBundleV7_', compactStart);
assert.ok(compactStart >= 0 && compactEnd > compactStart, 'compact preview helper source must be extractable');
const context = vm.createContext({});
new vm.Script(backend.slice(compactStart, compactEnd), {filename:'payrollDashboardPreviewV7.js'}).runInContext(context);
const compact = context.payrollDashboardPreviewV7_({
  periodKey:'20261001_20261007_20261014',
  totals:{net:1234,workedDays:2},
  rows:[
    {lateDeduction:100,lateMinutes:18,note:''},
    {lateDeduction:0,lateMinutes:0,note:'ไม่มีเวลาออก • ไม่คำนวณ OT'}
  ]
});
assert.equal(compact.periodKey, '20261001_20261007_20261014');
assert.equal(compact.totals.net, 1234);
assert.equal(compact.indicators.lateDays, 1);
assert.equal(compact.indicators.lateOver15, true);
assert.equal(compact.indicators.noOut, true);
assert.equal(Object.hasOwn(compact, 'rows'), false, 'daily rows must stay out of the dashboard response');

console.log('payroll dashboard performance tests: pass');
