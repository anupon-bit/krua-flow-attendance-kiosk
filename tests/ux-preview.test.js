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
i18n.setLanguage('en');
assert.strictEqual(i18n.t('view.overview'), 'System overview');
i18n.setLanguage('th');

const requiredViews = [
  'overview', 'review', 'notifications', 'applicants', 'interviews', 'staffing',
  'employees', 'onboarding', 'employee-documents', 'offboarding', 'schedule',
  'attendance', 'leave', 'activity', 'shift-check', 'payroll', 'payroll-period',
  'bank', 'payroll-history', 'report-workforce', 'report-recruitment',
  'report-attendance', 'report-activity', 'report-performance', 'report-payroll',
  'report-retention', 'settings', 'permissions', 'devices', 'master-data', 'tools'
];
requiredViews.forEach(view => {
  assert(workspace.includes(`data-view="${view}"`), `navigation is missing ${view}`);
});

assert(workspace.includes('./js/i18n.js'), 'workspace must import central i18n');
assert(workforce.includes('./js/i18n.js'), 'workforce must import central i18n');
assert(workspace.includes('data-language="th"') && workspace.includes('data-language="en"'), 'workspace language switcher is missing');
assert(workforce.includes('data-language="th"') && workforce.includes('data-language="en"'), 'workforce language switcher is missing');
assert(i18nSource.includes('โหมดตัวอย่าง UAT — ฟังก์ชันนี้ยังไม่เปิดใช้งาน'), 'Thai preview warning is missing');
assert(workforce.includes('PREVIEW_RULES'), 'feature-gated views must use the preview resolver');
assert(workforce.includes('previewView()'), 'preview UX shell is missing');
assert(!/Coming soon|coming soon|รอพัฒนา/.test(workspace + workforce), 'placeholder/coming-soon copy must not remain');

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
assert(workforce.includes('skeletonGrid'), 'loading skeleton is missing');
assert(workforce.includes('drawerBackdrop'), 'detail drawer is missing');

console.log('ux preview: pass');
