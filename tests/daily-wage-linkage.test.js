'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const backend=fs.readFileSync('apps-script/รหัส.js','utf8');
const admin=fs.readFileSync('admin.html','utf8');
const operations=fs.readFileSync('apps-script/WorkforceOperationsV2.js','utf8');
new vm.Script(backend);
new vm.Script(operations);
for(const m of admin.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
function source(text,name){const start=text.indexOf('function '+name+'(');assert.ok(start>=0,name);const end=text.indexOf('\nfunction ',start+1);return text.slice(start,end<0?text.length:end);}
const rows=[Array(33).fill('')];rows[0][0]='E004';rows[0][1]='Test';rows[0][15]=470;rows[0][26]=0;
const writes=[];
const sheet={getLastRow:()=>2,getRange(row,col,count=1,width=1){return{
  getValues:()=>row===2?rows.map(r=>r.slice(col-1,col-1+width)):[],
  setValue(value){rows[row-2][col-1]=value;writes.push([row,col,value]);return this;},
  setValues(values){values.forEach((r,i)=>r.forEach((value,j)=>{rows[row-2+i][col-1+j]=value;writes.push([row+i,col+j,value]);}));return this;},
  setNumberFormat(){return this;},clearContent(){return this.setValue('');}
};}};
let invalidations=0;
const context=vm.createContext({Date,SPREADSHEET_ID:'test',EMPLOYEE_SHEET:'Employees',TZ:'Asia/Bangkok',
  requireAdmin_:()=>{},validateBranchV7_:()=>{},validateDepartmentV7_:()=>{},validateWageTypeV7_:()=>{},
  parseIsoDate_:value=>value?new Date(value):null,
  invalidateAdminSummary_:()=>{invalidations++;},
  adminGetEmployeeDetail_:()=>({dailyWage:rows[0][26],wageAmount:rows[0][15]}),
  SpreadsheetApp:{openById:()=>({getSheetByName:name=>{assert.equal(name,'Employees','payroll snapshots must never be written');return sheet;}})},
  wf2Headers_:()=>Array.from({length:33},(_,i)=>({0:'Employee ID',14:'Wage Type',15:'Wage Amount',26:'Daily Wage'}[i]||'Column '+i))
});
for(const name of ['linkedDailyWage_','linkedWageFields_','employeePayrollConfig_','adminUpdateEmployeeProfile'])new vm.Script(source(backend,name)).runInContext(context);
new vm.Script(source(operations,'wf2ApplyEmployeeField_')).runInContext(context);
assert.equal(context.linkedDailyWage_('',470,0),470);
assert.equal(context.linkedDailyWage_('DAILY',470,400),470);
assert.equal(context.linkedDailyWage_('DAILY',0,435),435,'legacy Payroll-only rates survive');
assert.equal(context.linkedDailyWage_('MONTHLY',15000,500),500,'do not treat monthly salary as a daily rate');
assert.equal(context.linkedDailyWage_('HOURLY',50,400),400);
assert.equal(context.linkedWageFields_({wageType:'DAILY',wageAmount:470}).dailyWage,470,'new hires must not start with Payroll wage zero');
assert.equal(context.employeePayrollConfig_({getSheetByName:()=>sheet},'E004').dailyWage,470);
context.adminUpdateEmployeeProfile('test','E004',{wageType:'DAILY',wageAmount:490,dailyWage:0});
assert.equal(rows[0][15],490);assert.equal(rows[0][26],490);assert.equal(invalidations,1);
context.adminUpdateEmployeeProfile('test','E004',{dailyWage:510});
assert.equal(rows[0][15],510);assert.equal(rows[0][26],510);
context.adminUpdateEmployeeProfile('test','E004',{nickname:'unchanged wage'});
assert.equal(rows[0][15],510);assert.equal(rows[0][26],510,'partial updates must preserve wages');
context.wf2ApplyEmployeeField_('E004','Wage Amount',520);
assert.equal(rows[0][15],520);assert.equal(rows[0][26],520);
context.wf2ApplyEmployeeField_('E004','Wage Amount',0);
assert.equal(rows[0][15],0);assert.equal(rows[0][26],0,'explicit zero must clear both fields');
assert.throws(()=>context.linkedWageFields_({wageAmount:-1}),/ค่าแรง/);
assert.throws(()=>context.linkedWageFields_({wageAmount:'invalid'}),/ค่าแรง/);
assert.match(backend,/PAYROLL_WAGE_REVISION/);
assert.match(admin,/document.addEventListener\('input',syncDailyWageInputs\)/);
const inputs={dWageType:{value:'DAILY'},dWageAmount:{value:'470'},dDailyWage:{value:'0'}};
context.$=id=>inputs[id];context.state={currentEmployee:{wageType:'DAILY'}};
new vm.Script(source(admin,'syncDailyWageInputs')).runInContext(context);
context.syncDailyWageInputs({target:{id:'dWageAmount'}});assert.equal(inputs.dDailyWage.value,'470');
inputs.dDailyWage.value='500';context.syncDailyWageInputs({target:{id:'dDailyWage'}});assert.equal(inputs.dWageAmount.value,'500');
inputs.dWageType.value='MONTHLY';inputs.dWageAmount.value='15000';context.syncDailyWageInputs({target:{id:'dWageAmount'}});assert.equal(inputs.dDailyWage.value,'500');
// Run the actual batch calculator with synthetic overnight attendance, not live payroll.
process.env.TZ='Asia/Bangkok';
context.Utilities={formatDate(d,tz,format){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const part=name=>parts.find(p=>p.type===name).value;
  if(format==='yyyy-MM-dd')return part('year')+'-'+part('month')+'-'+part('day');
  return new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
}};
for(const name of ['minutesOfDay_','dateAtTime_','wholeMinutesBetween_','roundMoney_','actionKindServer_','pairPayrollSessions_','classifyPayrollShift_','payrollBundleCalcEmployeeV7_'])new vm.Script(source(backend,name)).runInContext(context);
const events=[];
for(let day=1;day<=3;day++){
  events.push({action:'IN',timestamp:new Date(2026,9,day,20,0)});
  events.push({action:'OUT',timestamp:new Date(2026,9,day+1,9,0)});
}
const result=context.payrollBundleCalcEmployeeV7_({id:'E004',wageType:'',wageAmount:470,dailyWage:0},new Date(2026,9,1),new Date(2026,9,3),'2026-10-01','2026-10-03','','test',{
  eventsByEmployee:{E004:events},leavesByEmployee:{},itemsByEmployee:{},adjustmentsByEmployee:{}
});
assert.equal(result.employee.dailyWage,470);
assert.equal(result.totals.workedDays,3);
assert.equal(result.totals.baseWage,1410);
assert.equal(result.totals.nightShifts,3);
assert.equal(result.totals.nightAllowance,195,'existing night shift allowance stays unchanged');
assert.equal(result.totals.otPay,176.25,'existing daily/12 * 1.5 OT formula must use the linked rate');
rows[0][14]='';rows[0][15]=470;rows[0][26]=0;
context.attendanceEventsForPayroll_=()=>events;
context.employeePayItems_=()=>[];
context.payrollAdjustments_=()=>[];
context.approvedLeavesForRange_=()=>[];
for(const name of ['payrollPeriodKey_','adminGetPayrollPreview_'])new vm.Script(source(backend,name)).runInContext(context);
const individual=context.adminGetPayrollPreview_('test','E004','2026-10-01','2026-10-03','');
assert.equal(individual.employee.dailyWage,470);
assert.equal(individual.totals.baseWage,result.totals.baseWage,'employee and dashboard previews must agree');
assert.equal(individual.totals.otPay,result.totals.otPay);
console.log('daily wage linkage tests: pass');
