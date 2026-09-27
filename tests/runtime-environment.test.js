'use strict';
const assert=require('node:assert/strict');
const runtime=require('../apps-script/RuntimeEnvironment.js');

const productionScriptId=runtime.config.PRODUCTION.scriptId;
const stagingScriptId=runtime.config.STAGING.scriptId;
const productionSpreadsheetId=runtime.config.PRODUCTION.spreadsheetId;
const stagingSpreadsheetId=runtime.config.STAGING.spreadsheetId;

assert.equal(runtime.resolveEnvironment(stagingScriptId),'STAGING');
assert.equal(runtime.resolveEnvironment(productionScriptId),'PRODUCTION');
assert.equal(runtime.resolveEnvironment('client-supplied-or-unknown'),'UNKNOWN');

assert.equal(runtime.resolveSpreadsheetId(stagingScriptId,'STAGING',stagingSpreadsheetId),stagingSpreadsheetId);
assert.equal(runtime.resolveSpreadsheetId(productionScriptId,'PRODUCTION',productionSpreadsheetId),productionSpreadsheetId);
assert.throws(()=>runtime.resolveSpreadsheetId(stagingScriptId,'STAGING',productionSpreadsheetId),/safety check|cannot access/);
assert.throws(()=>runtime.resolveSpreadsheetId('unknown','',''),/UNKNOWN/);
assert.throws(()=>runtime.resolveSpreadsheetId(stagingScriptId,'PRODUCTION',stagingSpreadsheetId),/mismatch/);

assert.equal(runtime.resolveFeatureFlag(stagingScriptId,'WORKFORCE_V2_ENABLED','TRUE','FALSE'),true);
assert.equal(runtime.resolveFeatureFlag(productionScriptId,'WORKFORCE_V2_ENABLED','FALSE','FALSE'),false);
assert.equal(runtime.resolveFeatureFlag('unknown','WORKFORCE_V2_ENABLED','TRUE','TRUE'),false);
for(const key of ['RECRUITMENT_ENABLED','ACTIVITY_ENABLED','PERFORMANCE_ENABLED','OFFBOARDING_ENABLED','GCS_DOCUMENTS_ENABLED']){
  assert.equal(runtime.resolveFeatureFlag(stagingScriptId,key,'FALSE','FALSE'),false,key+' must remain false in STAGING');
  assert.equal(runtime.resolveFeatureFlag(productionScriptId,key,'FALSE','FALSE'),false,key+' must remain false in Production');
}

const forgedRequest={query:{staging:'1'},body:{environment:'STAGING'},headers:{'x-environment':'STAGING'}};
assert.equal(runtime.resolveEnvironment(productionScriptId,forgedRequest),'PRODUCTION','client data must not affect environment identity');
assert.equal(runtime.resolveFeatureFlag(productionScriptId,'WORKFORCE_V2_ENABLED','FALSE','FALSE',forgedRequest),false);

console.log('runtime environment tests: pass');
