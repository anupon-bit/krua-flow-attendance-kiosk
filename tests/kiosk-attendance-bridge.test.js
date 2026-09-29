'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const page = fs.readFileSync('index.html', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
scripts.forEach((source, index) => new vm.Script(source, {filename:'index.html#inline-'+(index+1)}));

assert.match(page, /event\.source!==sink\.contentWindow/, 'messages must come from the API iframe');
assert.match(page, /message\.type!=='KruaFlowApiResult'/, 'only Apps Script API results may settle a request');
assert.match(page, /pendingRequests\.get\(requestId\)/, 'responses must match an in-flight request ID');
assert.match(page, /payload\.clientOrigin=location\.origin/, 'Apps Script must receive the kiosk origin to target the iframe response');
assert.match(page, /function pollStatus\(/, 'JSONP status polling must remain as a fallback');
assert.match(page, /if\(!pendingRequests\.has\(requestId\)\)return/, 'polling must stop after another transport settles the request');
assert.match(page, /MAX_STATUS_POLL_ATTEMPTS=40/, 'attendance status polling must tolerate a slow Drive write');
assert.match(page, /options\.timeoutMs\|\|\(isAttendance\?120000:45000\)/, 'attendance requests must wait longer than the generic API timeout');
assert.match(page, /ระบบกำลังบันทึกภาพ ใช้เวลานานกว่าปกติ กรุณาอย่ากดซ้ำ/, 'slow submissions must warn against duplicate taps');
assert.match(page, /MAX_PHOTO_DATA_URL_CHARS=180000/, 'large photos must be compressed before sending to Apps Script');
assert.match(page, /photoData\.length>MAX_PHOTO_DATA_URL_CHARS/, 'photo compression must adapt only when payload exceeds the target');
assert.match(page, /e\.code==='ATTENDANCE_OUTCOME_UNKNOWN'/, 'ambiguous timeouts must prevent an immediate duplicate submission');
assert.match(page, /\$\('saveBtn'\)\.disabled=true/, 'save must disable the button while submission is in flight');

const duplicateFunction = backend.match(/function rejectDuplicate_\(sh, employeeId, action, now, seconds\) \{[\s\S]*?\n\}/);
assert.ok(duplicateFunction, 'backend duplicate guard must exist');
const context = vm.createContext({actionLabel_:action => action === 'IN' ? 'เข้างาน' : action});
new vm.Script(duplicateFunction[0]).runInContext(context);
const recentResult = vm.runInContext(`(()=>{
  const sheet={getLastRow:()=>2,getRange:()=>({getValues:()=>[['TX',new Date(Date.now()-30000),'','','E011','', 'เข้างาน']]})};
  try{rejectDuplicate_(sheet,'E011','IN',new Date(),120);return 'allowed'}catch(error){return error.message}
})()`, context);
assert.equal(recentResult, 'รายการเดิมถูกบันทึกไปแล้ว กรุณารอสักครู่ก่อนบันทึกซ้ำ', 'backend must reject a repeated action within the duplicate window');

console.log('kiosk attendance bridge tests: pass');