'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const workspace = fs.readFileSync('workspace.html', 'utf8');
const workforce = fs.readFileSync('workforce.html', 'utf8');
const backend = fs.readFileSync('apps-script/WorkforceV2.js', 'utf8');
const apiBackend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const config = fs.readFileSync('config.js', 'utf8');

assert.match(workspace, /data-view="employee-registration" data-url="\.\/workforce\.html\?embed=1&amp;view=registrations"|data-view="employee-registration" data-url="\.\/workforce\.html\?embed=1&view=registrations"/);
assert.match(workspace, /data-view="employee-documents" data-url="\.\/workforce\.html\?embed=1&amp;view=employee-documents"|data-view="employee-documents" data-url="\.\/workforce\.html\?embed=1&view=employee-documents"/);
assert.doesNotMatch(workspace, /data-view="employee-(?:registration|documents)"[^>]+admin\.html/);

assert.match(workforce, /adminListRegistrationsV2/);
assert.equal((workforce.match(/adminListRegistrationsV2', \{ limit:25 \}/g) || []).length, 2);
assert.doesNotMatch(workforce, /adminListRegistrationsV2', \{ limit:100 \}/);
assert.match(workforce, /adminGetRegistrationV2/);
assert.match(workforce, /data-approve-registration/);
assert.match(workforce, /call\('adminApproveRegistrationFast'/);
assert.match(workforce, /currentDocumentState\.status !== 'COMPLETE'/);
assert.match(workforce, /wageType:\s*wageType\.value,\s*wageAmount:\s*Number\(wageAmount\.value\)/);
assert.match(workforce, /documentGetViewUrl/);
assert.match(workforce, /result\.url/);
assert.match(workforce, /image\/(?:jpeg|png|webp)|doc\.mimeType/);
assert.match(workforce, /application\/pdf|doc\.mimeType/);
assert.doesNotMatch(workforce, /storage\.googleapis\.com[^'"\s]*/);

assert.match(backend, /if\(op==='adminListRegistrationsV2'\) return wf2AdminListRegistrationsV2_\(payload\)/);
assert.match(backend, /if\(op==='adminGetRegistrationV2'\) return wf2AdminGetRegistrationV2_\(payload\)/);
assert.match(backend, /requireAdmin_\(String\(payload\.adminToken\|\|''\)\)/);
assert.match(backend, /let registrations=wf2RegistrationRowsV2_\(\)/);
assert.match(backend, /const registration=wf2RegistrationRowsV2_\(\)\.find/);
assert.match(backend, /wf2DocumentRowsForAdminAll_\(id,''\)/);
assert.doesNotMatch(backend.match(/function wf2RegistrationRowsV2_\(\)[\s\S]*?\n\}/)[0], /DRAFT[^\n]*filter|filter[^\n]*DRAFT/);
assert.match(backend, /function wf2DocumentGetViewUrl_/);
assert.match(apiBackend, /const target=clientOrigin\?JSON\.stringify\(clientOrigin\):'"\*"'/);
assert.match(apiBackend, /return clientOrigin\?output\.setXFrameOptionsMode\(HtmlService\.XFrameOptionsMode\.ALLOWALL\):output/);
assert.match(config, /STAGING_API_URL:\s*"https:\/\/script\.google\.com\/macros\/s\/AKfycbzG77xQnZFyyT8zMs6x4_0FHAqR3-YfYZIdN5IIxpWLx-ZVq3pp8hk_H0GC9sWcOTcA\/exec"/);

for (const file of ['workspace.html', 'workforce.html']) {
  const html = fs.readFileSync(file, 'utf8');
  let index = 0;
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: `${file}#${++index}` });
  }
}

console.log('workforce registration v2 tests: pass');
