'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const register = fs.readFileSync(path.join(root, 'register.html'), 'utf8');
const workforce = fs.readFileSync(path.join(root, 'workforce.html'), 'utf8');
const workspace = fs.readFileSync(path.join(root, 'workspace.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js', 'registration-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'registration-mobile.css'), 'utf8');

assert.match(register, /registration-mobile\.css\?v=registration-final-(?:ui|polish)-/);
assert.match(register, /registration-ui\.js\?v=registration-final-(?:ui|polish)-/);
assert.match(ui, /ข้อมูลส่วนตัว/);
assert.match(ui, /ข้อมูลการทำงาน/);
assert.match(ui, /เอกสารสำคัญ/);
assert.match(ui, /ตรวจสอบและส่ง/);
assert.match(ui, /key: 'personal',[^\n]+sectionIndexes: \[1, 3, 4\]/);
assert.match(ui, /key: 'work',[^\n]+sectionIndexes: \[0, 2, 5\]/);
assert.match(ui, /title: 'ข้อมูลธนาคาร', step: 1/);
assert.match(ui, /กรุณากรอกหรือแนบ/);
assert.match(ui, /ข้อมูลธนาคาร/);
assert.match(ui, /ผู้ติดต่อฉุกเฉิน/);
assert.match(ui, /Consent/);
assert.match(css, /\.kfWizard/);
assert.match(css, /\.kfReviewCard/);
assert.match(css, /\.fileItem\.ready/);
assert.match(css, /\.fileItem\.uploading/);
assert.match(css, /\.fileItem\.success/);
assert.match(css, /\.fileItem\.failed/);

assert.match(register, /✓ พร้อมอัปโหลด/);
assert.match(register, /✓ อัปโหลดสำเร็จ/);
assert.match(register, /status:'invalid'/);
assert.match(register, /ต้องมีขนาดไม่เกิน 10 MB/);
assert.match(register, /documentCreateUploadSession/);
assert.match(register, /documentFinalizeUpload/);
assert.match(register, /employeeRegistrationFinalize/);
assert.match(register, /toUpperCase\(\)!=='PENDING'/);

assert.match(workforce, /ส่งลิงก์ลงทะเบียนให้พนักงาน/);
assert.match(workforce, /registrationCopyLink/);
assert.match(workforce, /line\.me\/R\/msg\/text/);
assert.match(workforce, /navigator\.share/);
assert.match(workforce, /registrationQrCanvas/);
assert.match(workforce, /KruaFlowRegistrationUI/);
assert.match(workforce, /registrationStatusBadge\(row\.status\)/);
assert.match(workforce, /registrationDocumentStatusBadge\(doc\.status\)/);
assert.match(workforce, /registrationMetric\('total'/);
assert.match(workforce, /registrationMetric\('pending'/);
assert.match(workforce, /registrationMetric\('complete'/);
assert.match(workforce, /registrationMetric\('followup'/);
assert.match(css, /\.registrationMetric\.total/);
assert.match(css, /\.registrationMetric\.pending/);
assert.match(css, /\.registrationMetric\.complete/);
assert.match(css, /\.registrationMetric\.followup/);
assert.match(workforce, /data-registration-row=/);
assert.match(workforce, /tabindex="0" role="button"/);
assert.match(workforce, /event\.key === 'Enter' \|\| event\.key === ' '/);
assert.match(workforce, /event\.stopPropagation\(\)/);
assert.match(workforce, /selectRegistrationV2\(row\.dataset\.registrationRow\)/);
assert.match(workforce, /classList\.toggle\('selected', selected\)/);
assert.match(css, /data-registration-row\]\.selected/);
assert.match(workforce, /registrationDetailCard/);
for (const tone of ['personal','work','address','emergency','bank']) assert.match(css, new RegExp('registrationDetailCard\\.' + tone));
assert.match(css, /registrationFileName\.current/);
assert.match(css, /registrationOpenFile/);
assert.match(workforce, /PENDING_UPLOAD/);
assert.match(workforce, /REPLACED/);
assert.match(workforce, /documentGetViewUrl/);
assert.doesNotMatch(ui + workforce, /api\.qrserver|chart\.googleapis|quickchart/i);

assert.match(workspace, /data-view="employee-registration" data-url="\.\/workforce\.html\?embed=1(?:&|&amp;)view=registrations"/);
assert.doesNotMatch(workspace, /data-view="employee-registration"[^>]+admin\.html/);

const sandbox = {
  TextEncoder,
  navigator: {},
  window: {},
  document: { readyState: 'complete', querySelector: () => null, getElementById: () => null }
};
vm.runInNewContext(ui, sandbox, { filename: 'registration-ui.js' });
const matrix = sandbox.window.KruaFlowRegistrationUI.makeQrMatrix('http://127.0.0.1:8081/register.html?staging=1');
assert.equal(matrix.length, 37);
assert.ok(matrix.every(row => row.length === 37));
assert.equal(matrix[0][0], true);
assert.equal(matrix[6][6], true);

for (const file of ['register.html', 'workforce.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  let index = 0;
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: `${file}#${++index}` });
  }
}

console.log('registration UI tests: pass');
