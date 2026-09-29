'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const backend = fs.readFileSync('apps-script/\u0e23\u0e2b\u0e31\u0e2a.js', 'utf8');
const source = backend.match(/function recordAttendanceCore_\(payload\) \{([\s\S]*?)\n\}/);
assert.ok(source, 'attendance core must exist');
new vm.Script(source[0], {filename:'recordAttendanceCore_'});

const body = source[1], lockAt = body.indexOf('lock.waitLock(30000)');
assert.ok(lockAt >= 0, 'parallel attendance requests must wait for the queue instead of failing after 5 seconds');
for (const lookup of ["getSetting_('DUPLICATE_WINDOW_SECONDS')", "deviceBranchV7_(payload.deviceId || 'KIOSK')", 'employeeRecordV7_(emp.id)']) {
  assert.ok(body.indexOf(lookup) >= 0 && body.indexOf(lookup) < lockAt, lookup+' must be read before taking the script lock');
}
const lockedSection = body.slice(lockAt, body.indexOf('lock.releaseLock'));
assert.match(lockedSection, /rejectDuplicate_\(sh, emp\.id, payload\.action, now, duplicateSeconds\)/, 'duplicate check must remain serialized with the attendance append');
assert.match(lockedSection, /sh\.appendRow\(row\)/, 'attendance must still append within the lock');
assert.match(lockedSection, /setNumberFormats\(\[timestampFormats\]\)/, 'timestamp formats must be batched into one sheet write');

console.log('kiosk attendance concurrency tests: pass');