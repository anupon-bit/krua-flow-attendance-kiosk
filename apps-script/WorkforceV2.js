// KruaFlow Workforce V2 — additive employee lifecycle foundation.
// This file intentionally does not replace V7 APIs. New modules are enabled per feature flag.

const WF2_SCHEMA_VERSION_ = '2.0.0';
const WF2_SHEETS_ = Object.freeze({
  Persons:['Person ID','First Name','Last Name','Nickname','Birth Date','Phone','Phone Normalized','LINE','Email','Email Normalized','Address','Photo Document ID','Lifecycle Stage','Identity Status','Duplicate Review Required','Created At','Updated At','Created By','Source'],
  Recruitment_Leads:['Lead ID','Person ID','Source','Campaign','Interested Position','Interested Branch','Status','Owner ID','Cost','Note','Created At','Updated At'],
  Applicants:['Applicant ID','Person ID','Lead ID','Position Code','Branch Code','Department Code','Experience','Expected Wage','Available Start Date','Source','Status','Consent','Submitted At','Screened At','Screened By','Rejection Reason','Created At','Updated At'],
  Applicant_Interviews:['Interview ID','Applicant ID','Person ID','Interview Date','Interview Time','Branch Code','Location','Interviewer ID','Position Code','Status','Evaluation JSON','Notes','Strengths','Concerns','Relevant Experience','Expected Pay','Negotiated Pay','Available Start Date','Result','Created At','Updated At'],
  Offers:['Offer ID','Applicant ID','Person ID','Position Code','Branch Code','Department Code','Wage Type','Wage Amount','Start Date','Offer Date','Accepted Date','Status','Note','Created At','Updated At'],
  Staffing_Targets:['Staffing Target ID','Branch Code','Department Code','Position Code','Target Headcount','Effective Start','Effective End','Active','Updated At','Updated By'],
  Positions:['Position Code','Position Name','Department Code','Active','Sort Order','Created At','Updated At','Admin Note'],
  Employee_Movements:['Movement ID','Employee ID','Person ID','Movement Type','Effective Date','Field Name','Old Value','New Value','Reason','Approved By','Status','Applied At','Created At'],
  Probation_Reviews:['Probation Review ID','Employee ID','Person ID','Start Date','Planned End Date','Actual End Date','Status','Review Date','Reviewer ID','KPI Result JSON','Supervisor Rating','Notes','Created At','Updated At'],
  KPI_Definitions:['KPI Key','Name','Description','Source','Formula Type','Formula','Numerator','Denominator','Unit','Period','Dimension','Target','Direction','Weight','Applicable Position','Applicable Department','Applicable Branch','Lifecycle Stage','Owner','Data Quality Status','Active','Created At','Updated At'],
  KPI_Targets:['KPI Target ID','KPI Key','Position Code','Department Code','Branch Code','Lifecycle Stage','Period','Target','Weight','Active','Effective Start','Effective End','Updated At'],
  Employee_KPI_Results:['KPI Result ID','Employee ID','KPI Key','Period Start','Period End','Numerator','Denominator','Raw Value','Score','Target','Source Reference JSON','Data Quality Status','Calculated At'],
  Performance_Reviews:['Performance Review ID','Employee ID','Reviewer ID','Review Type','Period Start','Period End','Criteria JSON','Numeric Rating','Notes','Status','Submitted At','Created At','Updated At'],
  Training_Catalog:['Training ID','Name','Description','Required Position','Validity Days','Active','Created At','Updated At'],
  Employee_Training:['Employee Training ID','Employee ID','Training ID','Status','Assigned At','Due At','Completed At','Expires At','Evidence Document ID','Result','Updated At'],
  Employee_Incidents:['Incident ID','Employee ID','Person ID','Date','Category','Severity','Description','Evidence Document ID','Reported By','Reviewed By','Action','Status','Resolved At','Created At','Updated At'],
  Documents:['Document ID','Person ID','Applicant ID','Registration ID','Employee ID','Owner Type','Owner ID','Type','Label','Original File Name','MIME Type','Size','Storage Provider','Bucket','Object Key','Checksum','Uploaded At','Uploaded By','Status','Required','Verified At','Verified By','Expiry Date','Version','Replaced Document ID','Created At','Updated At'],
  Activity_Categories:['Activity Category ID','Name','Department Code','Active','Sort Order','Created At','Updated At'],
  Activity_Templates:['Activity Template ID','Category ID','Branch Code','Department Code','Position Code','Shift Code','Task','Target','Unit','Due Offset Minutes','Required','Active','Created At','Updated At'],
  Activity_Reports:['Activity Report ID','Employee ID','Date','Branch Code','Department Code','Position Code','Shift Code','Status','Submitted At','Created At','Updated At'],
  Activity_Items:['Activity Item ID','Report ID','Template ID','Category ID','Task','Target','Actual','Unit','Status','Started At','Completed At','Due At','Issue Flag','Note','Evidence Document ID','Created At','Updated At'],
  Activity_Issues:['Activity Issue ID','Activity Item ID','Employee ID','Description','Severity','Created At','Assigned To','Action','Status','Resolved At','Updated At'],
  Payroll_Periods:['Period ID','Start Date','End Date','Cutoff','Pay Date','Period Type','Employee Count','Total Amount','Status','Created At','Updated At'],
  Work_Queue:['Work Item ID','Entity Type','Entity ID','Title','Assigned Role','Assigned User','Due At','Priority','Status','Branch Code','Department Code','Created At','Updated At','Completed At'],
  Employee_Exits:['Exit ID','Employee ID','Person ID','Exit Type','Reason Category','Reason Detail','Notice Date','Last Working Date','Notice Days','Status','Approved By','Handover Status','Asset Return Status','Document Status','Final Payroll Status','Exit Interview Status','Access Closed Status','Rehire Eligible','Completed At','Created At','Updated At'],
  Exit_Checklist:['Exit Checklist ID','Exit ID','Task Key','Task Label','Owner Role','Status','Completed At','Completed By','Note','Created At','Updated At'],
  Exit_Interviews:['Exit Interview ID','Exit ID','Employee ID','Reason','Manager Rating','Work Condition Rating','Pay Rating','Schedule Rating','Career Rating','Other Rating','Notes','Submitted At'],
  Lifecycle_Events:['Event ID','Person ID','Employee ID','Entity Type','Entity ID','Event Type','Event Date','Summary','Metadata JSON','Created By','Created At'],
  User_Permissions:['Permission ID','Employee ID','Capability','Scope Type','Scope ID','Allowed','Active','Created At','Updated At','Updated By']
});

const WF2_FLAGS_ = Object.freeze([
  'WORKFORCE_V2_ENABLED','RECRUITMENT_ENABLED','ACTIVITY_ENABLED',
  'GCS_DOCUMENTS_ENABLED','PERFORMANCE_ENABLED','OFFBOARDING_ENABLED'
]);

const WF2_APPLICANT_TRANSITIONS_ = Object.freeze({
  STARTED:['SUBMITTED'], SUBMITTED:['SCREENING','REJECTED'],
  SCREENING:['INTERVIEW_SCHEDULED','REJECTED'],
  INTERVIEW_SCHEDULED:['INTERVIEW_ATTENDED','NO_SHOW','CANCELLED'],
  NO_SHOW:['INTERVIEW_SCHEDULED','REJECTED'], CANCELLED:['INTERVIEW_SCHEDULED','REJECTED'],
  INTERVIEW_ATTENDED:['PASSED','RESERVE','REJECTED'], RESERVE:['INTERVIEW_SCHEDULED','REJECTED'],
  PASSED:['OFFER_DRAFT','REJECTED'], OFFER_DRAFT:['OFFER_SENT','REJECTED'],
  OFFER_SENT:['OFFER_ACCEPTED','OFFER_DECLINED'], OFFER_ACCEPTED:['HIRED'],
  OFFER_DECLINED:['REJECTED'], HIRED:['PRE_ONBOARDING']
});

function apiWorkforceV2HandlePost_(payload) {
  const op=String(payload.op||'');
  if(op==='workforcePublicBootstrap') return wf2PublicBootstrap_();
  if(op==='applicantSubmit') return wf2SubmitApplicant_(payload);
  if(op==='adminWorkforceMigrate') return wf2AdminMigrate_(payload);
  if(op==='adminSetWorkforceFeatureFlag') return wf2AdminSetFeatureFlag_(payload);
  if(op==='workforceBootstrap') return wf2AdminBootstrap_(payload);
  if(op==='adminWorkforceDashboard') return wf2AdminDashboard_(payload);
  if(op==='adminRecruitmentList') return wf2AdminRecruitmentList_(payload);
  if(op==='adminCreateRecruitmentLead') return wf2AdminCreateLead_(payload);
  if(op==='adminTransitionApplicant') return wf2AdminTransitionApplicant_(payload);
  if(op==='adminSaveInterview') return wf2AdminSaveInterview_(payload);
  if(op==='adminSaveOffer') return wf2AdminSaveOffer_(payload);
  if(op==='adminGetStaffingTargets') return wf2AdminGetStaffingTargets_(payload);
  if(op==='adminSaveStaffingTarget') return wf2AdminSaveStaffingTarget_(payload);
  if(op==='adminStartOnboarding') return wf2AdminStartOnboarding_(payload);
  if(op==='adminGetWorkQueue') return wf2AdminGetWorkQueue_(payload);
  if(op==='adminCompleteWorkItem') return wf2AdminCompleteWorkItem_(payload);
  if(op==='adminWorkforceDiagnostics') return wf2AdminDiagnostics_(payload);
  if(op==='adminGetEmployeeLifecycleProfile') return wf2AdminEmployeeLifecycleProfile_(payload);
  if(op==='adminSearchEmployees') return wf2AdminSearchEmployees_(payload);
  if(op==='adminGetInterviews') return wf2AdminGetInterviews_(payload);
  if(op==='adminRecordEmployeeMovement') return wf2AdminRecordEmployeeMovement_(payload);
  if(op==='adminApplyDueEmployeeMovements') return wf2AdminApplyDueMovements_(payload);
  if(op==='adminSaveProbationReview') return wf2AdminSaveProbationReview_(payload);
  if(op==='portalGetDailyActivities') return wf2PortalGetDailyActivities_(payload);
  if(op==='portalAddActivityItem') return wf2PortalAddActivityItem_(payload);
  if(op==='portalUpdateActivityItem') return wf2PortalUpdateActivityItem_(payload);
  if(op==='portalSubmitActivityReport') return wf2PortalSubmitActivityReport_(payload);
  if(op==='managerGetActivityIssues') return wf2ManagerGetActivityIssues_(payload);
  if(op==='managerResolveActivityIssue') return wf2ManagerResolveActivityIssue_(payload);
  if(op==='adminGetActivityTemplates') return wf2AdminGetActivityTemplates_(payload);
  if(op==='adminSaveActivityTemplate') return wf2AdminSaveActivityTemplate_(payload);
  if(op==='adminActivityDashboard') return wf2AdminActivityDashboard_(payload);
  if(op==='adminCreateEmployeeExit') return wf2AdminCreateEmployeeExit_(payload);
  if(op==='adminUpdateExitChecklist') return wf2AdminUpdateExitChecklist_(payload);
  if(op==='adminCompleteEmployeeExit') return wf2AdminCompleteEmployeeExit_(payload);
  if(op==='adminGetKpiDefinitions') return wf2AdminGetKpiDefinitions_(payload);
  if(op==='adminSaveKpiDefinition') return wf2AdminSaveKpiDefinition_(payload);
  if(op==='adminCalculateEmployeePerformance') return wf2AdminCalculatePerformance_(payload);
  if(op==='adminSavePerformanceReview') return wf2AdminSavePerformanceReview_(payload);
  if(op==='adminSaveTrainingCatalog') return wf2AdminSaveTrainingCatalog_(payload);
  if(op==='adminAssignEmployeeTraining') return wf2AdminAssignTraining_(payload);
  if(op==='adminCompleteEmployeeTraining') return wf2AdminCompleteTraining_(payload);
  if(op==='adminRecordEmployeeIncident') return wf2AdminRecordIncident_(payload);
  if(op==='adminSetUserCapability') return wf2AdminSetCapability_(payload);
  if(op==='adminAttendanceControl') return wf2AdminAttendanceControl_(payload);
  if(op==='adminRecruitmentReport') return wf2AdminRecruitmentReport_(payload);
  if(op==='adminRetentionReport') return wf2AdminRetentionReport_(payload);
  if(op==='adminGetPayrollPeriods') return wf2AdminGetPayrollPeriods_(payload);
  if(op==='adminSavePayrollPeriod') return wf2AdminSavePayrollPeriod_(payload);
  if(op==='adminTransitionPayrollPeriod') return wf2AdminTransitionPayrollPeriod_(payload);
  if(op==='adminGetNotificationCenter') return wf2AdminNotificationCenter_(payload);
  if(op==='adminMarkNotificationRead') return wf2AdminMarkNotificationRead_(payload);
  if(op==='adminGetEmployeeExits') return wf2AdminGetEmployeeExits_(payload);
  if(op==='adminSaveExitInterview') return wf2AdminSaveExitInterview_(payload);
  if(op==='documentCreateUploadSession') return wf2DocumentCreateUploadSession_(payload);
  if(op==='documentFinalizeUpload') return wf2DocumentFinalizeUpload_(payload);
  if(op==='documentGetViewUrl') return wf2DocumentGetViewUrl_(payload);
  return null;
}

function wf2AdminMigrate_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const apply=payload.apply===true;
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const backfillRequested=payload.backfillLegacy===true;
  const settingSpecs=WF2_FLAGS_.map(key=>({key:key,value:'FALSE',description:'Workforce V2 feature flag — enable in STAGING after UAT'})).concat([
    {key:'WORKFORCE_SCHEMA_VERSION',value:WF2_SCHEMA_VERSION_,description:'Additive workforce schema version'},
    {key:'DOCUMENT_MAX_BYTES',value:'10485760',description:'Maximum document size (10 MB)'}
  ]);
  const settingRows=wf2MigrationSettings_(ss);
  const settings=settingSpecs.map(spec=>({
    key:spec.key,
    exists:Object.prototype.hasOwnProperty.call(settingRows,spec.key),
    currentValue:Object.prototype.hasOwnProperty.call(settingRows,spec.key)?String(settingRows[spec.key]):'',
    plannedValue:spec.value,
    action:Object.prototype.hasOwnProperty.call(settingRows,spec.key)?'PRESERVE':'CREATE'
  }));
  const enabledFlags=settings.filter(item=>WF2_FLAGS_.indexOf(item.key)>=0&&/^(1|true|yes|on)$/i.test(item.currentValue));
  const schemaSetting=settings.find(item=>item.key==='WORKFORCE_SCHEMA_VERSION');
  const legacyBefore=wf2MigrationLegacyCounts_(ss);
  const plan={
    schemaVersion:WF2_SCHEMA_VERSION_,mode:apply?'APPLY':'DRY_RUN',sheets:[],columns:[],settings:settings,
    seeds:wf2MigrationSeedPlan_(ss),backfillRequested:backfillRequested,backfill:null,
    safeguards:{deleteOperations:0,reorderOperations:0,legacyRowOverwriteOperations:0,backfillAllowed:backfillRequested},
    legacyRowCounts:{before:legacyBefore,after:null,unchanged:null},
    rowsModified:{legacyExistingRows:0,settingsInserted:0,kpiSeedsInserted:0,positionSeedsInserted:0,auditRowsAppended:apply?1:0}
  };
  if(apply&&enabledFlags.length)throw new Error('หยุด migration: feature flags ต้องเป็น FALSE ก่อน apply ('+enabledFlags.map(item=>item.key).join(', ')+')');
  if(apply&&schemaSetting&&schemaSetting.exists&&schemaSetting.currentValue&&schemaSetting.currentValue!==WF2_SCHEMA_VERSION_)throw new Error('หยุด migration: WORKFORCE_SCHEMA_VERSION ปัจจุบันไม่ตรงกับ '+WF2_SCHEMA_VERSION_);
  Object.keys(WF2_SHEETS_).forEach(name=>{
    const existing=ss.getSheetByName(name);
    const current=existing&&existing.getLastColumn()>0?existing.getRange(1,1,1,existing.getLastColumn()).getDisplayValues()[0].filter(String):[];
    const missing=WF2_SHEETS_[name].filter(h=>current.indexOf(h)<0);
    plan.sheets.push({name:name,exists:Boolean(existing),missingColumns:missing});
    if(apply) wf2EnsureSheet_(ss,name,WF2_SHEETS_[name]);
  });
  [['Employees','Person ID'],['Employee_Registrations','Person ID'],['Employee_Registrations','Applicant ID']].forEach(item=>{
    const sh=ss.getSheetByName(item[0]);
    const headers=sh&&sh.getLastColumn()?sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0]:[];
    const missing=Boolean(sh)&&headers.indexOf(item[1])<0;
    plan.columns.push({sheet:item[0],column:item[1],missing:missing});
    if(apply&&missing) sh.getRange(1,sh.getLastColumn()+1).setValue(item[1]);
  });
  if(apply){
    WF2_FLAGS_.forEach(flag=>ensureSettingV7_(flag,'FALSE','Workforce V2 feature flag — enable in STAGING after UAT'));
    ensureSettingV7_('WORKFORCE_SCHEMA_VERSION',WF2_SCHEMA_VERSION_,'Additive workforce schema version');
    ensureSettingV7_('DOCUMENT_MAX_BYTES','10485760','Maximum document size (10 MB)');
    plan.rowsModified.settingsInserted=settings.filter(item=>item.action==='CREATE').length;
    plan.rowsModified.kpiSeedsInserted=wf2SeedKpis_();
    plan.rowsModified.positionSeedsInserted=wf2SeedPositions_();
    if(backfillRequested) plan.backfill=wf2BackfillLegacyPeople_();
    auditLogV7_('ADMIN','ADMIN','MIGRATE_WORKFORCE_SCHEMA','SYSTEM','WORKFORCE_V2','',{version:WF2_SCHEMA_VERSION_,backfill:plan.backfill||null},'',String(payload.requestId||''));
    const legacyAfter=wf2MigrationLegacyCounts_(ss);
    plan.legacyRowCounts.after=legacyAfter;
    plan.legacyRowCounts.unchanged=Object.keys(legacyBefore).every(name=>legacyBefore[name]===legacyAfter[name]);
  }
  return {ok:true,plan:plan,serverEpochMs:Date.now()};
}

function wf2MigrationSettings_(ss){
  const sh=ss.getSheetByName(SETTINGS_SHEET),out={};
  if(!sh||sh.getLastRow()<2)return out;
  sh.getRange(2,1,sh.getLastRow()-1,2).getValues().forEach(row=>{const key=String(row[0]||'');if(key)out[key]=row[1]});
  return out;
}

function wf2MigrationLegacyCounts_(ss){
  const out={};
  [EMPLOYEE_SHEET,ATTENDANCE_SHEET,LEAVE_SHEET,'Payroll_Snapshots',REGISTRATION_SHEET].forEach(name=>{const sh=ss.getSheetByName(name);out[name]=sh?Math.max(0,sh.getLastRow()-1):null});
  return out;
}

function wf2MigrationSeedPlan_(ss){
  const kpi=ss.getSheetByName('KPI_Definitions'),positions=ss.getSheetByName('Positions');
  const kpiRows=kpi?Math.max(0,kpi.getLastRow()-1):0,positionRows=positions?Math.max(0,positions.getLastRow()-1):0;
  return{
    kpiDefinitions:{existingRows:kpiRows,action:kpiRows?'PRESERVE':'INSERT_DEFAULTS',plannedKeys:kpiRows?[]:wf2KpiDictionary_().map(item=>item.key)},
    positions:{existingRows:positionRows,action:positionRows?'PRESERVE':'INSERT_DEFAULTS',plannedCodes:positionRows?[]:['MANAGER','SUPERVISOR','STAFF']}
  };
}

function wf2AdminSetFeatureFlag_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const key=String(payload.key||'');
  if(WF2_FLAGS_.indexOf(key)<0)throw new Error('Feature flag ไม่ถูกต้อง');
  const value=payload.enabled===true?'TRUE':'FALSE';
  wf2SetSetting_(key,value,'Workforce V2 feature flag — enable in STAGING after UAT');
  auditLogV7_('ADMIN','ADMIN','SET_FEATURE_FLAG','SETTING',key,'',{value:value},String(payload.reason||''),String(payload.requestId||''));
  return {ok:true,key:key,enabled:value==='TRUE'};
}

function wf2EnsureSheet_(ss,name,headers) {
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  let current=[];
  if(sh.getLastColumn()>0) current=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  if(!current.some(String)){
    if(sh.getMaxColumns()<headers.length) sh.insertColumnsAfter(sh.getMaxColumns(),headers.length-sh.getMaxColumns());
    sh.getRange(1,1,1,headers.length).setValues([headers]);
  } else {
    const missing=headers.filter(h=>current.indexOf(h)<0);
    if(missing.length){
      const start=sh.getLastColumn()+1;
      if(sh.getMaxColumns()<start+missing.length-1) sh.insertColumnsAfter(sh.getMaxColumns(),start+missing.length-1-sh.getMaxColumns());
      sh.getRange(1,start,1,missing.length).setValues([missing]);
    }
  }
  sh.setFrozenRows(1);
  return sh;
}

function wf2Sheet_(name) {
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if(!sh) throw new Error('Workforce V2 ยังไม่พร้อม: กรุณารัน migration แบบ additive ก่อน ('+name+')');
  return sh;
}

function wf2Headers_(sh){return sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(String)}
function wf2Rows_(name) {
  const sh=wf2Sheet_(name),last=sh.getLastRow(),headers=wf2Headers_(sh);
  if(last<2)return[];
  return sh.getRange(2,1,last-1,headers.length).getValues().map((row,index)=>{
    const out={_row:index+2};headers.forEach((h,i)=>out[h]=row[i]);return out;
  });
}
function wf2Append_(name,obj) {
  const sh=wf2Sheet_(name),headers=wf2Headers_(sh);
  sh.appendRow(headers.map(h=>Object.prototype.hasOwnProperty.call(obj,h)?obj[h]:''));
  return sh.getLastRow();
}
function wf2UpdateRow_(name,rowNumber,changes) {
  const sh=wf2Sheet_(name),headers=wf2Headers_(sh),row=sh.getRange(rowNumber,1,1,headers.length).getValues()[0];
  Object.keys(changes).forEach(key=>{const i=headers.indexOf(key);if(i>=0)row[i]=changes[key]});
  sh.getRange(rowNumber,1,1,headers.length).setValues([row]);
}
function wf2Setting_(key) {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(SETTINGS_SHEET);
  if(!sh||sh.getLastRow()<2)return'';
  const values=sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
  for(let i=0;i<values.length;i++)if(String(values[i][0])===String(key))return values[i][1];
  return'';
}
function wf2SetSetting_(key,value,description) {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);let sh=ss.getSheetByName(SETTINGS_SHEET);
  if(!sh)sh=ss.insertSheet(SETTINGS_SHEET);
  if(sh.getLastRow()<1)sh.getRange(1,1,1,3).setValues([['Setting','Value','Description']]);
  if(sh.getLastRow()>=2){const values=sh.getRange(2,1,sh.getLastRow()-1,1).getValues();for(let i=0;i<values.length;i++)if(String(values[i][0])===String(key)){sh.getRange(i+2,2,1,2).setValues([[String(value),String(description||'')]]);return}}
  sh.appendRow([String(key),String(value),String(description||'')]);
}
function wf2Flag_(key){return /^(1|true|yes|on)$/i.test(String(wf2Setting_(key)||''))}
function wf2RequireFlag_(key){if(!wf2Flag_(key))throw new Error('ฟีเจอร์นี้ยังไม่เปิดใช้งานใน environment นี้: '+key)}

function wf2PublicBootstrap_() {
  const ready=Boolean(SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Applicants'));
  return {ready:ready,recruitmentEnabled:ready&&wf2Flag_('RECRUITMENT_ENABLED'),gcsDocumentsEnabled:ready&&wf2Flag_('GCS_DOCUMENTS_ENABLED'),documentMaxBytes:Number(wf2Setting_('DOCUMENT_MAX_BYTES'))||10485760,branches:getBranchesV7_(false),departments:getDepartmentsV7_(false),positions:ready?wf2ActivePositions_():[],serverEpochMs:Date.now()};
}

function wf2AdminBootstrap_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),ready=Boolean(ss.getSheetByName('Persons'));
  const flags={};WF2_FLAGS_.forEach(key=>flags[key]=wf2Flag_(key));
  return {ready:ready,schemaVersion:String(wf2Setting_('WORKFORCE_SCHEMA_VERSION')||''),flags:flags,branches:getBranchesV7_(false),departments:getDepartmentsV7_(false),positions:ready?wf2ActivePositions_():[],kpiDictionary:wf2KpiDictionary_(),serverEpochMs:Date.now()};
}

function wf2ActivePositions_(){return wf2Rows_('Positions').filter(r=>r['Active']!==false&&String(r['Position Code']||'')).map(r=>({code:String(r['Position Code']),name:String(r['Position Name']),departmentCode:String(r['Department Code']||'')}))}

function wf2SubmitApplicant_(payload) {
  wf2RequireFlag_('RECRUITMENT_ENABLED');
  const input=payload.applicant||{};
  const firstName=String(input.firstName||'').trim(),lastName=String(input.lastName||'').trim(),phone=wf2NormalizePhone_(input.phone),email=String(input.email||'').trim().toLowerCase();
  if(!firstName||!lastName||!phone)throw new Error('กรุณากรอกชื่อ นามสกุล และเบอร์โทร');
  if(input.consent!==true)throw new Error('กรุณายอมรับการเก็บข้อมูลเพื่อสมัครงาน');
  const position=String(input.positionCode||'').trim(),branch=validateBranchV7_(input.branchCode,false);
  if(!position)throw new Error('กรุณาเลือกตำแหน่งที่สมัคร');
  const candidates=wf2DuplicateCandidates_(phone,email),now=new Date();
  const personId=wf2NextPersonId_();
  wf2Append_('Persons',{'Person ID':personId,'First Name':firstName,'Last Name':lastName,'Nickname':String(input.nickname||''),'Birth Date':parseIsoDate_(input.birthDate)||'','Phone':String(input.phone||''),'Phone Normalized':phone,'LINE':String(input.line||''),'Email':String(input.email||''),'Email Normalized':email,'Address':String(input.address||''),'Lifecycle Stage':'APPLICANT','Identity Status':'ACTIVE','Duplicate Review Required':candidates.length>0,'Created At':now,'Updated At':now,'Created By':'PUBLIC','Source':String(input.source||'Other')});
  const applicantId=wf2EntityId_('APP');
  wf2Append_('Applicants',{'Applicant ID':applicantId,'Person ID':personId,'Position Code':position,'Branch Code':branch,'Department Code':String(input.departmentCode||''),'Experience':String(input.experience||''),'Expected Wage':Number(input.expectedWage)||0,'Available Start Date':parseIsoDate_(input.availableStartDate)||'','Source':String(input.source||'Other'),'Status':'SUBMITTED','Consent':true,'Submitted At':now,'Created At':now,'Updated At':now});
  wf2AddEvent_(personId,'','APPLICANT',applicantId,'APPLICATION_SUBMITTED','ส่งใบสมัครตำแหน่ง '+position,{source:String(input.source||'Other')},'PUBLIC');
  wf2AddWorkItem_('APPLICANT',applicantId,'ตรวจใบสมัคร '+firstName+' '+lastName,'ADMIN','',new Date(Date.now()+24*60*60*1000),'NORMAL',branch,String(input.departmentCode||''));
  if(candidates.length)wf2AddWorkItem_('PERSON_DUPLICATE_REVIEW',personId,'ตรวจบุคคลที่อาจซ้ำ: '+firstName+' '+lastName,'ADMIN','',new Date(Date.now()+24*60*60*1000),'URGENT',branch,'');
  let documentToken='';
  if(wf2Flag_('GCS_DOCUMENTS_ENABLED')){documentToken=Utilities.getUuid()+Utilities.getUuid();CacheService.getScriptCache().put('WF2_APPLICANT_UPLOAD_'+documentToken,JSON.stringify({applicantId:applicantId,personId:personId}),1800)}
  return {ok:true,personId:personId,applicantId:applicantId,status:'SUBMITTED',duplicateReviewRequired:candidates.length>0,documentUploadToken:documentToken,documentUploadExpiresIn:documentToken?1800:0,serverEpochMs:Date.now()};
}

function wf2AdminCreateLead_(payload) {
  requireAdmin_(String(payload.adminToken||''));wf2RequireFlag_('RECRUITMENT_ENABLED');
  const lead=payload.lead||{},now=new Date(),first=String(lead.firstName||'').trim(),last=String(lead.lastName||'').trim();
  if(!first&&!String(lead.phone||'').trim())throw new Error('กรุณากรอกชื่อหรือเบอร์โทรผู้สนใจ');
  const phone=wf2NormalizePhone_(lead.phone),email=String(lead.email||'').trim().toLowerCase(),duplicates=wf2DuplicateCandidates_(phone,email),personId=wf2NextPersonId_();
  wf2Append_('Persons',{'Person ID':personId,'First Name':first,'Last Name':last,'Nickname':String(lead.nickname||''),'Phone':String(lead.phone||''),'Phone Normalized':phone,'LINE':String(lead.line||''),'Email':String(lead.email||''),'Email Normalized':email,'Lifecycle Stage':'INTERESTED','Identity Status':'ACTIVE','Duplicate Review Required':duplicates.length>0,'Created At':now,'Updated At':now,'Created By':'ADMIN','Source':String(lead.source||'Other')});
  const leadId=wf2EntityId_('LEAD');
  wf2Append_('Recruitment_Leads',{'Lead ID':leadId,'Person ID':personId,'Source':String(lead.source||'Other'),'Campaign':String(lead.campaign||''),'Interested Position':String(lead.positionCode||''),'Interested Branch':String(lead.branchCode||''),'Status':'INTERESTED','Owner ID':'ADMIN','Cost':Number(lead.cost)||0,'Note':String(lead.note||''),'Created At':now,'Updated At':now});
  wf2AddEvent_(personId,'','LEAD',leadId,'LEAD_CREATED','สร้างผู้สนใจจาก '+String(lead.source||'Other'),{},'ADMIN');
  return {ok:true,leadId:leadId,personId:personId,duplicateReviewRequired:duplicates.length>0};
}

function wf2AdminRecruitmentList_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const limit=Math.min(200,Math.max(1,Number(payload.limit)||50)),status=String(payload.status||''),query=String(payload.query||'').trim().toLowerCase();
  const persons={};wf2Rows_('Persons').forEach(r=>persons[String(r['Person ID'])]=r);
  let rows=wf2Rows_('Applicants').reverse().map(a=>{
    const p=persons[String(a['Person ID'])]||{};
    return {applicantId:String(a['Applicant ID']),personId:String(a['Person ID']),name:(String(p['First Name']||'')+' '+String(p['Last Name']||'')).trim(),nickname:String(p['Nickname']||''),phone:String(p['Phone']||''),positionCode:String(a['Position Code']||''),branchCode:String(a['Branch Code']||''),departmentCode:String(a['Department Code']||''),source:String(a['Source']||''),status:String(a['Status']||''),submittedAt:formatDateTimeForClient_(a['Submitted At']),duplicateReviewRequired:p['Duplicate Review Required']===true};
  });
  if(status)rows=rows.filter(r=>r.status===status);
  if(query)rows=rows.filter(r=>(r.applicantId+' '+r.personId+' '+r.name+' '+r.nickname+' '+r.phone).toLowerCase().indexOf(query)>=0);
  return {rows:rows.slice(0,limit),total:rows.length,serverEpochMs:Date.now()};
}

function wf2AdminTransitionApplicant_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const id=String(payload.applicantId||''),next=String(payload.status||'').toUpperCase(),rows=wf2Rows_('Applicants'),row=rows.find(r=>String(r['Applicant ID'])===id);
  if(!row)throw new Error('ไม่พบผู้สมัคร');
  const current=String(row['Status']||'');
  if(!wf2CanTransition_(current,next))throw new Error('เปลี่ยนสถานะจาก '+current+' เป็น '+next+' ไม่ได้');
  if(next==='INTERVIEW_SCHEDULED'&&!wf2Rows_('Applicant_Interviews').some(r=>String(r['Applicant ID'])===id&&['SCHEDULED','CONFIRMED'].indexOf(String(r['Status']))>=0))throw new Error('กรุณาสร้างนัดสัมภาษณ์ก่อนเปลี่ยนสถานะ');
  if(/^OFFER_/.test(next)&&!wf2Rows_('Offers').some(r=>String(r['Applicant ID'])===id&&String(r['Status'])===next))throw new Error('กรุณาบันทึก Offer ก่อนเปลี่ยนสถานะ');
  if(next==='PRE_ONBOARDING')throw new Error('กรุณาเริ่มผ่าน Onboarding workflow');
  const changes={'Status':next,'Updated At':new Date()};if(next==='SCREENING'){changes['Screened At']=new Date();changes['Screened By']='ADMIN'}if(next==='REJECTED')changes['Rejection Reason']=String(payload.reason||'');
  wf2UpdateRow_('Applicants',row._row,changes);
  wf2AddEvent_(String(row['Person ID']),'','APPLICANT',id,next,'เปลี่ยนสถานะผู้สมัครเป็น '+next,{from:current,reason:String(payload.reason||'')},'ADMIN');
  auditLogV7_('ADMIN','ADMIN','TRANSITION_APPLICANT','APPLICANT',id,{status:current},{status:next},String(payload.reason||''),String(payload.requestId||''));
  return {ok:true,applicantId:id,status:next};
}

function wf2AdminSaveInterview_(payload) {
  requireAdmin_(String(payload.adminToken||''));const data=payload.interview||{},applicantId=String(data.applicantId||''),app=wf2Rows_('Applicants').find(r=>String(r['Applicant ID'])===applicantId);
  if(!app)throw new Error('ไม่พบผู้สมัคร');
  const now=new Date(),id=String(data.interviewId||'')||wf2EntityId_('INT'),existing=wf2Rows_('Applicant_Interviews').find(r=>String(r['Interview ID'])===id);
  const record={'Interview ID':id,'Applicant ID':applicantId,'Person ID':String(app['Person ID']),'Interview Date':parseIsoDate_(data.date)||'','Interview Time':String(data.time||''),'Branch Code':validateBranchV7_(data.branchCode||app['Branch Code'],false),'Location':String(data.location||''),'Interviewer ID':String(data.interviewerId||''),'Position Code':String(data.positionCode||app['Position Code']),'Status':String(data.status||'SCHEDULED'),'Evaluation JSON':jsonCellV7_(data.evaluation||{}),'Notes':String(data.notes||''),'Strengths':String(data.strengths||''),'Concerns':String(data.concerns||''),'Relevant Experience':String(data.relevantExperience||''),'Expected Pay':Number(data.expectedPay)||0,'Negotiated Pay':Number(data.negotiatedPay)||0,'Available Start Date':parseIsoDate_(data.availableStartDate)||'','Result':String(data.result||''),'Updated At':now};
  if(existing)wf2UpdateRow_('Applicant_Interviews',existing._row,record);else{record['Created At']=now;wf2Append_('Applicant_Interviews',record)}
  if(!existing)wf2AdminTransitionApplicant_({adminToken:payload.adminToken,applicantId:applicantId,status:'INTERVIEW_SCHEDULED',requestId:payload.requestId});
  const statusMap={ATTENDED:'INTERVIEW_ATTENDED',NO_SHOW:'NO_SHOW',CANCELLED:'CANCELLED'};
  if(existing&&statusMap[record['Status']]&&wf2CanTransition_(String(app['Status']),statusMap[record['Status']]))wf2AdminTransitionApplicant_({adminToken:payload.adminToken,applicantId:applicantId,status:statusMap[record['Status']],requestId:payload.requestId});
  const result=String(record['Result']||'');if(result&&wf2CanTransition_(statusMap[record['Status']]||String(app['Status']),result))wf2AdminTransitionApplicant_({adminToken:payload.adminToken,applicantId:applicantId,status:result,reason:String(data.notes||''),requestId:payload.requestId});
  wf2AddEvent_(String(app['Person ID']),'','INTERVIEW',id,'INTERVIEW_'+String(record['Status']),'นัดสัมภาษณ์',{},'ADMIN');
  return {ok:true,interviewId:id,status:record['Status']};
}

function wf2AdminSaveOffer_(payload) {
  requireAdmin_(String(payload.adminToken||''));const data=payload.offer||{},applicantId=String(data.applicantId||''),app=wf2Rows_('Applicants').find(r=>String(r['Applicant ID'])===applicantId);
  if(!app)throw new Error('ไม่พบผู้สมัคร');
  const status=String(data.status||'OFFER_DRAFT'),now=new Date(),id=String(data.offerId||'')||wf2EntityId_('OFF'),existing=wf2Rows_('Offers').find(r=>String(r['Offer ID'])===id);
  const record={'Offer ID':id,'Applicant ID':applicantId,'Person ID':String(app['Person ID']),'Position Code':String(data.positionCode||app['Position Code']),'Branch Code':validateBranchV7_(data.branchCode||app['Branch Code'],false),'Department Code':String(data.departmentCode||app['Department Code']),'Wage Type':String(data.wageType||''),'Wage Amount':Number(data.wageAmount)||0,'Start Date':parseIsoDate_(data.startDate)||'','Offer Date':parseIsoDate_(data.offerDate)||now,'Accepted Date':status==='OFFER_ACCEPTED'?now:'','Status':status,'Note':String(data.note||''),'Updated At':now};
  if(existing)wf2UpdateRow_('Offers',existing._row,record);else{record['Created At']=now;wf2Append_('Offers',record)}
  const current=String(app['Status']||'');if(current!==status&&wf2CanTransition_(current,status))wf2AdminTransitionApplicant_({adminToken:payload.adminToken,applicantId:applicantId,status:status,requestId:payload.requestId});
  wf2AddEvent_(String(app['Person ID']),'','OFFER',id,status,'อัปเดตข้อเสนอเป็น '+status,{},'ADMIN');
  return {ok:true,offerId:id,status:status};
}

function wf2AdminStartOnboarding_(payload) {
  requireAdmin_(String(payload.adminToken||''));const applicantId=String(payload.applicantId||''),app=wf2Rows_('Applicants').find(r=>String(r['Applicant ID'])===applicantId);
  if(!app||String(app['Status'])!=='OFFER_ACCEPTED')throw new Error('เริ่ม Onboarding ได้หลังผู้สมัครตอบรับข้อเสนอแล้ว');
  const person=wf2Rows_('Persons').find(r=>String(r['Person ID'])===String(app['Person ID'])),offer=wf2Rows_('Offers').reverse().find(r=>String(r['Applicant ID'])===applicantId&&String(r['Status'])==='OFFER_ACCEPTED');
  if(!person||!offer)throw new Error('ข้อมูล Person/Offer ไม่ครบ');
  const regId='REG-'+Utilities.formatDate(new Date(),TZ,'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,6).toUpperCase(),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REGISTRATION_SHEET);
  if(!sh)throw new Error('ไม่พบ Employee_Registrations');
  const headers=wf2Headers_(sh),record={'Registration ID':regId,'Submitted At':new Date(),'Status':'DRAFT','Branch':String(offer['Branch Code']),'First Name':String(person['First Name']),'Last Name':String(person['Last Name']),'Nickname':String(person['Nickname']),'Phone':String(person['Phone']),'Position':String(offer['Position Code']),'Birth Date':person['Birth Date'],'Start Date':offer['Start Date'],'Wage Type':String(offer['Wage Type']),'Wage Amount':Number(offer['Wage Amount'])||0,'Department':String(offer['Department Code']),'Person ID':String(app['Person ID']),'Applicant ID':applicantId};
  sh.appendRow(headers.map(h=>Object.prototype.hasOwnProperty.call(record,h)?record[h]:''));
  wf2UpdateRow_('Applicants',app._row,{'Status':'PRE_ONBOARDING','Updated At':new Date()});
  wf2UpdateRow_('Persons',person._row,{'Lifecycle Stage':'PRE_ONBOARDING','Updated At':new Date()});
  wf2AddWorkItem_('ONBOARDING',regId,'กรอกข้อมูล Onboarding ให้ครบ','ADMIN','',new Date(Date.now()+3*24*60*60*1000),'NORMAL',String(offer['Branch Code']),String(offer['Department Code']));
  wf2AddEvent_(String(app['Person ID']),'','REGISTRATION',regId,'PRE_ONBOARDING','เริ่ม Onboarding โดยใช้ข้อมูลเดิมจากผู้สมัคร',{},'ADMIN');
  return {ok:true,registrationId:regId,personId:String(app['Person ID']),applicantId:applicantId,status:'PRE_ONBOARDING'};
}

function wf2AdminGetStaffingTargets_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const employees=getEmployeesAdmin_().filter(e=>e.active),applicants=wf2Rows_('Applicants').filter(a=>['REJECTED','OFFER_DECLINED','HIRED','PRE_ONBOARDING'].indexOf(String(a['Status']))<0),targets=wf2Rows_('Staffing_Targets').filter(r=>r['Active']!==false);
  const rows=targets.map(r=>{
    const branch=String(r['Branch Code']||''),department=String(r['Department Code']||''),position=String(r['Position Code']||''),matches=e=>(!branch||e.branch===branch)&&(!department||e.department===department)&&(!position||e.position===position),active=employees.filter(e=>matches(e)&&e.employmentStatus!=='PROBATION').length,probation=employees.filter(e=>matches(e)&&e.employmentStatus==='PROBATION').length,pipeline=applicants.filter(a=>(!branch||String(a['Branch Code'])===branch)&&(!department||String(a['Department Code'])===department)&&(!position||String(a['Position Code'])===position)).length,target=Number(r['Target Headcount'])||0;
    return {staffingTargetId:String(r['Staffing Target ID']),branchCode:branch,departmentCode:department,positionCode:position,targetHeadcount:target,activeHeadcount:active,probationHeadcount:probation,openVacancy:Math.max(0,target-active-probation),gap:target-active-probation,pipelineCount:pipeline,effectiveStart:formatDateInputForClient_(r['Effective Start']),effectiveEnd:formatDateInputForClient_(r['Effective End'])};
  });
  return {rows:rows,serverEpochMs:Date.now()};
}

function wf2AdminSaveStaffingTarget_(payload) {
  requireAdmin_(String(payload.adminToken||''));const data=payload.target||{},branch=validateBranchV7_(data.branchCode,false),department=validateDepartmentV7_(data.departmentCode,false),position=String(data.positionCode||'');
  if(!wf2ActivePositions_().some(p=>p.code===position))throw new Error('ตำแหน่งไม่ถูกต้อง');
  const target=Math.max(0,Math.floor(Number(data.targetHeadcount)||0)),id=String(data.staffingTargetId||'')||wf2EntityId_('STF'),existing=wf2Rows_('Staffing_Targets').find(r=>String(r['Staffing Target ID'])===id),record={'Staffing Target ID':id,'Branch Code':branch,'Department Code':department,'Position Code':position,'Target Headcount':target,'Effective Start':parseIsoDate_(data.effectiveStart)||new Date(),'Effective End':parseIsoDate_(data.effectiveEnd)||'','Active':data.active!==false,'Updated At':new Date(),'Updated By':'ADMIN'};
  if(existing)wf2UpdateRow_('Staffing_Targets',existing._row,record);else wf2Append_('Staffing_Targets',record);
  auditLogV7_('ADMIN','ADMIN','SAVE_STAFFING_TARGET','STAFFING_TARGET',id,existing||'',record,String(data.reason||''),String(payload.requestId||''));return{ok:true,staffingTargetId:id};
}

function wf2AdminDashboard_(payload) {
  requireAdmin_(String(payload.adminToken||''));
  const applicants=wf2Rows_('Applicants'),interviews=wf2Rows_('Applicant_Interviews'),offers=wf2Rows_('Offers'),work=wf2Rows_('Work_Queue'),employees=getEmployeesAdmin_();
  const count=(rows,key,value)=>rows.filter(r=>String(r[key])===value).length;
  const scheduled=count(interviews,'Status','SCHEDULED')+count(interviews,'Status','CONFIRMED'),attended=count(interviews,'Status','ATTENDED');
  const offerSent=count(offers,'Status','OFFER_SENT')+count(offers,'Status','OFFER_ACCEPTED'),offerAccepted=count(offers,'Status','OFFER_ACCEPTED');
  const submitted=applicants.length,hires=count(applicants,'Status','HIRED')+count(applicants,'Status','PRE_ONBOARDING');
  return {workforce:{total:employees.length,active:employees.filter(e=>e.active&&e.employmentStatus!=='PROBATION').length,probation:employees.filter(e=>e.employmentStatus==='PROBATION').length,inactive:employees.filter(e=>!e.active).length},recruitment:{applicants:submitted,screening:count(applicants,'Status','SCREENING'),interviews:scheduled,interviewShowRate:wf2Ratio_(attended,scheduled),passed:count(applicants,'Status','PASSED'),hired:hires,hireConversionRate:wf2Ratio_(hires,submitted),offerAcceptanceRate:wf2Ratio_(offerAccepted,offerSent)},workQueue:{open:work.filter(r=>String(r['Status'])!=='DONE'&&String(r['Status'])!=='CANCELLED').length,urgent:work.filter(r=>String(r['Priority'])==='URGENT'&&String(r['Status'])!=='DONE').length},dataAsOf:new Date().toISOString(),serverEpochMs:Date.now()};
}

function wf2AdminGetWorkQueue_(payload) {
  requireAdmin_(String(payload.adminToken||''));const status=String(payload.status||'OPEN'),limit=Math.min(200,Math.max(1,Number(payload.limit)||100));
  let rows=wf2Rows_('Work_Queue').reverse();if(status==='OPEN')rows=rows.filter(r=>['DONE','CANCELLED'].indexOf(String(r['Status']))<0);else if(status)rows=rows.filter(r=>String(r['Status'])===status);
  return {rows:rows.slice(0,limit).map(r=>({workItemId:String(r['Work Item ID']),entityType:String(r['Entity Type']),entityId:String(r['Entity ID']),title:String(r['Title']),assignedRole:String(r['Assigned Role']),assignedUser:String(r['Assigned User']),dueAt:formatDateTimeForClient_(r['Due At']),priority:String(r['Priority']),status:String(r['Status']),branchCode:String(r['Branch Code']),departmentCode:String(r['Department Code'])})),total:rows.length};
}

function wf2DocumentCreateUploadSession_(payload) {
  const actor=wf2RequireDocumentActor_(payload),data=payload.document||payload,max=Number(wf2Setting_('DOCUMENT_MAX_BYTES'))||10485760;
  wf2RequireFlag_('GCS_DOCUMENTS_ENABLED');
  const mime=String(data.mimeType||'').toLowerCase(),size=Number(data.size)||0,name=String(data.fileName||'');
  if(['image/jpeg','image/png','image/webp','application/pdf'].indexOf(mime)<0)throw new Error('รองรับเฉพาะ JPG, PNG, WEBP และ PDF');
  if(size<=0||size>max)throw new Error('ขนาดไฟล์เกินกำหนด');
  const documentId=wf2EntityId_('DOC'),ownerType=actor.type==='APPLICANT'?'APPLICANT':String(data.ownerType||'').toUpperCase(),ownerId=actor.type==='APPLICANT'?actor.id:String(data.ownerId||'');
  wf2AssertDocumentOwner_(actor,ownerType,ownerId);
  const objectKey=wf2BuildObjectKey_(ownerType,ownerId,documentId,name),request={documentId:documentId,objectKey:objectKey,fileName:name,mimeType:mime,size:size};
  const signed=wf2FileServiceRequest_('/v1/uploads',request);
  wf2Append_('Documents',{'Document ID':documentId,'Person ID':actor.type==='APPLICANT'?actor.personId:String(data.personId||''),'Applicant ID':actor.type==='APPLICANT'?actor.id:String(data.applicantId||''),'Registration ID':String(data.registrationId||''),'Employee ID':String(data.employeeId||''),'Owner Type':ownerType,'Owner ID':ownerId,'Type':String(data.documentType||''),'Label':String(data.label||''),'Original File Name':name,'MIME Type':mime,'Size':size,'Storage Provider':'GCS','Bucket':String(signed.bucket||''),'Object Key':objectKey,'Uploaded By':actor.id,'Status':'PENDING_UPLOAD','Required':data.required===true,'Version':1,'Created At':new Date(),'Updated At':new Date()});
  return {documentId:documentId,objectKey:objectKey,uploadUrl:signed.uploadUrl,expiresAt:signed.expiresAt,requiredHeaders:signed.requiredHeaders||{}};
}

function wf2DocumentFinalizeUpload_(payload) {
  const actor=wf2RequireDocumentActor_(payload);wf2RequireFlag_('GCS_DOCUMENTS_ENABLED');
  const id=String(payload.documentId||''),row=wf2Rows_('Documents').find(r=>String(r['Document ID'])===id);if(!row)throw new Error('ไม่พบเอกสาร');
  wf2AssertDocumentOwner_(actor,String(row['Owner Type']),String(row['Owner ID']));
  const verified=wf2FileServiceRequest_('/v1/uploads/finalize',{documentId:id,objectKey:String(row['Object Key']),expectedSize:Number(row['Size'])||0,expectedMimeType:String(row['MIME Type'])});
  wf2UpdateRow_('Documents',row._row,{'Checksum':String(verified.checksum||''),'Uploaded At':new Date(),'Status':'ACTIVE','Updated At':new Date()});
  return {ok:true,documentId:id,status:'ACTIVE'};
}

function wf2DocumentGetViewUrl_(payload) {
  const actor=wf2RequireDocumentActor_(payload);wf2RequireFlag_('GCS_DOCUMENTS_ENABLED');
  const id=String(payload.documentId||''),row=wf2Rows_('Documents').find(r=>String(r['Document ID'])===id);if(!row||['ACTIVE','VERIFIED'].indexOf(String(row['Status']))<0)throw new Error('ไม่พบเอกสาร');
  wf2AssertDocumentOwner_(actor,String(row['Owner Type']),String(row['Owner ID']));
  const signed=wf2FileServiceRequest_('/v1/views',{documentId:id,objectKey:String(row['Object Key'])});
  return {url:signed.url,expiresAt:signed.expiresAt,mimeType:String(row['MIME Type']),fileName:String(row['Original File Name'])};
}

function wf2RequireDocumentActor_(payload) {
  const adminToken=String(payload.adminToken||'');if(adminToken){requireAdmin_(adminToken);return{type:'ADMIN',id:'ADMIN'}}
  const portalToken=String(payload.portalToken||'');if(portalToken){const e=requirePortalV7_(portalToken);return{type:'EMPLOYEE',id:e.id,role:e.accessRole}}
  const applicantToken=String(payload.applicantUploadToken||'');if(applicantToken){const raw=CacheService.getScriptCache().get('WF2_APPLICANT_UPLOAD_'+applicantToken);if(raw){const data=JSON.parse(raw);return{type:'APPLICANT',id:String(data.applicantId),personId:String(data.personId)}}}
  throw new Error('ไม่มีสิทธิ์เข้าถึงเอกสาร');
}
function wf2AssertDocumentOwner_(actor,ownerType,ownerId){if(actor.type==='ADMIN')return;if(actor.type==='EMPLOYEE'&&(ownerType!=='EMPLOYEE'||String(ownerId)!==String(actor.id)))throw new Error('ไม่มีสิทธิ์เข้าถึงเอกสารนี้');if(actor.type==='APPLICANT'&&(ownerType!=='APPLICANT'||String(ownerId)!==String(actor.id)))throw new Error('ไม่มีสิทธิ์เข้าถึงเอกสารนี้')}
function wf2FileServiceRequest_(path,body) {
  const props=PropertiesService.getScriptProperties(),base=String(props.getProperty('FILE_SERVICE_URL')||'').replace(/\/$/,''),token=String(props.getProperty('FILE_SERVICE_AUTH_TOKEN')||'');
  if(!base||!token)throw new Error('ยังไม่ได้ตั้งค่า GCS File Service ใน STAGING');
  const response=UrlFetchApp.fetch(base+path,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify(body),muteHttpExceptions:true});
  const code=response.getResponseCode();let data={};try{data=JSON.parse(response.getContentText()||'{}')}catch(e){}
  if(code<200||code>=300)throw new Error(String(data.error||'File Service ไม่พร้อมใช้งาน'));
  return data;
}

function wf2BackfillLegacyPeople_() {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),emp=ss.getSheetByName(EMPLOYEE_SHEET),reg=ss.getSheetByName(REGISTRATION_SHEET);
  const existing=wf2Rows_('Persons'),personIds=new Set(existing.map(p=>String(p['Person ID']))),byEmployee={};
  let max=existing.reduce((m,r)=>Math.max(m,Number(String(r['Person ID']||'').replace(/^P/,''))||0),0),created=0,linkedEmployees=0,linkedRegistrations=0;
  function next(){max++;return'P'+String(max).padStart(6,'0')}
  if(emp&&emp.getLastRow()>=2){
    const headers=wf2Headers_(emp),personCol=headers.indexOf('Person ID')+1,rows=emp.getRange(2,1,emp.getLastRow()-1,headers.length).getValues();
    rows.forEach((r,i)=>{const employeeId=String(r[0]||'');if(!employeeId)return;let personId=personCol?String(r[personCol-1]||''):'';if(!personId){personId=next();emp.getRange(i+2,personCol).setValue(personId);linkedEmployees++}byEmployee[employeeId]=personId;if(!personIds.has(personId)){const full=String(r[1]||'').trim().split(/\s+/);wf2Append_('Persons',{'Person ID':personId,'First Name':String(r[11]||full[0]||''),'Last Name':String(r[12]||full.slice(1).join(' ')),'Nickname':String(r[7]||''),'Birth Date':r[16]||'','Phone':String(r[8]||''),'Phone Normalized':wf2NormalizePhone_(r[8]),'Lifecycle Stage':r[2]===false?'EXITED':String(r[24]||'ACTIVE_EMPLOYEE'),'Identity Status':'ACTIVE','Duplicate Review Required':false,'Created At':new Date(),'Updated At':new Date(),'Created By':'MIGRATION','Source':'LEGACY_EMPLOYEE'});personIds.add(personId);created++}});
  }
  if(reg&&reg.getLastRow()>=2){
    const headers=wf2Headers_(reg),personCol=headers.indexOf('Person ID')+1,employeeCol=headers.indexOf('Employee ID')+1,rows=reg.getRange(2,1,reg.getLastRow()-1,headers.length).getValues();
    rows.forEach((r,i)=>{if(!String(r[0]||''))return;let personId=String(r[personCol-1]||''),employeeId=employeeCol?String(r[employeeCol-1]||''):'';if(!personId&&employeeId&&byEmployee[employeeId])personId=byEmployee[employeeId];if(!personId)personId=next();if(!String(r[personCol-1]||'')){reg.getRange(i+2,personCol).setValue(personId);linkedRegistrations++}if(!personIds.has(personId)){wf2Append_('Persons',{'Person ID':personId,'First Name':String(r[4]||''),'Last Name':String(r[5]||''),'Nickname':String(r[6]||''),'Birth Date':r[10]||'','Phone':String(r[7]||''),'Phone Normalized':wf2NormalizePhone_(r[7]),'Lifecycle Stage':String(r[2])==='APPROVED'?'ACTIVE_EMPLOYEE':'APPLICANT','Identity Status':'ACTIVE','Duplicate Review Required':false,'Created At':new Date(),'Updated At':new Date(),'Created By':'MIGRATION','Source':'LEGACY_REGISTRATION'});personIds.add(personId);created++}});
  }
  return {personsCreated:created,employeesLinked:linkedEmployees,registrationsLinked:linkedRegistrations};
}

function wf2DuplicateCandidates_(phone,email){return wf2Rows_('Persons').filter(r=>(phone&&String(r['Phone Normalized'])===phone)||(email&&String(r['Email Normalized']).toLowerCase()===email)).map(r=>String(r['Person ID']))}
function wf2NextPersonId_(){const lock=LockService.getScriptLock();lock.waitLock(10000);try{const props=PropertiesService.getScriptProperties(),sheetMax=wf2Rows_('Persons').reduce((m,r)=>Math.max(m,Number(String(r['Person ID']||'').replace(/^P/,''))||0),0),reserved=Number(props.getProperty('WF2_PERSON_COUNTER'))||0,next=Math.max(sheetMax,reserved)+1;props.setProperty('WF2_PERSON_COUNTER',String(next));return'P'+String(next).padStart(6,'0')}finally{try{lock.releaseLock()}catch(e){}}}
function wf2EntityId_(prefix){return prefix+'-'+Utilities.formatDate(new Date(),TZ,'yyyyMMddHHmmss')+'-'+Utilities.getUuid().slice(0,6).toUpperCase()}
function wf2NormalizePhone_(value){let s=String(value||'').replace(/\D/g,'');if(s.indexOf('66')===0)s='0'+s.slice(2);return s}
function wf2CanTransition_(from,to){const allowed=WF2_APPLICANT_TRANSITIONS_[String(from||'')]||[];return allowed.indexOf(String(to||''))>=0}
function wf2Ratio_(numerator,denominator){const n=Number(numerator)||0,d=Number(denominator)||0;return d>0?Math.round(n/d*1000)/10:null}
function wf2SafeFileName_(name){const clean=String(name||'file').normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^[-.]+|[-.]+$/g,'').slice(0,120);return clean||'file'}
function wf2BuildObjectKey_(ownerType,ownerId,documentId,fileName){const map={PERSON:'persons',APPLICANT:'applicants',EMPLOYEE:'employees',LEAVE:'leave',REGISTRATION:'registrations'},root=map[String(ownerType||'').toUpperCase()];if(!root||!/^[A-Za-z0-9_-]+$/.test(String(ownerId))||!/^[A-Za-z0-9_-]+$/.test(String(documentId)))throw new Error('Document owner ไม่ถูกต้อง');return root+'/'+ownerId+'/documents/'+documentId+'/'+wf2SafeFileName_(fileName)}
function wf2ValidateWeights_(definitions){const active=(definitions||[]).filter(x=>x&&x.active!==false&&Number(x.weight)>0),total=active.reduce((s,x)=>s+Number(x.weight||0),0);return{valid:Math.abs(total-100)<0.0001,total:total}}

function wf2AddEvent_(personId,employeeId,entityType,entityId,eventType,summary,metadata,actor){wf2Append_('Lifecycle_Events',{'Event ID':wf2EntityId_('EVT'),'Person ID':personId,'Employee ID':employeeId,'Entity Type':entityType,'Entity ID':entityId,'Event Type':eventType,'Event Date':new Date(),'Summary':summary,'Metadata JSON':jsonCellV7_(metadata||{}),'Created By':actor,'Created At':new Date()})}
function wf2AddWorkItem_(entityType,entityId,title,role,user,dueAt,priority,branch,department){wf2Append_('Work_Queue',{'Work Item ID':wf2EntityId_('WRK'),'Entity Type':entityType,'Entity ID':entityId,'Title':title,'Assigned Role':role,'Assigned User':user,'Due At':dueAt,'Priority':priority,'Status':'OPEN','Branch Code':branch,'Department Code':department,'Created At':new Date(),'Updated At':new Date()})}

function wf2KpiDictionary_(){return[
  {key:'attendance_rate',name:'Attendance Rate',source:'Schedules + Attendance',formula:'present scheduled shifts / required scheduled shifts',unit:'PERCENT'},
  {key:'on_time_rate',name:'On-time Rate',source:'Schedules + Attendance',formula:'on-time check-ins / valid required check-ins',unit:'PERCENT'},
  {key:'activity_submission_rate',name:'Activity Submission Rate',source:'Activity_Reports',formula:'submitted daily reports / required reports',unit:'PERCENT'},
  {key:'activity_completion_rate',name:'Activity Completion Rate',source:'Activity_Items',formula:'completed activity items / assigned activity items',unit:'PERCENT'},
  {key:'interview_show_rate',name:'Interview Show Rate',source:'Applicant_Interviews',formula:'attended interviews / scheduled interviews',unit:'PERCENT'},
  {key:'offer_acceptance_rate',name:'Offer Acceptance Rate',source:'Offers',formula:'accepted offers / sent offers',unit:'PERCENT'},
  {key:'retention_90_day',name:'90-day Retention',source:'Employees + Employee_Exits',formula:'employees active after 90 days / employees started 90+ days ago',unit:'PERCENT'}
]}
function wf2SeedKpis_(){const existing=wf2Rows_('KPI_Definitions');if(existing.length)return 0;const seeds=wf2KpiDictionary_();seeds.forEach(k=>wf2Append_('KPI_Definitions',{'KPI Key':k.key,'Name':k.name,'Description':k.formula,'Source':k.source,'Formula Type':'RATIO','Formula':k.formula,'Numerator':k.formula.split(' / ')[0],'Denominator':k.formula.split(' / ')[1]||'','Unit':k.unit,'Period':'CONFIGURABLE','Direction':'HIGHER_IS_BETTER','Weight':0,'Owner':'HR','Data Quality Status':'NOT_EVALUATED','Active':true,'Created At':new Date(),'Updated At':new Date()}));return seeds.length}
function wf2SeedPositions_(){if(wf2Rows_('Positions').length)return 0;const seeds=[['MANAGER','ผู้จัดการ',''],['SUPERVISOR','หัวหน้างาน',''],['STAFF','พนักงาน','']];seeds.forEach((p,i)=>wf2Append_('Positions',{'Position Code':p[0],'Position Name':p[1],'Department Code':p[2],'Active':true,'Sort Order':i+1,'Created At':new Date(),'Updated At':new Date()}));return seeds.length}

if(typeof module!=='undefined'&&module.exports){module.exports={normalizePhone:wf2NormalizePhone_,canTransition:wf2CanTransition_,ratio:wf2Ratio_,safeFileName:wf2SafeFileName_,buildObjectKey:wf2BuildObjectKey_,validateWeights:wf2ValidateWeights_}}
