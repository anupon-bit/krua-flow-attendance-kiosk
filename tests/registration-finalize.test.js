'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('register.html', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const workforce = fs.readFileSync('apps-script/WorkforceV2.js', 'utf8');

assert.match(page, /function requiredUploadsReady\(\)/);
assert.match(page, /async function finalizeRegistrationSubmission\(\)/);
assert.match(page, /String\(result\.status\|\|''\)\.toUpperCase\(\)!=='PENDING'/);
assert.match(page, /await uploadSingleDocument\(d\);uploaded=true;if\(requiredUploadsReady\(\)\)[\s\S]*?await finalizeRegistrationSubmission\(\);showRegistrationSuccess/);
assert.match(page, /await finalizeRegistrationSubmission\(\);showRegistrationSuccess\(docs\.failed\)/);
assert.doesNotMatch(page, /showRegistrationSuccess\([^)]*\);[\s\S]{0,120}await finalizeRegistrationSubmission/);
assert.match(page, /submissionKey:state\.submissionKey/);

const finalize = backend.match(/function finalizeEmployeeRegistration_\(registrationId\) \{[\s\S]*?\n\}/);
assert.ok(finalize, 'registration finalize function must exist');
assert.match(finalize[0], /LockService\.getScriptLock\(\)/);
assert.match(finalize[0], /assertRegistrationRequiredDocuments_\(rid\)/);
assert.match(finalize[0], /if\(status==='DRAFT'\)/);
assert.match(finalize[0], /setValue\('PENDING'\)/);
assert.match(finalize[0], /SpreadsheetApp\.flush\(\)/);
assert.match(finalize[0], /previousStatus:status,status:'PENDING'/);

const requiredState = backend.match(/function registrationRequiredDocumentState_\(registrationId\) \{[\s\S]*?\n\}/);
assert.ok(requiredState, 'required document state must exist');
assert.match(requiredState[0], /\['ACTIVE','VERIFIED'\]/);
assert.doesNotMatch(requiredState[0], /\['ACTIVE','VERIFIED','PENDING_UPLOAD'\]/);

const documentFinalize = workforce.match(/function wf2DocumentFinalizeUpload_\(payload\) \{[\s\S]*?\n\}/);
assert.ok(documentFinalize, 'document finalize function must exist');
assert.match(documentFinalize[0], /\['ACTIVE','VERIFIED'\][\s\S]*?return\{ok:true/);
assert.match(documentFinalize[0], /old\._row<row\._row/);
assert.match(documentFinalize[0], /'PENDING_UPLOAD','ACTIVE','VERIFIED'/);
assert.match(documentFinalize[0], /'Status':'REPLACED'/);

console.log('registration finalize tests: pass');
