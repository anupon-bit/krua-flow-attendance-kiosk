'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const workspace = fs.readFileSync(path.join(root, 'workspace.html'), 'utf8');
const workforce = fs.readFileSync(path.join(root, 'workforce.html'), 'utf8');
const i18nSource = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');

const storage = new Map();
const documentStub = {
  documentElement: { lang: 'th' },
  querySelectorAll: () => []
};
const windowStub = {
  dispatchEvent: () => {},
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  }
};
const context = {
  CustomEvent: function CustomEvent(type, detail) { this.type = type; this.detail = detail; },
  document: documentStub,
  localStorage: windowStub.localStorage,
  window: windowStub
};
vm.runInNewContext(i18nSource, context, { filename: 'js/i18n.js' });

const i18n = windowStub.KruaFlowI18n;
assert(i18n, 'central i18n layer should be exported');
assert.strictEqual(i18n.getLanguage(), 'th', 'Thai must be the default language');
assert.strictEqual(i18n.t('view.overview'), 'ภาพรวมระบบ');
[
  ['view.employees', 'รายชื่อพนักงาน'],
  ['view.attendance', 'เวลาเข้า–ออก'],
  ['view.leave', 'การลา / วันหยุด'],
  ['view.payrollReview', 'ตรวจค่าแรง'],
  ['view.settings', 'ตั้งค่าระบบ'],
  ['view.performance', 'ผลการปฏิบัติงาน'],
  ['common.comingSoon', 'เร็ว ๆ นี้']
].forEach(([key, expected]) => assert.strictEqual(i18n.t(key), expected, `${key} must have a complete Thai translation`));
assert.strictEqual(i18n.t('missing.acceptance.key'), '—', 'missing Thai keys must fail closed without an English fallback');
assert.strictEqual(i18n.errorText(new Error('Backend timeout')), 'ระบบตอบสนองช้าเกินไป กรุณาลองใหม่');
i18n.setLanguage('en');
assert.strictEqual(i18n.t('view.overview'), 'System overview');
assert.strictEqual(i18n.t('common.comingSoon'), 'Coming Soon');
assert.strictEqual(i18n.getLanguage(), 'en', 'language preference must persist in browser storage');
i18n.setLanguage('th');

const referencedKeys = new Set();
[workspace, workforce].forEach(source => {
  [...source.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].forEach(match => referencedKeys.add(match[1]));
  [...source.matchAll(/\bt\('([^']+)'/g)].forEach(match => referencedKeys.add(match[1]));
});
referencedKeys.forEach(key => {
  if (key.endsWith('.')) return;
  assert(Object.prototype.hasOwnProperty.call(i18n.dictionaries.th, key), `Thai translation is missing ${key}`);
  assert(Object.prototype.hasOwnProperty.call(i18n.dictionaries.en, key), `English translation is missing ${key}`);
});

const coreViews = [
  'overview', 'review', 'notifications', 'employees', 'employee-registration',
  'employee-documents', 'schedule', 'attendance', 'leave', 'payroll',
  'payroll-period', 'bank', 'payroll-history', 'report-workforce',
  'report-attendance', 'report-leave', 'report-payroll', 'permissions',
  'master-data', 'devices', 'settings'
];
const comingSoonViews = [
  'recruitment', 'applicants', 'interviews', 'staffing', 'onboarding', 'activity',
  'shift-check', 'performance', 'probation-review', 'training', 'incident',
  'movement', 'offboarding', 'retention', 'advanced-kpi', 'advanced-reports'
];
[...coreViews, ...comingSoonViews].forEach(view => {
  assert(workspace.includes(`data-view="${view}"`), `navigation is missing ${view}`);
});
assert.strictEqual((workspace.match(/data-group="recruitment"/g) || []).length, 0, 'recruitment must not remain as a duplicate top-level group');
assert.strictEqual((workspace.match(/data-group="coming-soon"/g) || []).length, 1, 'there must be one secondary Coming Soon group');
assert(workspace.includes('class="group collapsed" data-group="coming-soon"'), 'Coming Soon must be visually secondary and collapsed by default');
comingSoonViews.forEach(view => {
  const button = workspace.match(new RegExp(`<button class="navBtn secondary"[^>]*data-view="${view}"[\\s\\S]*?</button>`));
  assert(button && button[0].includes('data-i18n="common.comingSoon"'), `${view} must have a muted Coming Soon badge`);
});

assert(workspace.includes('./js/i18n.js'), 'workspace must import central i18n');
assert(workforce.includes('./js/i18n.js'), 'workforce must import central i18n');
assert(workspace.includes('data-language="th"') && workspace.includes('data-language="en"'), 'workspace language switcher is missing');
assert(workforce.includes('data-language="th"') && workforce.includes('data-language="en"'), 'workforce language switcher is missing');
assert(workspace.includes("type: 'KruaFlowLanguage'"), 'workspace must sync language to embedded core pages');
assert(workforce.includes("type: 'KruaFlowLanguageChange'"), 'embedded workforce pages must sync language back to the shell');
assert(i18nSource.includes('เร็ว ๆ นี้ — ฟังก์ชันนี้อยู่ระหว่างพัฒนาและยังไม่เปิดใช้งานจริง'), 'Thai Coming Soon banner is missing');
assert(i18nSource.includes('Coming Soon — This feature is under development and is not yet available for live use.'), 'English Coming Soon banner is missing');
assert(workforce.includes('PREVIEW_RULES'), 'feature-gated views must use the preview resolver');
assert(workforce.includes('previewView()'), 'preview UX shell is missing');
const navFallbacks = [...workspace.matchAll(/class="navLabel"[^>]*>([^<]*)</g)].map(match => match[1]);
assert(!navFallbacks.some(label => /Employee|Attendance|Leave|Payroll|Performance|Recruitment|Activity|Retention|Master Data|Onboarding|Offboarding/.test(label)), 'Thai sidebar fallback labels must not leak English');

const previewRuleBlock = workforce.match(/const PREVIEW_RULES = \{([\s\S]*?)\n  \};/);
assert(previewRuleBlock, 'preview rules should be declared');
[
  'RECRUITMENT_ENABLED', 'ACTIVITY_ENABLED', 'PERFORMANCE_ENABLED',
  'OFFBOARDING_ENABLED', 'GCS_DOCUMENTS_ENABLED'
].forEach(flag => assert(previewRuleBlock[1].includes(flag), `preview rules are missing ${flag}`));

[
  'adminTransitionApplicant', 'adminStartOnboarding', 'adminMarkNotificationRead',
  'adminSaveStaffingTarget', 'adminSavePayrollPeriod'
].forEach(operation => {
  assert(!workforce.includes(`call('${operation}'`), `UAT preview must not call write API ${operation}`);
});

assert(workforce.includes("setTimeout(load, 350)"), 'attendance search must be debounced');
assert(workforce.includes('Promise.allSettled'), 'dashboard requests must run independently in parallel');
[
  'adminSearchEmployees', 'adminAttendanceControl', 'adminGetWorkQueue',
  'adminGetNotificationCenter', 'adminGetPayrollPeriods'
].forEach(operation => assert(workforce.includes(`call('${operation}'`), `dashboard is missing ${operation}`));
assert(workforce.includes('skeletonGrid'), 'loading skeleton is missing');
assert(workforce.includes('drawerBackdrop'), 'detail drawer is missing');

console.log('ux preview: pass');
