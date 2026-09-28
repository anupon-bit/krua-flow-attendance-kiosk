'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const workspace = fs.readFileSync('workspace.html', 'utf8');
const i18n = fs.readFileSync('js/i18n.js', 'utf8');
const systemGroup = workspace.match(/<div class="group" data-group="system">([\s\S]*?)<\/div>\s*<div class="group collapsed"/);

assert.ok(systemGroup, 'system sidebar group must exist');
assert.match(systemGroup[1], /data-view="master-data" data-url="\.\/admin-settings\.html\?embed=1"/, 'organization settings must be available in the system sidebar');
assert.doesNotMatch(systemGroup[1], /data-view="master-data"[^>]*view=branches/, 'organization settings must not hide the department and shift tabs');
assert.match(workspace, /data-i18n="view\.masterData">สาขา \/ แผนก \/ กะ</, 'sidebar fallback label must describe all available settings');
assert.match(i18n, /'view\.masterData': 'สาขา \/ แผนก \/ กะ'/, 'Thai navigation translation must describe all settings');
assert.match(i18n, /'view\.masterData': 'Branches \/ departments \/ shifts'/, 'English navigation translation must describe all settings');

console.log('workspace system settings navigation: pass');
