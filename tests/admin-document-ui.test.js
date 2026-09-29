'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const workforce = fs.readFileSync('workforce.html', 'utf8');
const css = fs.readFileSync('css/registration-mobile.css', 'utf8');
const admin = fs.readFileSync('admin.html', 'utf8');
const start = workforce.indexOf('function registrationDocumentPriority');
const end = workforce.indexOf('function registrationDetailSection', start);
assert.ok(start >= 0 && end > start, 'document grouping helpers missing');

const sandbox = {};
vm.runInNewContext(workforce.slice(start, end) + '\nthis.groupRegistrationDocuments=groupRegistrationDocuments;this.registrationDocumentStateFromCurrent=registrationDocumentStateFromCurrent;', sandbox);

const types = [
  { type:'ID_CARD', required:true },
  { type:'HOUSE_REGISTRATION', required:true },
  { type:'EDUCATION', required:false },
  { type:'OTHER', required:false },
  { type:'EMPLOYEE_PHOTO', required:true }
];
const documents = [
  { documentId:'ID-PENDING-NEW', type:'ID_CARD', status:'PENDING_UPLOAD', fileName:'id-retry.jpg' },
  { documentId:'ID-ACTIVE-NEW', type:'ID_CARD', status:'ACTIVE', uploadedAt:'2026-09-27T12:00:00Z', fileName:'id-active.jpg' },
  { documentId:'ID-VERIFIED-OLD', type:'ID_CARD', status:'VERIFIED', verifiedAt:'2026-09-26T12:00:00Z', fileName:'id-verified.jpg' },
  { documentId:'HOUSE-PENDING', type:'HOUSE_REGISTRATION', status:'PENDING_UPLOAD', fileName:'house-retry.pdf' },
  { documentId:'HOUSE-ACTIVE', type:'HOUSE_REGISTRATION', status:'ACTIVE', uploadedAt:'2026-09-27T11:00:00Z', fileName:'house.pdf' },
  { documentId:'PHOTO-VERIFIED', type:'EMPLOYEE_PHOTO', status:'VERIFIED', verifiedAt:'2026-09-27T10:00:00Z', fileName:'photo.jpg' }
];

const groups = sandbox.groupRegistrationDocuments(documents, types);
const idCard = groups.find(group => group.spec.type === 'ID_CARD');
const house = groups.find(group => group.spec.type === 'HOUSE_REGISTRATION');
assert.equal(idCard.current.documentId, 'ID-VERIFIED-OLD', 'VERIFIED must win over newer ACTIVE/PENDING');
assert.equal(idCard.history.length, 2);
assert.deepEqual(Array.from(idCard.history, row => row.documentId), ['ID-PENDING-NEW','ID-ACTIVE-NEW']);
assert.equal(house.current.documentId, 'HOUSE-ACTIVE', 'ACTIVE must win over stale PENDING');
assert.equal(sandbox.registrationDocumentStateFromCurrent(groups).status, 'COMPLETE', 'stale PENDING must not make complete required documents incomplete');

const verified = sandbox.groupRegistrationDocuments([
  { documentId:'VERIFIED-OLD', type:'ID_CARD', status:'VERIFIED', verifiedAt:'2026-09-26T10:00:00Z' },
  { documentId:'VERIFIED-NEW', type:'ID_CARD', status:'VERIFIED', verifiedAt:'2026-09-27T10:00:00Z' }
], [types[0]])[0];
assert.equal(verified.current.documentId, 'VERIFIED-NEW', 'latest VERIFIED must be current');

const pending = sandbox.groupRegistrationDocuments([
  { documentId:'PENDING-NEW', type:'ID_CARD', status:'PENDING_UPLOAD' },
  { documentId:'PENDING-OLD', type:'ID_CARD', status:'PENDING_UPLOAD' }
], [types[0]])[0];
assert.equal(pending.current.documentId, 'PENDING-NEW', 'newest API row must be fallback current when no ready document exists');

const missing = sandbox.groupRegistrationDocuments([], types);
assert.equal(sandbox.registrationDocumentStateFromCurrent(missing).status, 'INCOMPLETE');
const issue = sandbox.groupRegistrationDocuments([
  { documentId:'FAILED-ID', type:'ID_CARD', status:'FAILED' }
], types);
assert.equal(sandbox.registrationDocumentStateFromCurrent(issue).status, 'ISSUE');

assert.match(workforce, /Current document/);
assert.match(workforce, /<details class="registrationDocumentHistory"><summary>ประวัติการอัปโหลด \(/);
assert.doesNotMatch(workforce, /<details class="registrationDocumentHistory"\s+open/);
assert.match(workforce, /registrationDocumentBadge\(currentDocumentState\)/);
assert.match(workforce, /documentGetViewUrl/);
assert.match(css, /\.registrationDocumentHistory/);
assert.match(css, /\.registrationHistoryItem/);

assert.doesNotMatch(admin, /id="overviewDocuments"|renderOverviewDocumentStatus/, 'document status must not be duplicated in employee overview');
assert.match(admin, /id="requiredDocumentList"/, 'required documents must have a dedicated group');
assert.match(admin, /id="additionalDocumentList"/, 'additional documents must have a dedicated group');
assert.match(admin, /id="additionalDocumentsGroup"/, 'additional documents group must be connected to its renderer');
assert.doesNotMatch(admin, /เอกสารการลา \/ เอกสารประกอบ/, 'documents page must not show the unsupported leave-attachment placeholder');
assert.doesNotMatch(admin, /renderEmployeeDetail\(Object\.assign\(\{\},stub,detail\)\);return loadEmployeeDocuments/, 'employee overview must not load documents before the documents tab is opened');

console.log('admin document UI tests: pass');
