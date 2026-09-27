'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const kiosk = fs.readFileSync('index.html', 'utf8');

assert.match(kiosk, /clientOrigin:location\.origin/);
assert.match(kiosk, /message\.type!=='KruaFlowApiResult'/);
assert.match(kiosk, /event\.source!==sink\.contentWindow/);
assert.match(kiosk, /bridgePending\[requestId\]\.fallback=setTimeout\(\(\)=>pollStatus\(requestId,0\),700\)/);
assert.match(kiosk, /LS_PENDING_TOKEN='kruaFlowPendingDeviceTokenV1'/);
assert.match(kiosk, /localStorage\.getItem\(LS_PENDING_TOKEN\)\|\|randomDeviceToken\(\)/);
assert.match(kiosk, /localStorage\.setItem\(LS_PENDING_TOKEN,token\)/);
assert.match(kiosk, /localStorage\.removeItem\(LS_PENDING_TOKEN\)/);

let index = 0;
for (const match of kiosk.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  new vm.Script(match[1], { filename: `index.html#${++index}` });
}

console.log('device activation transport tests: pass');
