'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const workforce = fs.readFileSync('workforce.html', 'utf8');
const workspace = fs.readFileSync('workspace.html', 'utf8');
const styles = fs.readFileSync('css/workforce.css', 'utf8');
const i18n = fs.readFileSync('js/i18n.js', 'utf8');

assert.match(workspace, /data-view="attendance"\s+data-url="\.\/workforce\.html\?embed=1&view=attendance"/);
assert.match(workforce, /call\('adminAttendanceControl'/);
assert.match(workforce, /id="attendanceStatus"/);
assert.match(workforce, /status:\s*document\.getElementById\('attendanceStatus'\)\.value/);
assert.match(workforce, /attendanceTime\(row\.checkIn, 'in'/);
assert.match(workforce, /attendanceTime\(row\.checkOut, 'out'/);
assert.match(workforce, /attendanceHours\(row\)/);
assert.match(workforce, /call\('adminGetEmployeeAttendanceRange'/);
assert.match(workforce, /call\('adminGetPhoto'/);
assert.match(workforce, /call\('adminGetFileChunk'/);
assert.match(workforce, /bindAttendanceDetails\(detailBox, rows\)/);
assert.match(workforce, /attendance\.viewEvidence/);
assert.match(workforce, /t\('table\.shift'\), row\.shiftCode/);
assert.match(workforce, /t\('table\.workedHours'\), row\.workedHours/);
assert.match(workforce, /t\('table\.lateMinutes'\), row\.lateMinutes/);
assert.match(workforce, /t\('table\.otHours'\), row\.otHours/);
assert.match(styles, /\.attendanceTime\.in/);
assert.match(styles, /\.attendanceTime\.out/);
assert.match(styles, /\.attendanceTime\.missing/);
assert.equal((i18n.match(/'table\.checkIn':/g) || []).length, 2);
assert.equal((i18n.match(/'table\.checkOut':/g) || []).length, 2);

for (const file of ['workspace.html', 'workforce.html']) {
  const html = fs.readFileSync(file, 'utf8');
  let index = 0;
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: `${file}#${++index}` });
  }
}

console.log('attendance UI tests: pass');
