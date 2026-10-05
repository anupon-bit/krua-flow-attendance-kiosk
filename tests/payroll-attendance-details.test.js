'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const backend=fs.readFileSync('apps-script/รหัส.js','utf8'),dashboard=fs.readFileSync('dashboard.html','utf8'),details=fs.readFileSync('payroll-attendance.html','utf8');
function source(text,name){const start=text.indexOf('function '+name+'(');assert.ok(start>=0,name);const end=text.indexOf('\nfunction ',start+1);return text.slice(start,end<0?text.length:end);}
for(const page of [dashboard,details])for(const m of page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
assert.match(dashboard,/target="_blank" rel="noopener" href="'\+payrollAttendanceUrl\(e.id\)/);
assert.match(details,/op:'adminGetPayrollPreview'/);
assert.doesNotMatch(details,/op:'admin(?:Finalize|MarkPayroll|SendPayroll)/,'details must be read-only');
const linkContext=vm.createContext({URLSearchParams,state:{start:'2026-10-01',end:'2026-10-04',payDate:'2026-10-06'}});
new vm.Script(source(dashboard,'payrollAttendanceUrl')).runInContext(linkContext);
const link=new URL(linkContext.payrollAttendanceUrl('E009'),'https://example.test/');
assert.equal(link.searchParams.get('employeeId'),'E009');assert.equal(link.searchParams.get('startDate'),'2026-10-01');assert.equal(link.searchParams.get('endDate'),'2026-10-04');
// Grouped imports are not date sorted: a newer scan appears between employee groups.
function row(id,date,action,hour){const r=Array(19).fill('');r[0]=id+'-'+date+'-'+action;r[1]=new Date(date+'T'+hour+':00:00Z');r[2]=date;r[4]=id;r[6]=action;return r;}
const rows=[row('E004','2026-10-01','IN','13'),row('E004','2026-10-20','IN','13'),row('E009','2026-10-02','IN','01'),row('E009','2026-10-02','OUT','13')];
const sheet={getLastRow:()=>rows.length+1,getLastColumn:()=>19,getRange(start,col,count,width){return{getValues:()=>rows.slice(start-2,start-2+count).map(r=>r.slice(col-1,col-1+width))}}};
const context=vm.createContext({Date,TZ:'UTC',ATTENDANCE_SHEET:'Attendance',LEAVE_SHEET:'Leave',EMPLOYEE_PAY_ITEMS_SHEET:'Items',PAYROLL_ADJUSTMENTS_SHEET:'Adjustments',PAYROLL_SNAPSHOTS_SHEET:'Snapshots',
  parseIsoDate_:v=>new Date(v+'T00:00:00Z'),attendanceDateKey_:v=>String(v||''),toClientText_:v=>String(v||''),formatTimeForClient_:v=>String(v||''),Utilities:{formatDate:d=>d.toISOString().slice(0,10)}
});
const ss={getSheetByName:name=>name==='Attendance'?sheet:null};
for(const name of ['attendanceEventsForPayroll_','payrollBundleReadDataV7_'])new vm.Script(source(backend,name)).runInContext(context);
assert.equal(context.attendanceEventsForPayroll_(ss,'E009','2026-10-01','2026-10-04').length,2,'individual detail must find later E009 rows');
const input=context.payrollBundleReadDataV7_(ss,'2026-10-01','2026-10-04','test');
assert.equal(input.eventsByEmployee.E009.length,2,'batch payroll must find the same E009 scans');
assert.equal(input.eventsByEmployee.E004.length,1,'outside-period scans between matching rows must be excluded');
assert.equal(context.attendanceEventsForPayroll_(ss,'E009','2026-09-24','2026-09-30').length,0,'October scans must not inflate September payroll');
console.log('payroll attendance details tests: pass');
