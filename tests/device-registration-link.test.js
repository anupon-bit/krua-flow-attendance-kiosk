'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const settings = fs.readFileSync('admin-settings.html', 'utf8');
const workspace = fs.readFileSync('workspace.html', 'utf8');

assert.match(settings, /id="deviceRegistrationUrl"/);
assert.match(settings, /id="copyDeviceRegistrationLink"/);
assert.match(settings, /id="lineDeviceRegistrationLink"/);
assert.match(settings, /id="shareDeviceRegistrationLink"/);
assert.match(settings, /id="openDeviceRegistrationLink"/);
assert.match(settings, /new URL\('\.\/index\.html',location\.href\)/);
assert.match(settings, /url\.searchParams\.set\('v','prod-workforce-v2-labels-1'\)/);
assert.match(settings, /line\.me\/R\/msg\/text/);
assert.match(settings, /navigator\.share/);
assert.doesNotMatch(settings.match(/function getDeviceRegistrationUrl\(\)[^\n]+/)[0], /adminPin|adminToken|deviceToken/i);
assert.match(workspace, /const FRONTEND_VERSION = 'prod-attendance-evidence-1'/);

let index = 0;
for (const match of settings.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  new vm.Script(match[1], { filename: `admin-settings.html#${++index}` });
}

console.log('device registration link tests: pass');
