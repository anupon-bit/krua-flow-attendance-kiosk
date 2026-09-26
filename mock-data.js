(function(){
  const q=new URLSearchParams(location.search),enabled=q.get('mock')==='1'||localStorage.getItem('kruaFlowMockModeV7')==='1';
  if(q.get('mock')==='1') localStorage.setItem('kruaFlowMockModeV7','1');
  if(q.get('mock')==='0') localStorage.removeItem('kruaFlowMockModeV7');
  function iso(d){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())}
  function plus(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function monday(d){const x=new Date(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x}
  const today=new Date(),thisMon=monday(today),nextMon=plus(thisMon,7);
  const branches=[{code:'KORAT',name:'นครราชสีมา',shortName:'โคราช',active:true,sort:1,address:'อ.เมือง จ.นครราชสีมา',phone:'',timezone:'Asia/Bangkok'},{code:'UDOMSUK',name:'อุดมสุข',shortName:'อุดมสุข',active:true,sort:2,address:'บางนา–อุดมสุข กรุงเทพฯ',phone:'',timezone:'Asia/Bangkok'}];
  const departments=[{code:'KITCHEN',name:'ผลิต / ครัว',shortName:'ครัว',active:true,sort:1,color:'#2d73df'},{code:'OFFICE',name:'สำนักงาน',shortName:'สำนักงาน',active:true,sort:2,color:'#15965c'}];
  const shifts=[{code:'DAY',name:'กะกลางวัน',startTime:'08:00',endTime:'20:00',crossMidnight:false,standardHours:12,nightAllowance:0,minStaffing:4,lateGraceMinutes:5,lateDeduction:100,active:true},{code:'NIGHT',name:'กะกลางคืน',startTime:'20:00',endTime:'08:00',crossMidnight:true,standardHours:12,nightAllowance:65,minStaffing:3,lateGraceMinutes:5,lateDeduction:100,active:true}];
  const employees=[
    {id:'E001',name:'สมชาย ใจดี',firstName:'สมชาย',lastName:'ใจดี',nickname:'ชาย',phone:'0812345678',branch:'KORAT',department:'KITCHEN',position:'MANAGER',accessRole:'MANAGER',active:true,registeredAddress:'นครราชสีมา',currentAddress:'นครราชสีมา',emergencyName:'สมศรี',emergencyPhone:'0891111111',bankName:'ธนาคารกสิกรไทย',bankAccountMasked:'xxx-x-1234-x',bankAccountName:'สมชาย ใจดี',birthDate:'1990-05-12'},
    {id:'E002',name:'มาลี สดใส',nickname:'มาลี',branch:'KORAT',department:'KITCHEN',position:'STAFF',active:true},
    {id:'E003',name:'นที ตั้งใจ',nickname:'นที',branch:'KORAT',department:'KITCHEN',position:'STAFF',active:true},
    {id:'E004',name:'อรทัย ขยัน',nickname:'อร',branch:'KORAT',department:'KITCHEN',position:'STAFF',active:true},
    {id:'E005',name:'วิทยา พร้อม',nickname:'วิทย์',branch:'KORAT',department:'KITCHEN',position:'STAFF',active:true},
    {id:'E006',name:'สุรีย์ งานดี',nickname:'รีย์',branch:'UDOMSUK',department:'KITCHEN',position:'STAFF',active:true}
  ];
  const scopes=[{scopeId:'SCP-001',employeeId:'E001',branchCode:'KORAT',departmentCode:'KITCHEN',canApproveLeave:true,canManageSchedule:true,canViewAttendance:true,active:true},{scopeId:'SCP-002',employeeId:'E001',branchCode:'UDOMSUK',departmentCode:'KITCHEN',canApproveLeave:true,canManageSchedule:true,canViewAttendance:true,active:true}];
  const quotas=[{ruleId:'Q-001',branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:'DAY',maxOff:1,minStaffing:4,minLeadDays:2,blackout:false,active:true,priority:10},{ruleId:'Q-002',branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:'NIGHT',maxOff:1,minStaffing:3,minLeadDays:2,blackout:false,active:true,priority:10}];
  const leaveRows=[
    {leaveId:'LEV-001',employeeId:'E003',employeeName:'นที ตั้งใจ',nickname:'นที',leaveType:'REQUEST_OFF',leaveTypeLabel:'ขอเลือกวันหยุด',startDate:iso(plus(nextMon,2)),endDate:iso(plus(nextMon,2)),duration:'FULL_DAY',reason:'ธุระส่วนตัว',status:'PENDING',branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:'DAY',quotaStatus:'RESERVED',scheduleConflict:''},
    {leaveId:'LEV-002',employeeId:'E004',employeeName:'อรทัย ขยัน',nickname:'อร',leaveType:'WEEKLY_OFF',leaveTypeLabel:'ขอหยุดประจำสัปดาห์',startDate:iso(plus(nextMon,4)),endDate:iso(plus(nextMon,4)),duration:'FULL_DAY',reason:'นัดหมายครอบครัว',status:'APPROVED',branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:'DAY',quotaStatus:'FULL',scheduleConflict:''}
  ];
  const corrections=[{correctionId:'COR-001',employeeId:'E002',date:iso(plus(today,-1)),correctionType:'ADD_OUT',requestedIn:'',requestedOut:'20:07',reason:'ลืมกดออก',status:'PENDING',branchCode:'KORAT',departmentCode:'KITCHEN'}];
  const swaps=[{swapId:'SWP-001',requesterId:'E002',targetEmployeeId:'E005',date:iso(plus(nextMon,5)),requesterShift:'DAY',targetShift:'NIGHT',status:'PENDING_MANAGER',reason:'ติดธุระช่วงกลางวัน',branchCode:'KORAT',departmentCode:'KITCHEN'}];
  const daily=[{checkId:'CHK-001',checkType:'START',date:iso(today),branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:'DAY',expectedCount:5,leaveCount:1,requiredCount:4,presentCount:3,lateCount:1,missingCount:1,unplannedCount:1,minimumStaffing:4,status:'ACTION_REQUIRED',createdAt:'08:25',detail:{missing:[{employeeId:'E005',name:'วิทยา พร้อม'}],late:[{employeeId:'E003',name:'นที ตั้งใจ',time:'08:11'}],unplanned:[{employeeId:'E006',name:'สุรีย์ งานดี',time:'08:09'}]}}];
  const notifications=[{notificationId:'N-001',title:'ตารางงานสัปดาห์หน้า',message:'ผู้จัดการประกาศตารางงานสัปดาห์หน้าแล้ว',severity:'INFO',status:'UNREAD',createdAt:'วันนี้ 09:10'},{notificationId:'N-002',title:'คำขอหยุด',message:'คำขอหยุดของคุณวันที่ '+iso(plus(nextMon,4))+' ได้รับอนุมัติแล้ว',severity:'SUCCESS',status:'READ',createdAt:'เมื่อวาน 18:20'}];
  const mockApplicants=[{applicantId:'APP-MOCK-001',personId:'P000101',name:'กมล งานดี',nickname:'มล',phone:'0811111111',positionCode:'STAFF',branchCode:'KORAT',departmentCode:'KITCHEN',source:'Facebook',status:'SUBMITTED',submittedAt:'วันนี้ 09:00',duplicateReviewRequired:false}];
  let mockActivityItems=[{'Activity Item ID':'ATI-MOCK-1','Report ID':'ACT-MOCK','Task':'ตรวจ FIFO วัตถุดิบ','Target':'ครบทุกชั้น','Unit':'จุด','Status':'NOT_STARTED','Note':''},{'Activity Item ID':'ATI-MOCK-2','Report ID':'ACT-MOCK','Task':'บันทึกอุณหภูมิตู้เย็น','Target':'4','Unit':'ตู้','Status':'DONE','Note':'ปกติ'}];
  let scheduleItems=[];
  function seedSchedule(){
    if(scheduleItems.length)return;
    const ids=['E001','E002','E003','E004','E005'];
    ids.forEach((id,idx)=>{for(let i=0;i<7;i++){const date=iso(plus(nextMon,i));if((id==='E003'&&i===2)||(id==='E004'&&i===4)){scheduleItems.push({scheduleId:'',versionId:'VER-1',weekStart:iso(nextMon),date,employeeId:id,workStatus:'OFF',shiftCode:'',startTime:'',endTime:'',source:'MOCK'});continue}const off=(i+idx)%5===0,code=(idx===4&&i<4)?'NIGHT':'DAY',s=shifts.find(x=>x.code===code);scheduleItems.push({scheduleId:'SCH-'+id+'-'+i,versionId:'VER-1',versionNo:1,weekStart:iso(nextMon),date,employeeId:id,workStatus:off?'OFF':'WORK',effectiveWorkStatus:off?'OFF':'WORK',shiftCode:off?'':code,startTime:off?'':s.startTime,endTime:off?'':s.endTime,source:'MOCK',publishedAt:'25/09/2569 09:00'})}})
  }
  seedSchedule();
  const payroll=[{snapshotId:'PAY-001',periodKey:'2026-W39',startDate:iso(plus(today,-7)),endDate:iso(plus(today,-1)),payDate:iso(plus(today,5)),status:'REVIEW',gross:4580,deductions:200,net:4380,detail:{baseWage:3900,nightAllowance:130,otHours:4,otAmount:450,recurringEarnings:100,lateDeduction:100,adjustmentDeductions:100}}];
  let profileDocs=[{documentId:'DOC-MOCK-1',type:'ID_CARD',label:'บัตรประชาชน',fileName:'id-card.pdf',fileId:'MOCK_FILE_ID_001',uploadedAt:'25/09/2569 10:00',status:'VERIFIED',required:true,verifiedAt:'25/09/2569 11:00',verifiedBy:'ADMIN',expiryDate:''},{documentId:'DOC-MOCK-2',type:'HOUSE_REGISTRATION',label:'ทะเบียนบ้าน',fileName:'house.pdf',fileId:'MOCK_FILE_ID_002',uploadedAt:'25/09/2569 10:01',status:'ACTIVE',required:true,verifiedAt:'',verifiedBy:'',expiryDate:''},{documentId:'DOC-MOCK-3',type:'EMPLOYEE_PHOTO',label:'รูปถ่ายพนักงาน',fileName:'employee.jpg',fileId:'MOCK_FILE_ID_003',uploadedAt:'25/09/2569 10:02',status:'VERIFIED',required:true,verifiedAt:'25/09/2569 11:01',verifiedBy:'ADMIN',expiryDate:''}];
  function employee(){return employees[0]}
  function scheduleFor(empId,start,end){return scheduleItems.filter(x=>x.employeeId===empId&&(!start||x.date>=start)&&(!end||x.date<=end)).map(x=>Object.assign({},x,{effectiveWorkStatus:leaveRows.some(l=>l.employeeId===empId&&l.status==='APPROVED'&&x.date>=l.startDate&&x.date<=l.endDate)?'LEAVE':x.workStatus}))}
  function availability(d,shiftCode){
    const rule=quotas.find(x=>x.branchCode==='KORAT'&&x.departmentCode==='KITCHEN'&&(x.shiftCode===shiftCode||x.shiftCode==='*'))||quotas[0];
    const used=leaveRows.filter(l=>['PENDING','APPROVED'].includes(l.status)&&l.shiftCode===(shiftCode||'DAY')&&d>=l.startDate&&d<=l.endDate).length;
    const maxOff=rule?rule.maxOff:1,remaining=Math.max(0,maxOff-used),projected=5-(used+1),min=rule?rule.minStaffing:4;
    const blackout=rule&&rule.blackout,available=!blackout&&remaining>0&&projected>=min;
    return {date:d,shiftCode:shiftCode||'DAY',maxOff,used,remaining,minimumStaffing:min,projectedAfterRequest:projected,available,reason:blackout?'งดขอหยุดวันนี้':remaining<=0?'วันหยุดเต็มแล้ว กรุณาเลือกวันอื่น':projected<min?'กำลังคนจะต่ำกว่าขั้นต่ำ':''}
  }
  function handle(p){
    const op=p.op;
    if(op==='adminLoginFast'||op==='adminLogin') return {token:'MOCK-ADMIN',adminToken:'MOCK-ADMIN',sessionToken:'MOCK-ADMIN',expiresIn:28800,summary:{employees:employees,registrations:[],nextEmployeeId:'E007',sheetUrl:''}};
    if(op==='portalLogin') return {token:'MOCK-PORTAL',expiresIn:21600,employee:employee()};
    if(op==='portalLogout') return {ok:true};
    if(op==='portalBootstrap') return {employee:employee(),shifts,branches,departments,notifications:notifications.filter(x=>x.status==='UNREAD').length};
    if(op==='portalGetSchedule') return {rows:scheduleFor(employee().id,p.startDate,p.endDate)};
    if(op==='portalGetAttendance') return {rows:[{date:iso(today),time:'07:54',action:'เข้างาน',deviceId:'STORE-01',status:'VERIFIED_PHOTO'},{date:iso(today),time:'12:01',action:'เริ่มพัก',deviceId:'STORE-01',status:'VERIFIED_PHOTO'}].filter(x=>(!p.startDate||x.date>=p.startDate)&&(!p.endDate||x.date<=p.endDate))};
    if(op==='portalGetLeaveRequests') return {rows:leaveRows.filter(x=>x.employeeId===employee().id || x.employeeId==='E003').map(x=>Object.assign({},x))};
    if(op==='portalGetLeaveAvailability') return {rows:(p.dates||[]).map(d=>availability(d,p.shiftCode||'DAY'))};
    if(op==='portalSubmitLeave'){leaveRows.unshift({leaveId:'LEV-MOCK-'+Date.now(),employeeId:employee().id,employeeName:employee().name,nickname:employee().nickname,leaveType:p.leave.leaveType,leaveTypeLabel:p.leave.leaveType==='REQUEST_OFF'?'ขอเลือกวันหยุด':p.leave.leaveType,startDate:p.leave.startDate,endDate:p.leave.endDate,duration:p.leave.duration,reason:p.leave.reason,status:'PENDING',branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:p.leave.shiftCode||'DAY',quotaStatus:'RESERVED'});return{ok:true}}
    if(op==='portalGetAttendanceCorrections') return {rows:corrections.filter(x=>x.employeeId===employee().id)};
    if(op==='portalSubmitAttendanceCorrection'){corrections.unshift({correctionId:'COR-MOCK-'+Date.now(),employeeId:employee().id,date:p.date,correctionType:p.correctionType,requestedIn:p.requestedIn,requestedOut:p.requestedOut,reason:p.reason,status:'PENDING',branchCode:'KORAT',departmentCode:'KITCHEN'});return{ok:true}}
    if(op==='portalGetPayroll') return {rows:payroll};
    if(op==='portalRespondPayroll'){const x=payroll.find(x=>x.snapshotId===p.snapshotId);if(x)x.status=p.response==='ACCEPT'?'REVIEW':'HOLD';return{ok:true}}
    if(op==='portalGetProfile') return {employee:employee(),documents:profileDocs};
    if(op==='portalGetChangeRequests') return {rows:[]};
    if(op==='portalSubmitChangeRequest') return {ok:true};
    if(op==='portalGetNotifications') return {rows:notifications};
    if(op==='portalMarkNotificationRead'){const x=notifications.find(x=>x.notificationId===p.notificationId);if(x)x.status='READ';return{ok:true}}
    if(op==='portalAcknowledgeSchedule') return {ok:true};
    if(op==='portalGetDailyActivities') return {report:{'Activity Report ID':'ACT-MOCK','Employee ID':'E001','Date':iso(today),'Shift Code':'DAY','Status':'IN_PROGRESS'},items:mockActivityItems};
    if(op==='portalAddActivityItem'){mockActivityItems.push({'Activity Item ID':'ATI-MOCK-'+Date.now(),'Report ID':'ACT-MOCK','Task':p.task,'Status':'NOT_STARTED','Note':''});return{ok:true}}
    if(op==='portalUpdateActivityItem'){const x=mockActivityItems.find(x=>x['Activity Item ID']===p.activityItemId);if(x){x.Status=p.status;x['Status']=p.status;x['Note']=p.note||''}return{ok:true,status:p.status}}
    if(op==='portalSubmitActivityReport') return {ok:true,status:'SUBMITTED',assigned:mockActivityItems.length,completed:mockActivityItems.filter(x=>x['Status']==='DONE').length,issues:mockActivityItems.filter(x=>x['Status']==='ISSUE').length,pending:mockActivityItems.filter(x=>!['DONE','ISSUE'].includes(x['Status'])).length};
    if(op==='managerSummary') return {employee:employee(),scopes,pendingLeave:leaveRows.filter(x=>x.status==='PENDING').length,pendingCorrections:corrections.filter(x=>x.status==='PENDING').length,pendingSwaps:swaps.filter(x=>x.status==='PENDING_MANAGER').length};
    if(op==='managerGetTeam') return {rows:employees.filter(x=>(p.branchCode==='*'||x.branch===p.branchCode)&&(p.departmentCode==='*'||x.department===p.departmentCode))};
    if(op==='managerGetLeaveRequests') return {rows:leaveRows.filter(x=>p.status==='ALL'||x.status===p.status)};
    if(op==='managerReviewLeave'){const x=leaveRows.find(x=>x.leaveId===p.leaveId);if(x)x.status=p.decision;return{ok:true}}
    if(op==='managerGetAttendanceCorrections') return {rows:corrections.filter(x=>p.status==='ALL'||x.status===p.status)};
    if(op==='managerReviewAttendanceCorrection'){const x=corrections.find(x=>x.correctionId===p.correctionId);if(x)x.status=p.decision;return{ok:true}}
    if(op==='managerGetShiftSwapRequests') return {rows:swaps.filter(x=>p.status==='ALL'||x.status===p.status)};
    if(op==='managerReviewShiftSwap'){const x=swaps.find(x=>x.swapId===p.swapId);if(x)x.status=p.decision;return{ok:true}}
    if(op==='managerGetDailyChecks') return {rows:daily};
    if(op==='managerResolveDailyCheck'){const x=daily.find(x=>x.checkId===p.checkId);if(x){x.status='RESOLVED';x.resolutionNote=p.note;x.resolvedAt='09:05';x.resolvedBy='E001'}return{ok:true}}
    if(op==='managerGetSchedule') return {items:scheduleItems.filter(x=>x.weekStart===p.weekStart&&(p.branchCode==='KORAT'||p.branchCode==='UDOMSUK')),version:p.weekStart===iso(nextMon)?{versionId:'VER-1',versionNo:1,status:'DRAFT'}:null,publishedVersion:null};
    if(op==='managerSaveSchedule'){scheduleItems=(p.items||[]).map((x,i)=>Object.assign({},x,{scheduleId:'SCH-M-'+i,versionId:'VER-MOCK',weekStart:p.weekStart}));return{version:{versionId:'VER-MOCK',versionNo:2,status:'DRAFT'}}}
    if(op==='managerPublishSchedule') return {ok:true};
    if(op==='adminGetOrgMasters'||op==='orgBootstrap') return {branches,departments,shifts,devices:[{deviceId:'STORE-01',branchCode:'KORAT',label:'เครื่องลงเวลาหลัก',active:true}]};
    if(op==='adminSummary') return {employees};
    if(op==='adminGetPermissionUsers') return {rows:employees.map(x=>({id:x.id,name:x.name,nickname:x.nickname||'',active:x.active!==false,branch:x.branch||'',department:x.department||'',position:x.position||'',employmentStatus:x.employmentStatus||'ACTIVE',accessRole:x.accessRole||'EMPLOYEE'}))};
    if(op==='adminGetEmployee') return Object.assign({},employees.find(x=>x.id===p.employeeId)||employees[0],{startDate:'2025-01-15',employmentStatus:'ACTIVE',accessRole:(employees.find(x=>x.id===p.employeeId)||employees[0]).accessRole||'EMPLOYEE'});
    if(op==='adminGetRegistrationDocuments') return {rows:profileDocs.map(x=>Object.assign({},x))};
    if(op==='adminGetDocument') return {fileName:'mock-document.txt',mimeType:'text/plain',dataUrl:'data:text/plain;base64,S3J1YUZsb3cgbW9jayBkb2N1bWVudA=='};
    if(op==='adminUpdateDocumentMeta'){const x=profileDocs.find(x=>x.documentId===p.documentId);if(x){x.status=p.status||x.status;x.expiryDate=p.expiryDate||'';x.required=Boolean(p.required);x.note=p.note||'';if(x.status==='VERIFIED'){x.verifiedAt='วันนี้';x.verifiedBy='ADMIN'}}return{ok:true,status:x&&x.status}};
    if(op==='adminUploadEmployeeDocument'){const d=p.document||{},x={documentId:'DOC-MOCK-'+Date.now(),type:d.type,label:d.label,fileName:d.fileName,fileId:'MOCK_FILE_'+Date.now(),uploadedAt:'วันนี้',status:'ACTIVE',required:['ID_CARD','HOUSE_REGISTRATION','EMPLOYEE_PHOTO'].includes(d.type),verifiedAt:'',verifiedBy:'',expiryDate:''};if(p.replaceDocumentId)profileDocs=profileDocs.filter(y=>y.documentId!==p.replaceDocumentId);if(x.required)profileDocs=profileDocs.filter(y=>y.type!==x.type);profileDocs.unshift(x);return Object.assign({ok:true},x)};
    if(op==='adminGetManagerScopes') return {rows:scopes};
    if(op==='adminGetLeaveQuotaRules') return {rows:quotas};
    if(op==='adminGetAuditLog') return {rows:[{auditId:'AUD-001',timestamp:'25/09/2569 09:30',actorType:'MANAGER',actorId:'E001',action:'PUBLISH_SCHEDULE',entityType:'SCHEDULE_VERSION',entityId:'VER-1',reason:'ประกาศตารางสัปดาห์หน้า'},{auditId:'AUD-002',timestamp:'25/09/2569 08:45',actorType:'MANAGER',actorId:'E001',action:'APPROVE_LEAVE',entityType:'LEAVE',entityId:'LEV-002',reason:'อนุมัติวันหยุด'}]};
    if(op==='adminBackupNow') return {ok:true,backupId:'BKP-MOCK',fileUrl:'#'};
    if(op==='workforcePublicBootstrap') return {ready:true,recruitmentEnabled:true,gcsDocumentsEnabled:false,documentMaxBytes:10485760,branches,departments,positions:[{code:'MANAGER',name:'ผู้จัดการ'},{code:'SUPERVISOR',name:'หัวหน้างาน'},{code:'STAFF',name:'พนักงาน'}]};
    if(op==='applicantSubmit') return {ok:true,personId:'P-MOCK',applicantId:'APP-MOCK-'+Date.now(),status:'SUBMITTED'};
    if(op==='workforceBootstrap') return {ready:true,schemaVersion:'MOCK',flags:{WORKFORCE_V2_ENABLED:true,RECRUITMENT_ENABLED:true,ACTIVITY_ENABLED:true,GCS_DOCUMENTS_ENABLED:false,PERFORMANCE_ENABLED:true,OFFBOARDING_ENABLED:true},branches,departments,positions:[{code:'MANAGER',name:'ผู้จัดการ'},{code:'STAFF',name:'พนักงาน'}],kpiDictionary:[]};
    if(op==='adminWorkforceDashboard') return {workforce:{total:6,active:5,probation:1,inactive:0},recruitment:{applicants:1,screening:0,interviews:0,interviewShowRate:null,passed:0,hired:0,hireConversionRate:0,offerAcceptanceRate:null},workQueue:{open:2,urgent:1}};
    if(op==='adminSearchEmployees') return {rows:[{employeeId:'E001',name:'สมชาย ใจดี',nickname:'ชาย',branchCode:'KORAT',departmentCode:'KITCHEN',positionCode:'STAFF',employmentStatus:'ACTIVE',active:true}].slice(0,Number(p.limit)||30),total:6};
    if(op==='adminRecruitmentList') return {rows:mockApplicants.filter(x=>(!p.status||x.status===p.status)&&(!p.query||(x.name+' '+x.phone+' '+x.applicantId).toLowerCase().includes(String(p.query).toLowerCase()))),total:mockApplicants.length};
    if(op==='adminTransitionApplicant'){const x=mockApplicants.find(x=>x.applicantId===p.applicantId);if(x)x.status=p.status;return{ok:true,status:p.status}}
    if(op==='adminGetWorkQueue') return {rows:[{workItemId:'WRK-MOCK-1',entityType:'APPLICANT',entityId:'APP-MOCK-001',title:'ตรวจใบสมัคร กมล งานดี',assignedRole:'ADMIN',dueAt:'วันนี้ 17:00',priority:'NORMAL',status:'OPEN',branchCode:'KORAT',departmentCode:'KITCHEN'}],total:1};
    if(op==='adminGetStaffingTargets') return {rows:[{staffingTargetId:'STF-MOCK',branchCode:'KORAT',departmentCode:'KITCHEN',positionCode:'STAFF',targetHeadcount:8,activeHeadcount:6,probationHeadcount:1,gap:1,pipelineCount:1}]};
    if(op==='adminActivityDashboard') return {requiredReporters:6,submitted:5,notSubmitted:1,assignedTasks:22,completed:20,pending:1,issues:1,submissionRate:83.3,completionRate:90.9,onTimeCompletionRate:86.4};
    if(op==='adminAttendanceControl') return {summary:{expected:6,present:5,notCheckedIn:1,leave:0,absent:0,late:1,noCheckOut:0,unplanned:0,ot:1.5},rows:[{employeeId:'E001',employeeName:'สมชาย ใจดี',nickname:'ชาย',branchCode:'KORAT',departmentCode:'KITCHEN',shiftCode:'DAY',scheduledShift:'08:00–20:00',checkIn:'07:54',checkOut:'',workedHours:0,lateMinutes:0,otHours:0,status:'NORMAL'}],total:1};
    if(op==='adminRecruitmentReport') return {metrics:{applications:10,interviewsScheduled:5,interviewShowRate:80,passed:3,offersSent:2,offerAcceptanceRate:50,hired:1,hireConversionRate:10},bySource:[{source:'Facebook',applications:6,hired:1,conversionRate:16.7}],formulas:{interviewShowRate:'attended / scheduled',offerAcceptanceRate:'accepted / sent',hireConversionRate:'hired / submitted'}};
    if(op==='adminRetentionReport') return {metrics:{turnoverRate:2,voluntary:1,involuntary:0,averageTenureDays:320,retention30:{retained:5,eligible:5,rate:100},retention60:{retained:5,eligible:5,rate:100},retention90:{retained:4,eligible:5,rate:80}},formulas:{turnoverRate:'exits / active at period start',averageTenureDays:'sum tenure / employees'}};
    if(op==='adminGetPayrollPeriods') return {rows:[]};
    if(op==='adminGetNotificationCenter') return {rows:[],unread:0};
    if(op==='adminGetEmployeeExits') return {rows:[]};
    if(/^adminSave/.test(op)||op==='adminDeleteManagerScope') return {ok:true};
    return {ok:true,rows:[]};
  }
  window.KRUA_FLOW_MOCK={enabled,handle,reset:function(){localStorage.removeItem('kruaFlowMockModeV7');location.reload()}};
})();
