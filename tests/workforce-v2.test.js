'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../apps-script/WorkforceV2.js');
const performance=require('../apps-script/WorkforcePerformanceV2.js');
const reports=require('../apps-script/WorkforceReportsV2.js');

assert.equal(core.normalizePhone('+66 81-234-5678'),'0812345678');
assert.equal(core.normalizePhone('081 234 5678'),'0812345678');
assert.equal(core.normalizePhone('0812345678'),'0812345678');
assert.equal(typeof core.normalizePhone('0812345678'),'string');
assert.equal(core.normalizePhone('0000000001'),'0000000001');
assert.equal(typeof core.normalizePhone('0000000001'),'string');
assert.equal(core.phoneText('0000000001'),'0000000001');
assert.deepEqual(core.personPhoneFields('000-000-0001'),{'Phone':'000-000-0001','Phone Normalized':'0000000001'});
assert.deepEqual(core.coercePhoneTextValues(
  ['Person ID','Phone','Phone Normalized'],
  ['P000003','0000000001','0000000001']
),['P000003','0000000001','0000000001']);
assert.equal(typeof core.coercePhoneTextValues(['Phone'],['0000000001'])[0],'string');
assert.equal(core.canTransition('SUBMITTED','SCREENING'),true);
assert.equal(core.canTransition('SUBMITTED','HIRED'),false);
assert.equal(core.canTransition('OFFER_SENT','OFFER_ACCEPTED'),true);
assert.equal(core.ratio(8,10),80);
assert.equal(core.ratio(1,0),null);
assert.equal(core.safeFileName(' สำเนา บัตรประชาชน.pdf '),'pdf');
assert.equal(core.buildObjectKey('EMPLOYEE','E002','DOC-ABC123','id card.pdf'),'employees/E002/documents/DOC-ABC123/id-card.pdf');
assert.throws(()=>core.buildObjectKey('EMPLOYEE','../E002','DOC-1','a.pdf'),/Document owner/);
assert.deepEqual(core.validateWeights([{weight:20},{weight:80}]),{valid:true,total:100});
assert.deepEqual(core.validateWeights([{weight:20},{weight:70}]),{valid:false,total:90});
assert.equal(performance.scoreMetric(95,90,'HIGHER_IS_BETTER'),100);
assert.equal(performance.scoreMetric(4,5,'LOWER_IS_BETTER'),100);
assert.equal(performance.scoreMetric(1,0,'LOWER_IS_BETTER'),0);
assert.equal(performance.scoreMetric(null,90,'HIGHER_IS_BETTER'),null);
assert.equal(reports.passedApplicantCount([
  {'Applicant ID':'A1','Result':'PASSED'},
  {'Applicant ID':'A1','Result':'PASSED'},
  {'Applicant ID':'A2','Result':'REJECTED'},
  {'Applicant ID':'A3','Result':'PASSED'}
]),2);
const scoped=reports.scopedExits([
  {'Employee ID':'E1','Status':'EXITED','Last Working Date':'2026-01-15'},
  {'Employee ID':'E2','Status':'EXITED','Last Working Date':'2026-01-20'},
  {'Employee ID':'E1','Status':'NOTICE_PERIOD','Last Working Date':'2026-01-25'},
  {'Employee ID':'E1','Status':'EXITED','Last Working Date':'2025-12-31'}
],new Set(['E1']),'2026-01-01','2026-01-31',value=>String(value));
assert.equal(scoped.length,1);
assert.equal(scoped[0]['Employee ID'],'E1');
const preview=core.buildBackfillPreview({
  employees:[
    {'Employee ID':'TEST001','Person ID':'','Phone':''},
    {'Employee ID':'TEST002','Person ID':'','Phone':''},
    {'Employee ID':'E001','Person ID':'','Phone':'0000000001'},
    {'Employee ID':'E002','Person ID':'','Phone':'0000000002'}
  ],
  registrations:[
    {'Registration ID':'R1','Employee ID':'E001','Person ID':'','Phone':'0000000001'},
    {'Registration ID':'R2','Employee ID':'E002','Person ID':'','Phone':'0000000002'}
  ],
  persons:[]
});
assert.deepEqual(preview.expected,{personsCreated:4,employeesLinked:4,registrationsLinked:2,legacyCellsUpdated:6,uniqueEmployeePersonTargets:4,applicantsCreated:0,attendanceModifications:0,leaveModifications:0,payrollModifications:0});
assert.equal(preview.duplicateIdentityWarnings.length,0);
assert.deepEqual(preview.employees.find(row=>row.employeeId==='E001').plannedRegistrationReuse,['R1']);
assert.equal(preview.registrations.find(row=>row.registrationId==='R2').plannedEmployeePersonReuse,true);
const duplicatePreview=core.buildBackfillPreview({employees:[{'Employee ID':'E1','Phone':'0999'},{'Employee ID':'E2','Phone':'0999'}],registrations:[],persons:[]});
assert.equal(duplicatePreview.duplicateIdentityWarnings[0].type,'DUPLICATE_PHONE');

function functionBody(source,name,nextName){
  const start=source.indexOf('function '+name+'('),end=source.indexOf('function '+nextName+'(',start+1);
  assert.ok(start>=0&&end>start,'missing function '+name);
  return source.slice(start,end);
}
function assertFormatsPhoneBeforeWrite(body,label,formatMarker){
  const format=body.indexOf(formatMarker||"setNumberFormat('@')"),write=body.indexOf('setValues(');
  assert.ok(format>=0&&write>=0&&format<write,label+' must format phone as text before writing');
}
const workforceSource=fs.readFileSync(path.join(__dirname,'../apps-script/WorkforceV2.js'),'utf8');
const legacySource=fs.readFileSync(path.join(__dirname,'../apps-script/รหัส.js'),'utf8');
assertFormatsPhoneBeforeWrite(functionBody(workforceSource,'wf2Append_','wf2UpdateRow_'),'Workforce append','wf2FormatPhoneTextColumns_');
assertFormatsPhoneBeforeWrite(functionBody(workforceSource,'wf2UpdateRow_','wf2PhoneText_'),'Workforce update','wf2FormatPhoneTextColumns_');
assert.match(functionBody(workforceSource,'wf2BackfillLegacyPeople_','wf2DuplicateCandidates_'),/wf2PersonPhoneFields_/,'backfill must use string-safe Person phone fields');
assertFormatsPhoneBeforeWrite(functionBody(legacySource,'adminApproveRegistrationFast_','adminGetDashboard'),'fast approval');
assertFormatsPhoneBeforeWrite(functionBody(legacySource,'adminAddEmployee','adminSetEmployeeActive'),'employee create');
assertFormatsPhoneBeforeWrite(functionBody(legacySource,'submitEmployeeRegistration_','getEmployeeRegistrationsAdmin_'),'registration create');
assertFormatsPhoneBeforeWrite(functionBody(legacySource,'adminUpdateRegistration','adminApproveRegistration'),'registration update');
assertFormatsPhoneBeforeWrite(functionBody(legacySource,'adminApproveRegistration','adminRejectRegistration'),'registration approval');
console.log('workforce-v2 tests: pass');
