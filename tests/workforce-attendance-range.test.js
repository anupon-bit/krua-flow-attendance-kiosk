'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const backend = fs.readFileSync('apps-script/WorkforceAttendanceRangeV2.js', 'utf8');
const router = fs.readFileSync('apps-script/WorkforceAttendanceV2.js', 'utf8');
const workforce = fs.readFileSync('workforce.html', 'utf8');
const rangeStart = backend.indexOf('function wf2AttendanceRowsForRange_');
const keysStart = backend.indexOf('\nfunction wf2AttendanceKeys_', rangeStart);
assert.ok(rangeStart >= 0 && keysStart > rangeStart, 'attendance range reader must exist');
assert.equal((backend.match(/function wf2AdminAttendanceRange_\(/g) || []).length, 1, 'range handler must be declared once');

const calls = [];
const dataRows = [
  ['A', new Date('2026-09-27T02:00:00Z'), '2026-09-27', '', 'E001'],
  ['B', new Date('2026-09-28T02:00:00Z'), '2026-09-28', '', 'E002'],
  ['C', new Date('2026-09-29T02:00:00Z'), '2026-09-29', '', 'E003'],
  ['D', new Date('2026-09-30T02:00:00Z'), '2026-09-30', '', 'E004']
];
const sheet = {
  getLastRow() { return dataRows.length + 1; },
  getRange(row, column, rowCount, columnCount) {
    calls.push([row, column, rowCount, columnCount]);
    if (row === 2 && column === 2 && columnCount === 2) {
      return { getValues() { return dataRows.map(item => [item[1], item[2]]); } };
    }
    if (row === 3 && column === 1 && rowCount === 2 && columnCount === 5) {
      return { getValues() { return dataRows.slice(1, 3); } };
    }
    throw new Error('unexpected range ' + [row, column, rowCount, columnCount].join(','));
  }
};
const sandbox = vm.createContext({
  TZ: 'Asia/Bangkok',
  Utilities: { formatDate(value) { return new Date(value).toISOString().slice(0, 10); } },
  attendanceDateKey_(value) {
    return value instanceof Date ? value.toISOString().slice(0, 10) : /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
  }
});
new vm.Script(backend.slice(rangeStart, keysStart) + '\nthis.readRange = wf2AttendanceRowsForRange_;').runInContext(sandbox);
const matchedRows = sandbox.readRange(sheet, 3, '2026-09-28', '2026-09-29', 5, 2);
assert.equal(matchedRows.length, 2);
assert.deepEqual(Array.from(matchedRows, row => row[4]), ['E002', 'E003']);
assert.deepEqual(calls, [[2, 2, 4, 2], [3, 1, 2, 5]], 'scan narrow date columns before reading matching rows');

const keyFunction = backend.match(/function wf2AttendanceKeys_\([\s\S]*?\n\}/);
assert.ok(keyFunction, 'range date-key builder must exist');
new vm.Script(keyFunction[0] + '\nthis.buildKeys = wf2AttendanceKeys_;').runInContext(sandbox);
assert.equal(sandbox.buildKeys('2026-09-01', '2026-10-01').length, 31);

const rowBuilder = backend.match(/function wf2AttendanceRowForDay_\([\s\S]*?\n\}/);
assert.ok(rowBuilder, 'attendance row builder must exist');
const rowContext = vm.createContext({
  TZ: 'Asia/Bangkok',
  Utilities: { formatDate(value) { return value.toISOString().slice(11, 16); } },
  wf2AttendanceTimeText_(value) { return String(value || ''); },
  shiftWindowV7_() { return { start: new Date('2026-09-29T01:00:00Z'), end: new Date('2026-09-29T13:00:00Z'), shift: { standardHours: 12, lateGraceMinutes: 0 } }; }
});
new vm.Script(rowBuilder[0] + '\nthis.buildRow = wf2AttendanceRowForDay_;').runInContext(rowContext);
const event = { timestamp: new Date('2026-09-29T01:00:00Z'), kind: 'IN', status: 'VERIFIED_PHOTO', photoFileId: 'FILE-1' };
const reportRow = rowContext.buildRow('E001', { name: 'พนักงาน', nickname: 'นิด', branch: 'KORAT', department: 'KITCHEN' }, { shiftCode: 'DAY', startTime: '08:00', endTime: '20:00' }, [event], new Set(), '2026-09-29', new Date('2026-09-29T05:00:00Z'), {});
assert.equal(reportRow.nickname, 'นิด');
assert.equal(reportRow.checkInPhotoVerified, true);
assert.equal(reportRow.checkInPhotoFileId, 'FILE-1');

assert.match(router, /if\(payload\.startDate\|\|payload\.endDate\)return wf2AdminAttendanceRange_\(payload\)/);
assert.equal((router.match(/wf2AdminAttendanceRange_\(payload\)/g) || []).length, 1, 'range dispatch must appear once');
assert.match(backend, /getRange\(2, 3, leaveCount, 2\)/, 'leave lookup must read only status and employee columns');
assert.match(backend, /getRange\(2, 8, leaveCount, 2\)/, 'leave lookup must read only date columns');
assert.match(workforce, /id="attendanceStartDate"/);
assert.match(workforce, /id="attendanceEndDate"/);
assert.match(workforce, /id="attendanceEmployee"/);
assert.match(workforce, /employeeId: document\.getElementById\('attendanceEmployee'\)\.value/);
assert.match(workforce, /application\/vnd\.ms-excel/);
assert.match(workforce, /Promise\.all\(offsets\.slice\(index,\s*index\s*\+\s*4\)/, 'photo chunks must load in parallel batches');
assert.match(workforce, /attendance\.truncated/, 'the row cap must be disclosed in the UI');

console.log('workforce attendance range tests: pass');
