'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');

const root=fs.readFileSync('apps-script/รหัส.js','utf8');
const router=fs.readFileSync('apps-script/WorkforceV2.js','utf8');
const modules=['WorkforceV2.js','WorkforceOperationsV2.js','WorkforcePerformanceV2.js','WorkforceAttendanceV2.js','WorkforceReportsV2.js'].map(x=>fs.readFileSync('apps-script/'+x,'utf8')).join('\n');
const operations=[...router.matchAll(/if\(op==='([^']+)'\) return ([A-Za-z0-9_]+)\(payload\)/g)].map(x=>({op:x[1],handler:x[2]}));
const seen=new Set();
for(const route of operations){assert.equal(seen.has(route.op),false,'duplicate route '+route.op);seen.add(route.op);assert.match(modules,new RegExp('function\\s+'+route.handler.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\('),'missing handler '+route.handler)}

for(const legacy of ['adminLogin','adminDashboard','adminGetEmployee','recordAttendance','leaveSubmit','adminGetPayrollPreview'])assert.match(root,new RegExp("op === '"+legacy+"'"),'legacy API missing: '+legacy);
for(const required of ['Persons','Applicants','Applicant_Interviews','Offers','Documents','Activity_Reports','Activity_Items','KPI_Definitions','Employee_Exits','Work_Queue','Payroll_Periods'])assert.match(router,new RegExp(required.replace('_','[_ ]')),'schema missing: '+required);
for(const preflight of ['settings','seeds','legacyRowCounts','deleteOperations','legacyRowOverwriteOperations'])assert.match(router,new RegExp(preflight),'migration preflight missing: '+preflight);
assert.match(router,/if\(apply&&enabledFlags\.length\)throw new Error/,'migration must stop before apply when a feature flag is enabled');
assert.doesNotMatch(modules,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/);
assert.doesNotMatch(modules,/FILE_SERVICE_AUTH_TOKEN\s*=\s*['"][^'"]+['"]/);
console.log('api contract tests: pass ('+operations.length+' Workforce V2 routes)');
