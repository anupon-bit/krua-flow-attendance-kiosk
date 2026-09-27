'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const files = [
  'index.html', 'workspace.html', 'workforce.html', 'admin-settings.html',
  'register.html', 'portal.html', 'manager.html', 'schedule.html',
  'readiness.html', 'dashboard.html', 'leave.html'
];
const visible = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const i18n = fs.readFileSync('js/i18n.js', 'utf8');

assert.match(visible, /KruaFlow Workforce V2/);
assert.doesNotMatch(visible, /Krua Flow Attendance V4/);
assert.doesNotMatch(visible, /(?:Employee|Work) Schedule V7\.3/);
assert.doesNotMatch(visible, /Backend V(?:6\.1|7\.1|7\.3)/);
assert.doesNotMatch(visible, /ระบบ V7/);
assert.doesNotMatch(visible, />Pre-Go-Live</);
assert.equal((i18n.match(/'app\.name': 'KruaFlow Workforce V2'/g) || []).length, 2);

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  let index = 0;
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: `${file}#${++index}` });
  }
}

console.log('current version labels tests: pass');
