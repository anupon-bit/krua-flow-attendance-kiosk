'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const portal = fs.readFileSync('portal.html', 'utf8');
const adminView = fs.readFileSync('js/portal-admin-view.js', 'utf8');

assert.match(portal, /id="managerTools"/, 'manager tools card must exist in the employee portal');
assert.match(portal, /id="managerDashboardBtn"[^>]*>จัดการทีม</, 'manager dashboard entry must be visible');
assert.match(portal, /id="managerScheduleBtn"[^>]*>จัดกะการทำงาน</, 'schedule management entry must be visible');
assert.match(portal, /scheduleScopes=scopes\.filter\(s=>s\.canManageSchedule!==false\)/, 'schedule entry must use backend manager scope');
assert.match(portal, /managerScheduleBtn'\)\.classList\.toggle\('hidden',!scheduleScopes\.length\)/, 'schedule entry must remain hidden without permission');
assert.match(portal, /managerUrl\('\.\/schedule\.html'\)/, 'schedule entry must open the existing schedule page');
assert.match(portal, /url\.searchParams\.set\('staging','1'\)/, 'manager navigation must preserve staging environment');
assert.match(adminView, /#app\.adminReadOnly #managerTools/, 'admin read-only preview must not expose manager write tools');

console.log('manager portal entry: pass');
