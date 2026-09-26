// Server-side environment isolation for KruaFlow deployments.
// Environment authority is the Apps Script project ID only. Request data is never consulted.

const KRUAFLOW_RUNTIME_CONFIG_ = Object.freeze({
  PRODUCTION: Object.freeze({
    scriptId:'1eM39zi8GKiFf0zpkua8qFaCWE9DEdmEN_sbx3-hutSbL1m6ou0FYNvWf',
    spreadsheetId:'13Nsy0aSkAm-Qg7vCHj_vtEOArwtghFp-XhlYihyQTgU'
  }),
  STAGING: Object.freeze({
    scriptId:'1zhBcE_dikcfySP8L4RoN6LphYy2yPgQqtcCN7uSJaPGmiZEKyqAAh7d9',
    spreadsheetId:'1k6FV6wgkiSIry_Kr45pRDkc-knrX4MBShikdr--g4Bw'
  })
});

function resolveRuntimeEnvironmentForScriptId_(scriptId) {
  const value=String(scriptId||'');
  if(value===KRUAFLOW_RUNTIME_CONFIG_.PRODUCTION.scriptId)return'PRODUCTION';
  if(value===KRUAFLOW_RUNTIME_CONFIG_.STAGING.scriptId)return'STAGING';
  return'UNKNOWN';
}

function getRuntimeEnvironment() {
  return resolveRuntimeEnvironmentForScriptId_(ScriptApp.getScriptId());
}

function resolveBackendSpreadsheetIdFor_(scriptId,declaredEnvironment,configuredSpreadsheetId) {
  const environment=resolveRuntimeEnvironmentForScriptId_(scriptId);
  if(environment==='UNKNOWN')throw new Error('Runtime environment UNKNOWN: backend access denied');
  const declared=String(declaredEnvironment||'').trim().toUpperCase();
  if(declared&&declared!==environment)throw new Error('Runtime environment property mismatch: backend access denied');
  const expected=KRUAFLOW_RUNTIME_CONFIG_[environment].spreadsheetId;
  const configured=String(configuredSpreadsheetId||'').trim();
  if(configured&&configured!==expected)throw new Error('Backend spreadsheet safety check failed for '+environment);
  if(environment==='STAGING'&&configured===KRUAFLOW_RUNTIME_CONFIG_.PRODUCTION.spreadsheetId)throw new Error('STAGING cannot access the Production spreadsheet');
  return configured||expected;
}

function getBackendSpreadsheetId_() {
  const props=PropertiesService.getScriptProperties();
  return resolveBackendSpreadsheetIdFor_(
    ScriptApp.getScriptId(),
    props.getProperty('ENVIRONMENT'),
    props.getProperty('BACKEND_SPREADSHEET_ID')
  );
}

function runtimeBoolean_(value) {
  return /^(1|true|yes|on)$/i.test(String(value===null||value===undefined?'':value));
}

function resolveEffectiveFeatureFlagFor_(scriptId,key,propertyValue,sharedSettingValue) {
  const environment=resolveRuntimeEnvironmentForScriptId_(scriptId);
  if(environment==='UNKNOWN')return false;
  const configured=propertyValue!==null&&propertyValue!==undefined&&String(propertyValue)!=='';
  return runtimeBoolean_(configured?propertyValue:sharedSettingValue);
}

function configureStagingEnvironment() {
  if(getRuntimeEnvironment()!=='STAGING')throw new Error('STAGING configuration can run only in the allowlisted STAGING project');
  const props=PropertiesService.getScriptProperties();
  props.setProperties({
    ENVIRONMENT:'STAGING',
    BACKEND_SPREADSHEET_ID:KRUAFLOW_RUNTIME_CONFIG_.STAGING.spreadsheetId,
    WORKFORCE_V2_ENABLED:'TRUE',
    RECRUITMENT_ENABLED:'FALSE',
    ACTIVITY_ENABLED:'FALSE',
    PERFORMANCE_ENABLED:'FALSE',
    OFFBOARDING_ENABLED:'FALSE',
    GCS_DOCUMENTS_ENABLED:'FALSE'
  },false);
  return getRuntimeIsolationStatus();
}

function getRuntimeIsolationStatus() {
  const scriptId=ScriptApp.getScriptId(),environment=getRuntimeEnvironment(),props=PropertiesService.getScriptProperties();
  const spreadsheetId=getBackendSpreadsheetId_(),flags={};
  ['WORKFORCE_V2_ENABLED','RECRUITMENT_ENABLED','ACTIVITY_ENABLED','PERFORMANCE_ENABLED','OFFBOARDING_ENABLED','GCS_DOCUMENTS_ENABLED'].forEach(key=>{
    flags[key]=resolveEffectiveFeatureFlagFor_(scriptId,key,props.getProperty(key),'FALSE');
  });
  return{scriptId:scriptId,environment:environment,spreadsheetId:spreadsheetId,flags:flags};
}

if(typeof module!=='undefined'&&module.exports)module.exports={
  config:KRUAFLOW_RUNTIME_CONFIG_,
  resolveEnvironment:resolveRuntimeEnvironmentForScriptId_,
  resolveSpreadsheetId:resolveBackendSpreadsheetIdFor_,
  resolveFeatureFlag:resolveEffectiveFeatureFlagFor_
};
