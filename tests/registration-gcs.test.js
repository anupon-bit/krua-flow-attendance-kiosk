'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const register = fs.readFileSync('register.html', 'utf8');
const admin = fs.readFileSync('admin.html', 'utf8');
const workforce = fs.readFileSync('apps-script/WorkforceV2.js', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const runtime = fs.readFileSync('apps-script/RuntimeEnvironment.js', 'utf8');
const setup = fs.readFileSync('docs/GCS_FILE_SERVICE_SETUP.md', 'utf8');

assert.match(register, /op:'documentCreateUploadSession'/);
assert.match(register, /method:'PUT'/);
assert.match(register, /body:d\.file/);
assert.match(register, /op:'documentFinalizeUpload'/);
assert.match(register, /registrationUploadToken/);
assert.match(register, /submissionKey:uid\(\)/);
assert.match(register, /submissionKey:state\.submissionKey/);
assert.match(register, /get\('staging'\)==='1'/);
assert.match(register, /isStaging\?'STAGING_API_URL':'API_URL'/);
assert.match(register, /state\.registrationId\)\{/);
assert.match(register, /ลองใหม่/);
assert.match(register, /DOCUMENT_MAX_BYTES=10\*1024\*1024/);
assert.doesNotMatch(register, /employeeRegistrationUploadDocument/);
assert.doesNotMatch(register, /readAsDataURL|FileReader|dataUrl:/);

assert.match(backend, /registrationUploadToken:registrationUploadToken/);
assert.match(backend, /REGISTRATION_SUBMIT_/);
assert.match(backend, /LockService\.getScriptLock\(\)/);
assert.match(workforce, /WF2_REGISTRATION_UPLOAD_/);
assert.match(workforce, /registrationActor\?'REGISTRATION'/);
assert.match(workforce, /wf2BuildObjectKey_\(ownerType,ownerId,documentId,name\)/);
assert.match(backend, /wf2DocumentRowsForOwner_\(rid,''\)/);

assert.match(admin, /op:'documentGetViewUrl'/);
assert.match(admin, /ADMIN_STAGING\?'STAGING_API_URL':'API_URL'/);
assert.match(admin, /kruaFlowAdminTokenPersistentStagingV1/);
assert.match(admin, /isGcsDocument/);
assert.match(admin, /fetchAdminFile\('adminGetDocument'/);
assert.match(admin, /adminGetFileChunk/);
assert.match(admin, /ดาวน์โหลด/);

assert.match(runtime, /GCS_DOCUMENTS_ENABLED:'FALSE'/);
assert.match(setup, /--public-access-prevention/);
assert.match(setup, /roles\/storage\.objectCreator/);
assert.match(setup, /roles\/storage\.objectViewer/);
assert.match(setup, /Do \*\*not\*\* set `GCS_DOCUMENTS_ENABLED=TRUE` yet/);

console.log('registration GCS integration tests: pass');
