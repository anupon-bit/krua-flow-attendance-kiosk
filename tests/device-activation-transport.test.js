'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const kiosk = fs.readFileSync('index.html', 'utf8');

assert.match(kiosk, /clientOrigin:location\.origin/);
assert.match(kiosk, /message\.type!=='KruaFlowApiResult'/);
assert.match(kiosk, /event\.source!==sink\.contentWindow/);
assert.match(kiosk, /pending\.fallback=setTimeout\(\(\)=>pollStatus\(requestId,0\),700\)/);
assert.match(kiosk, /MAX_STATUS_POLL_ATTEMPTS=40/);
assert.match(kiosk, /options\.timeoutMs\|\|\(isAttendance\?120000:45000\)/);
assert.match(kiosk, /ระบบกำลังบันทึกภาพ ใช้เวลานานกว่าปกติ กรุณาอย่ากดซ้ำ/);
assert.match(kiosk, /MAX_PHOTO_DATA_URL_CHARS=180000/);
assert.match(kiosk, /photoData\.length>MAX_PHOTO_DATA_URL_CHARS/);
assert.match(kiosk, /ATTENDANCE_OUTCOME_UNKNOWN/);
assert.match(kiosk, /LS_PENDING_TOKEN='kruaFlowPendingDeviceTokenV1'/);
assert.match(kiosk, /localStorage\.getItem\(LS_PENDING_TOKEN\)\|\|randomDeviceToken\(\)/);
assert.match(kiosk, /localStorage\.setItem\(LS_PENDING_TOKEN,token\)/);
assert.match(kiosk, /localStorage\.removeItem\(LS_PENDING_TOKEN\)/);

let index = 0;
for (const match of kiosk.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  new vm.Script(match[1], { filename: `index.html#${++index}` });
}

console.log('device activation transport tests: pass');
