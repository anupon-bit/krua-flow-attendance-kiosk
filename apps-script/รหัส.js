// Krua Flow Attendance Backend V7.3 - Workforce Management + Employee/Manager Portal + Schedule/Leave/Payroll Batch Control
const SPREADSHEET_ID = '13Nsy0aSkAm-Qg7vCHj_vtEOArwtghFp-XhlYihyQTgU';
const ATTENDANCE_SHEET = 'Attendance';
const EMPLOYEE_SHEET = 'Employees';
const SETTINGS_SHEET = 'Settings';
const REGISTRATION_SHEET = 'Employee_Registrations';
const LEAVE_SHEET = 'Leave_Requests';
const EMPLOYEE_PAY_ITEMS_SHEET = 'Employee_Pay_Items';
const PAYROLL_ADJUSTMENTS_SHEET = 'Payroll_Adjustments';
const EMPLOYEE_DOCUMENTS_SHEET = 'Employee_Documents';
const TZ = 'Asia/Bangkok';

function doGet(e) {
  if (e && e.parameter && String(e.parameter.api || '') === 'status') {
    return apiStatusResponse_(e);
  }
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Krua Flow Attendance Admin')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  let requestId = '';
  let result = { ready:true, ok:false, error:'ไม่สามารถประมวลผลคำขอได้' };
  try {
    const raw = e && e.parameter ? String(e.parameter.payload || '') : '';
    if (!raw) throw new Error('ไม่พบ payload');
    const payload = JSON.parse(raw);
    requestId = String(payload.requestId || '').trim();
    if (!requestId) throw new Error('ไม่พบ requestId');
    const data = apiHandlePost_(payload);
    result = { ready:true, ok:true, data:data };
    apiPutResult_(requestId, result); // fallback compatibility for kiosk pages still using polling
  } catch (err) {
    result = { ready:true, ok:false, error:err && err.message ? err.message : String(err) };
    if (requestId) apiPutResult_(requestId, result);
  }
  return apiPostMessageResponse_(requestId, result);
}

function apiPostMessageResponse_(requestId, result) {
  const message = { type:'KruaFlowApiResult', requestId:String(requestId || ''), result:result || {ready:true,ok:false,error:'ไม่พบผลลัพธ์'} };
  const json = JSON.stringify(message).replace(/</g, '\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>try{parent.postMessage(' + json + ',"*")}catch(e){}<\/script>');
}

function apiHandlePost_(payload) {
  const op = String(payload.op || '');
  if (op === 'activate') return apiActivate_(payload);
  if (op === 'bootstrap') return apiBootstrap_(payload);
  if (op === 'validatePin') return apiValidatePin_(payload);
  if (op === 'recordAttendance') return apiRecordAttendance_(payload);
  if (op === 'employeeRegistrationSubmit') return apiEmployeeRegistrationSubmit_(payload);
  if (op === 'employeeRegistrationUploadDocument') return apiEmployeeRegistrationUploadDocument_(payload);
  if (op === 'leaveBootstrap') return apiLeaveBootstrap_(payload);
  if (op === 'leaveSubmit') return apiLeaveSubmit_(payload);

  // Admin API สำหรับหน้า GitHub Pages /admin.html
  if (op === 'adminLogin') return apiAdminLogin_(payload);
  if (op === 'adminLoginFast') return apiAdminLoginFast_(payload);
  if (op === 'adminSummary') return apiAdminSummary_(payload);
  if (op === 'adminGetRegistration') return apiAdminGetRegistration_(payload);
  if (op === 'adminGetRegistrationDocuments') return apiAdminGetRegistrationDocuments_(payload);
  if (op === 'adminGetDocument') return apiAdminGetDocument_(payload);
  if (op === 'adminGetEmployee') return apiAdminGetEmployee_(payload);
  if (op === 'adminGetAttendance') return apiAdminGetAttendance_(payload);
  if (op === 'adminGetEmployeeAttendanceRange') return apiAdminGetEmployeeAttendanceRange_(payload);
  if (op === 'adminGetLeaveRequests') return apiAdminGetLeaveRequests_(payload);
  if (op === 'adminReviewLeave') return apiAdminReviewLeave_(payload);
  if (op === 'adminGetPayrollPreview') return apiAdminGetPayrollPreview_(payload);
  if (op === 'adminGetEmployeePayItems') return apiAdminGetEmployeePayItems_(payload);
  if (op === 'adminSaveEmployeePayItem') return apiAdminSaveEmployeePayItem_(payload);
  if (op === 'adminDeleteEmployeePayItem') return apiAdminDeleteEmployeePayItem_(payload);
  if (op === 'adminAddPayrollAdjustment') return apiAdminAddPayrollAdjustment_(payload);
  if (op === 'adminDeletePayrollAdjustment') return apiAdminDeletePayrollAdjustment_(payload);
  if (op === 'adminApproveRegistrationFast') return apiAdminApproveRegistrationFast_(payload);
  if (op === 'adminDashboard') return apiAdminDashboard_(payload);
  if (op === 'adminGetPhoto') return apiAdminGetPhoto_(payload);
  if (op === 'adminAddEmployee') return apiAdminAddEmployee_(payload);
  if (op === 'adminSetEmployeeActive') return apiAdminSetEmployeeActive_(payload);
  if (op === 'adminSetEmployeePin') return apiAdminSetEmployeePin_(payload);
  if (op === 'adminUpdateEmployeeProfile') return apiAdminUpdateEmployeeProfile_(payload);
  if (op === 'adminUpdateRegistration') return apiAdminUpdateRegistration_(payload);
  if (op === 'adminApproveRegistration') return apiAdminApproveRegistration_(payload);
  if (op === 'adminRejectRegistration') return apiAdminRejectRegistration_(payload);
  if (op === 'adminChangePin') return apiAdminChangePin_(payload);
  if (op === 'adminLogout') return apiAdminLogout_(payload);

  const v7 = apiV7HandlePost_(payload);
  if (v7 !== null) return v7;

  throw new Error('คำสั่ง API ไม่ถูกต้อง');
}

function apiStatusResponse_(e) {
  const requestId = String((e.parameter && e.parameter.requestId) || '').trim();
  let callback = String((e.parameter && e.parameter.callback) || 'callback').trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) callback = 'callback';
  let result = { ready:false };
  if (requestId) {
    const raw = CacheService.getScriptCache().get(apiResultKey_(requestId));
    if (raw) {
      try { result = JSON.parse(raw); } catch (err) { result = { ready:true, ok:false, error:'อ่านผลลัพธ์ไม่สำเร็จ' }; }
    }
  }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function apiPutResult_(requestId, value) {
  CacheService.getScriptCache().put(apiResultKey_(requestId), JSON.stringify(value), 300);
}

function apiResultKey_(requestId) {
  return 'PWA_API_' + String(requestId).replace(/[^A-Za-z0-9_-]/g,'').slice(0,120);
}

function apiActivate_(payload) {
  const adminPin = String(payload.adminPin || '');
  const expected = String(PropertiesService.getScriptProperties().getProperty('ADMIN_PIN') || '');
  if (!/^\d{6}$/.test(adminPin) || !expected || adminPin !== expected) throw new Error('PIN Admin ไม่ถูกต้อง');

  const token = String(payload.deviceToken || '');
  if (token.length < 32) throw new Error('Device Token ไม่ถูกต้อง');

  const tokenHash = hashDeviceToken_(token);
  const devices = getRegisteredDevices_();
  let device = devices.find(d => d && d.hash === tokenHash);

  if (!device) {
    if (devices.length >= 20) throw new Error('ลงทะเบียนเครื่องครบ 20 เครื่องแล้ว กรุณาติดต่อ Admin');
    device = {
      hash: tokenHash,
      deviceId: nextDeviceId_(devices),
      registeredAt: new Date().toISOString()
    };
    devices.push(device);
    saveRegisteredDevices_(devices);
  }

  return { ok:true, deviceId:device.deviceId, serverEpochMs:Date.now() };
}

function apiBootstrap_(payload) {
  const device = verifyDeviceToken_(payload.deviceToken);
  const cfg = getPublicConfig();
  return {
    ok:true,
    deviceId:device.deviceId || cfg.deviceId,
    actions:cfg.actions,
    employees:getEmployees(),
    serverEpochMs:Date.now()
  };
}

function apiValidatePin_(payload) {
  verifyDeviceToken_(payload.deviceToken);
  const r = validateEmployeePin(payload.employeeId, payload.employeePin);
  if (!r.ok) throw new Error(r.message || 'ชื่อพนักงานและรหัสไม่ตรงกัน');
  return { ok:true, employeeId:r.employeeId, employeeName:r.employeeName, serverEpochMs:Date.now() };
}

function apiRecordAttendance_(payload) {
  const device = verifyDeviceToken_(payload.deviceToken);
  payload = payload || {};
  payload.deviceId = device.deviceId || payload.deviceId || 'KIOSK';
  return recordAttendanceCore_(payload);
}


function apiEmployeeRegistrationSubmit_(payload) {
  const r = submitEmployeeRegistration_(payload && payload.registration ? payload.registration : {});
  return { ok:true, registrationId:r.registrationId, serverEpochMs:Date.now() };
}

function apiEmployeeRegistrationUploadDocument_(payload) {
  const r = uploadEmployeeRegistrationDocument_(String(payload.registrationId || ''), payload.document || {});
  return { ok:true, documentId:r.documentId, serverEpochMs:Date.now() };
}

function apiAdminGetRegistrationDocuments_(payload) {
  return adminGetRegistrationDocuments_(String(payload.adminToken || ''), String(payload.registrationId || ''), String(payload.employeeId || ''));
}

function apiAdminGetDocument_(payload) {
  return adminGetDocument_(String(payload.adminToken || ''), String(payload.fileId || ''));
}


function apiLeaveBootstrap_(payload) {
  return { ok:true, employees:getEmployees().map(e => ({id:e.id,name:e.name,nickname:e.nickname||''})), branches:getBranchesV7_(false), departments:getDepartmentsV7_(false), shifts:getShiftsV7_(false), serverEpochMs:Date.now() };
}

function apiLeaveSubmit_(payload) {
  const r = submitLeaveRequestV7_(payload && payload.leave ? payload.leave : {}, {source:'LEGACY_LEAVE_FORM',requestId:String(payload.requestId||'')});
  return { ok:true, leaveId:r.leaveId, serverEpochMs:Date.now() };
}

function apiAdminGetLeaveRequests_(payload) {
  requireAdmin_(String(payload.adminToken || ''));
  return leaveRowsV7_({status:String(payload.status || 'PENDING')});
}

function apiAdminReviewLeave_(payload) {
  return adminReviewLeaveV7_(payload);
}

function apiAdminGetPayrollPreview_(payload) {
  return adminGetPayrollPreview_(String(payload.adminToken || ''), String(payload.employeeId || ''), String(payload.startDate || ''), String(payload.endDate || ''), String(payload.payDate || ''));
}

function apiAdminGetEmployeePayItems_(payload) {
  return adminGetEmployeePayItems_(String(payload.adminToken || ''), String(payload.employeeId || ''));
}

function apiAdminSaveEmployeePayItem_(payload) {
  return adminSaveEmployeePayItem_(String(payload.adminToken || ''), String(payload.employeeId || ''), payload.item || {});
}

function apiAdminDeleteEmployeePayItem_(payload) {
  return adminDeleteEmployeePayItem_(String(payload.adminToken || ''), String(payload.itemId || ''));
}

function apiAdminAddPayrollAdjustment_(payload) {
  return adminAddPayrollAdjustment_(String(payload.adminToken || ''), payload.adjustment || {});
}

function apiAdminDeletePayrollAdjustment_(payload) {
  return adminDeletePayrollAdjustment_(String(payload.adminToken || ''), String(payload.adjustmentId || ''));
}

function apiAdminLogin_(payload) {
  const r = adminLogin(String(payload.adminPin || ''));
  if (!r || !r.ok) throw new Error('PIN Admin ไม่ถูกต้อง');
  return { ok:true, token:r.token, expiresIn:r.expiresIn, serverEpochMs:Date.now() };
}

function apiAdminLoginFast_(payload) {
  const r = adminLogin(String(payload.adminPin || ''));
  if (!r || !r.ok) throw new Error('PIN Admin ไม่ถูกต้อง');
  const summary = adminGetFastSummary_(r.token, false);
  return { ok:true, token:r.token, expiresIn:r.expiresIn, summary:summary, serverEpochMs:Date.now() };
}

function apiAdminSummary_(payload) {
  return adminGetFastSummary_(String(payload.adminToken || ''), false);
}

function apiAdminGetRegistration_(payload) {
  return adminGetRegistrationDetail_(String(payload.adminToken || ''), String(payload.registrationId || ''));
}

function apiAdminGetEmployee_(payload) {
  return adminGetEmployeeDetail_(String(payload.adminToken || ''), String(payload.employeeId || ''));
}

function apiAdminGetAttendance_(payload) {
  return adminGetAttendanceLatest_(String(payload.adminToken || ''), Number(payload.limit) || 50);
}

function apiAdminGetEmployeeAttendanceRange_(payload) {
  return adminGetEmployeeAttendanceRange_(
    String(payload.adminToken || ''),
    String(payload.employeeId || ''),
    String(payload.startDate || ''),
    String(payload.endDate || '')
  );
}

function apiAdminApproveRegistrationFast_(payload) {
  return adminApproveRegistrationFast_(String(payload.adminToken || ''), String(payload.registrationId || ''), payload.employee || {}, payload.registration || {});
}

function apiAdminDashboard_(payload) {
  const r = adminGetDashboard(String(payload.adminToken || ''));
  r.serverEpochMs = Date.now();
  return r;
}

function apiAdminGetPhoto_(payload) {
  requireAdmin_(String(payload.adminToken || ''));
  const fileId = String(payload.fileId || '').trim();
  if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) throw new Error('Photo File ID ไม่ถูกต้อง');
  const photoData = fileToDataUrl_(fileId);
  if (!photoData) throw new Error('ไม่สามารถอ่านรูปภาพได้');
  return { ok:true, photoData:photoData, serverEpochMs:Date.now() };
}

function apiAdminAddEmployee_(payload) {
  const r = adminAddEmployee(String(payload.adminToken || ''), payload.employee || {});
  invalidateAdminSummary_();
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function apiAdminSetEmployeeActive_(payload) {
  const r = adminSetEmployeeActive(String(payload.adminToken || ''), payload.employeeId, Boolean(payload.active));
  invalidateAdminSummary_();
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function apiAdminSetEmployeePin_(payload) {
  const r = adminSetEmployeePin(String(payload.adminToken || ''), payload.employeeId, String(payload.newPin || ''));
  invalidateAdminSummary_();
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function apiAdminUpdateEmployeeProfile_(payload) {
  const r = adminUpdateEmployeeProfile(String(payload.adminToken || ''), payload.employeeId, payload.profile || {});
  invalidateAdminSummary_();
  return { ok:true, result:r, serverEpochMs:Date.now() };
}


function apiAdminUpdateRegistration_(payload) {
  const r = adminUpdateRegistration(String(payload.adminToken || ''), payload.registrationId, payload.registration || {});
  invalidateAdminSummary_();
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function apiAdminApproveRegistration_(payload) {
  // Backward-compatible alias: always use the fast, locked, single-spreadsheet path.
  return adminApproveRegistrationFast_(String(payload.adminToken || ''), String(payload.registrationId || ''), payload.employee || {}, payload.registration || {});
}

function apiAdminRejectRegistration_(payload) {
  const r = adminRejectRegistration(String(payload.adminToken || ''), payload.registrationId, String(payload.note || ''));
  invalidateAdminSummary_();
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function apiAdminChangePin_(payload) {
  const r = adminChangePin(String(payload.adminToken || ''), String(payload.newPin || ''));
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function apiAdminLogout_(payload) {
  const r = adminLogout(String(payload.adminToken || ''));
  return { ok:true, result:r, serverEpochMs:Date.now() };
}

function hashDeviceToken_(token) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token), Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function getRegisteredDevices_() {
  const props = PropertiesService.getScriptProperties();
  let devices = [];
  try {
    const raw = props.getProperty('STORE_DEVICES_JSON');
    devices = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(devices)) devices = [];
  } catch (err) {
    devices = [];
  }

  // รองรับเครื่องเดิมจากระบบแบบ 1 เครื่อง และย้ายเข้าระบบหลายเครื่องอัตโนมัติ
  const legacyHash = String(props.getProperty('STORE_DEVICE_TOKEN_HASH') || '');
  if (legacyHash && !devices.some(d => d && d.hash === legacyHash)) {
    devices.push({
      hash: legacyHash,
      deviceId: 'KIOSK-01',
      registeredAt: String(props.getProperty('STORE_DEVICE_REGISTERED_AT') || new Date().toISOString())
    });
    saveRegisteredDevices_(devices);
  }
  return devices.filter(d => d && d.hash);
}

function saveRegisteredDevices_(devices) {
  PropertiesService.getScriptProperties().setProperty('STORE_DEVICES_JSON', JSON.stringify(devices || []));
}

function nextDeviceId_(devices) {
  let maxNo = 0;
  (devices || []).forEach(d => {
    const m = String((d && d.deviceId) || '').match(/KIOSK-(\d+)/i);
    if (m) maxNo = Math.max(maxNo, Number(m[1]) || 0);
  });
  return 'KIOSK-' + String(maxNo + 1).padStart(2, '0');
}

function verifyDeviceToken_(token) {
  const actual = hashDeviceToken_(String(token || ''));
  if (!actual) throw new Error('เครื่องนี้ยังไม่ได้ลงทะเบียน');
  const device = getRegisteredDevices_().find(d => d && d.hash === actual);
  if (!device) throw new Error('โทรศัพท์เครื่องนี้ไม่ได้รับอนุญาตให้ลงเวลา');
  return device;
}

function setupSystem() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_PIN')) props.setProperty('ADMIN_PIN', '123456');
  if (!props.getProperty('PIN_SALT')) props.setProperty('PIN_SALT', Utilities.getUuid() + Utilities.getUuid());
  // ย้าย Device Token เดิมเข้าระบบหลายเครื่อง (ถ้ามี)
  getRegisteredDevices_();
  const empSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  if (empSheet) {
    const employeeHeaders = ['Employee PIN Hash','Nickname','Phone','Start Date','Branch','First Name','Last Name','Position','Wage Type','Wage Amount','Birth Date','Resignation Date','Registered Address','Current Address','Emergency Contact Name','Emergency Contact Phone','Emergency Contact Relationship','Employee Photo URL','Employment Status','Admin Note'];
    employeeHeaders.forEach((header, idx) => {
      const cell = empSheet.getRange(1, 7 + idx);
      if (!String(cell.getValue() || '').trim()) cell.setValue(header);
    });
    if (empSheet.getMaxRows() > 1) {
      empSheet.getRange(2, 9, empSheet.getMaxRows() - 1, 1).setNumberFormat('@');
      empSheet.getRange(2,10, empSheet.getMaxRows() - 1, 1).setNumberFormat('dd/mm/yyyy');
      empSheet.getRange(2,16, empSheet.getMaxRows() - 1, 1).setNumberFormat('#,##0.00');
      empSheet.getRange(2,17, empSheet.getMaxRows() - 1, 2).setNumberFormat('dd/mm/yyyy');
      empSheet.getRange(2,22, empSheet.getMaxRows() - 1, 1).setNumberFormat('@');
    }
  }
  let regSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REGISTRATION_SHEET);
  if (!regSheet) regSheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(REGISTRATION_SHEET);
  const regHeaders = ['Registration ID','Submitted At','Status','Branch','First Name','Last Name','Nickname','Phone','Email / LINE','Position','Birth Date','Start Date','Registered Address','Current Address','Emergency Contact Name','Emergency Contact Phone','Emergency Relationship','Photo URL','Photo File ID','Admin Note','Reviewed At','Employee ID','Wage Type','Wage Amount','Registration PIN Hash','Bank Name','Bank Account No','Bank Account Name','Bank Code'];
  regSheet.getRange(1,1,1,regHeaders.length).setValues([regHeaders]);
  if (regSheet.getMaxRows() > 1) {
    regSheet.getRange(2,8,regSheet.getMaxRows()-1,1).setNumberFormat('@');
    regSheet.getRange(2,11,regSheet.getMaxRows()-1,2).setNumberFormat('dd/mm/yyyy');
    regSheet.getRange(2,13,regSheet.getMaxRows()-1,2).setNumberFormat('@');
    regSheet.getRange(2,16,regSheet.getMaxRows()-1,1).setNumberFormat('@');
    regSheet.getRange(2,24,regSheet.getMaxRows()-1,1).setNumberFormat('#,##0.00');
    regSheet.getRange(2,26,regSheet.getMaxRows()-1,4).setNumberFormat('@');
  }
  const attSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_SHEET);
  if (attSheet) {
    const nickHeader = attSheet.getRange(1,16);
    if (!String(nickHeader.getValue() || '').trim()) nickHeader.setValue('Nickname');
  }
  let leaveSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_SHEET);
  if (!leaveSheet) leaveSheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(LEAVE_SHEET);
  const leaveHeaders = ['Leave ID','Submitted At','Status','Employee ID','Employee Name','Nickname','Leave Type','Start Date','End Date','Duration','Reason','Admin Note','Reviewed At','Reviewed By'];
  leaveSheet.getRange(1,1,1,leaveHeaders.length).setValues([leaveHeaders]);
  leaveSheet.setFrozenRows(1);
  if (leaveSheet.getMaxRows() > 1) {
    leaveSheet.getRange(2,4,leaveSheet.getMaxRows()-1,1).setNumberFormat('@');
    leaveSheet.getRange(2,8,leaveSheet.getMaxRows()-1,2).setNumberFormat('dd/mm/yyyy');
    leaveSheet.getRange(2,13,leaveSheet.getMaxRows()-1,1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  }
  // Payroll / bank fields.
  if (empSheet) {
    const payrollHeaders = ['Daily Wage','Bank Name','Bank Account No','Bank Account Name','Bank Code'];
    empSheet.getRange(1,27,1,payrollHeaders.length).setValues([payrollHeaders]);
    if (empSheet.getMaxRows() > 1) {
      empSheet.getRange(2,27,empSheet.getMaxRows()-1,1).setNumberFormat('#,##0.00');
      empSheet.getRange(2,28,empSheet.getMaxRows()-1,4).setNumberFormat('@');
    }
  }

  let payItemSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_PAY_ITEMS_SHEET);
  if (!payItemSheet) payItemSheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(EMPLOYEE_PAY_ITEMS_SHEET);
  const payItemHeaders = ['Item ID','Employee ID','Item Type','Item Name','Calc Method','Amount','Effective Start','Effective End','Active','Taxable','Created At','Updated At','Admin Note'];
  payItemSheet.getRange(1,1,1,payItemHeaders.length).setValues([payItemHeaders]);
  payItemSheet.setFrozenRows(1);
  if (payItemSheet.getMaxRows()>1) {
    payItemSheet.getRange(2,2,payItemSheet.getMaxRows()-1,1).setNumberFormat('@');
    payItemSheet.getRange(2,6,payItemSheet.getMaxRows()-1,1).setNumberFormat('#,##0.00');
    payItemSheet.getRange(2,7,payItemSheet.getMaxRows()-1,2).setNumberFormat('dd/mm/yyyy');
  }

  let adjSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_ADJUSTMENTS_SHEET);
  if (!adjSheet) adjSheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(PAYROLL_ADJUSTMENTS_SHEET);
  const adjHeaders = ['Adjustment ID','Payroll Period Key','Employee ID','Adjustment Type','Item Name','Amount','Effective Date','Status','Created At','Created By','Admin Note','Reference','Locked'];
  adjSheet.getRange(1,1,1,adjHeaders.length).setValues([adjHeaders]);
  adjSheet.setFrozenRows(1);
  if (adjSheet.getMaxRows()>1) {
    adjSheet.getRange(2,3,adjSheet.getMaxRows()-1,1).setNumberFormat('@');
    adjSheet.getRange(2,6,adjSheet.getMaxRows()-1,1).setNumberFormat('#,##0.00');
    adjSheet.getRange(2,7,adjSheet.getMaxRows()-1,1).setNumberFormat('dd/mm/yyyy');
  }

  const folderId = ensurePhotoFolder_().getId();
  props.setProperty('PHOTO_FOLDER_ID', folderId);
  const workforce = setupWorkforceSystem_();
  return { ok: true, message: 'ตั้งค่าระบบเรียบร้อย', photoFolderId: folderId, workforce:workforce, version:'7.0' };
}

function getPublicConfig() {
  return {
    deviceId: getSetting_('DEVICE_ID') || 'STORE-01',
    actions: [
      { id: 'IN', label: 'เข้างาน' },
      { id: 'BREAK_OUT', label: 'เริ่มพัก' },
      { id: 'BREAK_IN', label: 'กลับจากพัก' },
      { id: 'OUT', label: 'เลิกงาน' }
    ]
  };
}

function getEmployees() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 8).getValues()
    .filter(r => String(r[0]).trim() && r[2] !== false)
    .map(r => ({ id: String(r[0]), name: String(r[1]), nickname: String(r[7] || ''), sort: Number(r[3]) || 999 }))
    .sort((a,b) => a.sort - b.sort || a.name.localeCompare(b.name, 'th'));
}

function recordAttendance(payload) {
  const device = verifyDeviceToken_(payload && payload.deviceToken);
  payload = payload || {};
  payload.deviceId = device.deviceId || payload.deviceId || 'KIOSK';
  return recordAttendanceCore_(payload);
}

function recordAttendanceCore_(payload) {
  if (!payload || !payload.employeeId || !payload.action || !payload.photoData) {
    throw new Error('ข้อมูลไม่ครบ กรุณาถ่ายรูปและลองใหม่');
  }

  const employeePin = String(payload.employeePin || '');
  if (!/^\d{4}$/.test(employeePin)) throw new Error('กรุณากรอกรหัสพนักงาน 4 หลัก');

  const emp = findEmployee_(String(payload.employeeId));
  if (!emp) throw new Error('ไม่พบพนักงานหรือพนักงานถูกปิดใช้งาน');
  if (!emp.pinHash) throw new Error('พนักงานนี้ยังไม่ได้ตั้งรหัส 4 หลัก กรุณาติดต่อ Admin');
  if (!verifyEmployeePin_(emp, employeePin)) throw new Error('ชื่อพนักงานและรหัส 4 หลักไม่ตรงกัน');

  const allowed = ['IN','BREAK_OUT','BREAK_IN','OUT'];
  if (!allowed.includes(payload.action)) throw new Error('ประเภทรายการไม่ถูกต้อง');

  const now = new Date();
  const txId = 'ATT-' + Utilities.formatDate(now, TZ, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0,8).toUpperCase();
  const actionLabel = actionLabel_(payload.action);

  // อัปโหลดรูปนอก Lock เพื่อให้หลายเครื่องทำงานพร้อมกันได้
  const folder = ensurePhotoFolder_();
  const blob = dataUrlToBlob_(payload.photoData, txId + '.jpg');
  const file = folder.createFile(blob);
  file.setDescription(emp.id + ' ' + emp.name + ' ' + actionLabel + ' ' + Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm:ss'));

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_SHEET);
    const duplicateSeconds = Number(getSetting_('DUPLICATE_WINDOW_SECONDS')) || 120;
    rejectDuplicate_(sh, emp.id, payload.action, now, duplicateSeconds);

    const row = [
      txId,
      now,
      Utilities.formatDate(now, TZ, 'dd/MM/yyyy'),
      Utilities.formatDate(now, TZ, 'HH:mm:ss'),
      emp.id,
      emp.name,
      actionLabel,
      '',
      file.getUrl(),
      file.getId(),
      payload.deviceId || 'KIOSK',
      'VERIFIED_PHOTO',
      payload.clientTimestamp || '',
      now,
      '',
      emp.nickname || '',
      deviceBranchV7_(payload.deviceId || 'KIOSK'),
      (employeeRecordV7_(emp.id) || {}).department || '',
      'KIOSK'
    ];
    sh.appendRow(row);
    const rowNum = sh.getLastRow();
    sh.getRange(rowNum, 2).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sh.getRange(rowNum, 14).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    // ใช้ลิงก์แทนการฝังรูปในชีต เพื่อลดเวลาบันทึกอย่างมาก
    sh.getRange(rowNum, 8).setFormula('=HYPERLINK("' + file.getUrl() + '","เปิดรูป")');

    return {
      ok: true,
      transactionId: txId,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeNickname: emp.nickname || '',
      action: actionLabel,
      date: Utilities.formatDate(now, TZ, 'dd/MM/yyyy'),
      time: Utilities.formatDate(now, TZ, 'HH:mm:ss')
    };
  } catch (err) {
    try { file.setTrashed(true); } catch (trashErr) {}
    throw err;
  } finally {
    try { lock.releaseLock(); } catch (releaseErr) {}
  }
}

function submitLeaveRequest_(leave) {
  leave = leave || {};
  const employeeId = String(leave.employeeId || '').trim();
  const pin = String(leave.employeePin || '');
  const checked = validateEmployeePin(employeeId, pin);
  if (!checked.ok) throw new Error(checked.message || 'ข้อมูลพนักงานไม่ถูกต้อง');
  const emp = findEmployee_(employeeId);
  const leaveType = String(leave.leaveType || '').trim();
  if (!['SICK','PERSONAL','VACATION','OTHER'].includes(leaveType)) throw new Error('กรุณาเลือกประเภทการลา');
  const start = parseIsoDate_(leave.startDate), end = parseIsoDate_(leave.endDate);
  if (!start || !end) throw new Error('กรุณาเลือกวันเริ่มลาและวันสิ้นสุด');
  if (end < start) throw new Error('วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มลา');
  const days = Math.floor((end.getTime()-start.getTime())/86400000)+1;
  if (days > 31) throw new Error('คำขอลาหนึ่งรายการเลือกได้สูงสุด 31 วัน');
  const duration = String(leave.duration || 'FULL_DAY');
  if (!['FULL_DAY','HALF_AM','HALF_PM'].includes(duration)) throw new Error('ช่วงเวลาการลาไม่ถูกต้อง');
  const reason = String(leave.reason || '').trim().slice(0,1000);
  const now = new Date();
  const leaveId = 'LEV-' + Utilities.formatDate(now, TZ, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0,6).toUpperCase();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(LEAVE_SHEET);
  if (!sh) { setupSystem(); sh = ss.getSheetByName(LEAVE_SHEET); }
  sh.appendRow([leaveId,now,'PENDING',emp.id,emp.name,emp.nickname||'',leaveType,start,end,duration,reason,'','','']);
  const row=sh.getLastRow();
  sh.getRange(row,2).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sh.getRange(row,8,1,2).setNumberFormat('dd/mm/yyyy');
  bumpLeaveRev_();
  return {ok:true,leaveId:leaveId};
}

function leaveTypeLabel_(v) {
  return ({REQUEST_OFF:'ขอวันหยุด',WEEKLY_OFF:'ขอหยุดประจำสัปดาห์',SICK:'ลาป่วย',PERSONAL:'ลากิจ',VACATION:'ลาพักร้อน',OTHER:'ลาอื่นๆ'})[String(v||'')] || String(v||'');
}

function leaveDurationLabel_(v) {
  return ({FULL_DAY:'เต็มวัน',HALF_AM:'ครึ่งวันเช้า',HALF_PM:'ครึ่งวันบ่าย'})[String(v||'')] || String(v||'');
}

function adminGetLeaveRequests_(token, status) {
  requireAdmin_(token);
  const wanted = String(status || 'PENDING').toUpperCase();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID), sh = ss.getSheetByName(LEAVE_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) return {rows:[],serverEpochMs:Date.now()};
  const from = Math.max(2,last-199);
  const vals=sh.getRange(from,1,last-from+1,14).getValues().reverse();
  const rows=vals.filter(r => wanted==='ALL' || String(r[2]||'').toUpperCase()===wanted).map(r => ({
    leaveId:toClientText_(r[0]),submittedAt:formatDateTimeForClient_(r[1]),status:toClientText_(r[2]),employeeId:toClientText_(r[3]),employeeName:toClientText_(r[4]),nickname:toClientText_(r[5]),leaveType:toClientText_(r[6]),leaveTypeLabel:leaveTypeLabel_(r[6]),startDate:formatDateInputForClient_(r[7]),endDate:formatDateInputForClient_(r[8]),duration:toClientText_(r[9]),durationLabel:leaveDurationLabel_(r[9]),reason:toClientText_(r[10]),adminNote:toClientText_(r[11]),reviewedAt:formatDateTimeForClient_(r[12])
  }));
  return {rows:rows,serverEpochMs:Date.now()};
}

function adminReviewLeave_(token, leaveId, decision, note) {
  requireAdmin_(token);
  const dec=String(decision||'').toUpperCase();
  if (!['APPROVED','REJECTED'].includes(dec)) throw new Error('สถานะอนุมัติไม่ถูกต้อง');
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(LEAVE_SHEET);
  const last=sh?sh.getLastRow():0;if(!sh||last<2) throw new Error('ไม่พบคำขอลา');
  const ids=sh.getRange(2,1,last-1,1).getValues();let row=0;
  for(let i=0;i<ids.length;i++) if(String(ids[i][0])===String(leaveId)){row=i+2;break}
  if(!row) throw new Error('ไม่พบคำขอลา');
  sh.getRange(row,3).setValue(dec);
  sh.getRange(row,12).setValue(String(note||''));
  sh.getRange(row,13).setValue(new Date()).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sh.getRange(row,14).setValue('ADMIN');
  bumpLeaveRev_();
  return {ok:true,leaveId:leaveId,status:dec};
}

function bumpLeaveRev_() {
  PropertiesService.getScriptProperties().setProperty('LEAVE_REV', String(Date.now()));
}

function getLeaveRev_() {
  return String(PropertiesService.getScriptProperties().getProperty('LEAVE_REV') || '0');
}

function approvedLeavesForRange_(ss, employeeId, startKey, endKey) {
  const sh=ss.getSheetByName(LEAVE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];
  const vals=sh.getRange(2,1,last-1,14).getValues(),out=[];
  vals.forEach(r => {
    if(String(r[2]||'')!=='APPROVED'||String(r[3]||'')!==String(employeeId))return;
    const s=attendanceDateKey_(r[7]),e=attendanceDateKey_(r[8]);if(!s||!e||e<startKey||s>endKey)return;
    out.push({leaveId:toClientText_(r[0]),leaveType:toClientText_(r[6]),leaveTypeLabel:leaveTypeLabel_(r[6]),startDate:s,endDate:e,duration:toClientText_(r[9]),durationLabel:leaveDurationLabel_(r[9]),reason:toClientText_(r[10])});
  });
  return out;
}

function adminLogin(pin) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN');
  if (!expected) throw new Error('ระบบ Admin ยังไม่ได้ตั้งค่า');
  if (String(pin) !== String(expected)) return { ok:false };
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('ADMIN_' + token, '1', 14400);
  return { ok:true, token:token, expiresIn:14400 };
}

function adminLogout(token) {
  if (token) CacheService.getScriptCache().remove('ADMIN_' + token);
  return { ok:true };
}

function validateEmployeePin(employeeId, pin) {
  const employeeIdText = String(employeeId || '').trim();
  const pinText = String(pin || '');
  if (!employeeIdText) return { ok:false, message:'กรุณาเลือกชื่อพนักงาน' };
  if (!/^\d{4}$/.test(pinText)) return { ok:false, message:'กรุณากรอกรหัสตัวเลข 4 หลัก' };
  const emp = findEmployee_(employeeIdText);
  if (!emp) return { ok:false, message:'ไม่พบพนักงานหรือพนักงานถูกปิดใช้งาน' };
  if (!emp.pinHash) return { ok:false, message:'พนักงานนี้ยังไม่ได้ตั้งรหัส 4 หลัก กรุณาติดต่อ Admin' };
  if (!verifyEmployeePin_(emp, pinText)) return { ok:false, message:'ชื่อพนักงานและรหัส 4 หลักไม่ตรงกัน' };
  return { ok:true, employeeId:emp.id, employeeName:emp.name };
}

function nextEmployeeId_() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  const used = new Set();
  if (last >= 2) {
    sh.getRange(2,1,last-1,1).getValues().forEach(r => {
      const m = String(r[0] || '').trim().match(/^E(\d+)$/i);
      if (m) used.add(Number(m[1]));
    });
  }
  let n = 1;
  while (used.has(n)) n++;
  return 'E' + String(n).padStart(3,'0');
}

function extractDriveFileId_(url) {
  const m = String(url || '').match(/\/d\/([^/]+)/);
  return m ? m[1] : '';
}

function fileToDataUrl_(fileId) {
  try {
    if (!fileId) return '';
    const blob = DriveApp.getFileById(String(fileId)).getBlob();
    const mime = blob.getContentType() || 'image/jpeg';
    return 'data:' + mime + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return '';
  }
}


const ADMIN_SUMMARY_CACHE_KEY_ = 'ADMIN_SUMMARY_V54';

function invalidateAdminSummary_() {
  try { CacheService.getScriptCache().remove(ADMIN_SUMMARY_CACHE_KEY_); } catch (e) {}
}

function employeeIdFromRows_(rows) {
  const used = new Set();
  (rows || []).forEach(r => {
    const m = String(r[0] || '').trim().match(/^E(\d+)$/i);
    if (m) used.add(Number(m[1]));
  });
  let n = 1;
  while (used.has(n)) n++;
  return 'E' + String(n).padStart(3,'0');
}

function adminGetFastSummary_(token, forceFresh) {
  requireAdmin_(token);
  const cache = CacheService.getScriptCache();
  if (!forceFresh) {
    const raw = cache.get(ADMIN_SUMMARY_CACHE_KEY_);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const empSh = ss.getSheetByName(EMPLOYEE_SHEET);
  const regSh = ss.getSheetByName(REGISTRATION_SHEET);

  let employeeRows = [];
  if (empSh && empSh.getLastRow() >= 2) {
    employeeRows = empSh.getRange(2,1,empSh.getLastRow()-1,Math.max(33,empSh.getLastColumn())).getValues();
  }
  const employees = employeeRows
    .filter(r => String(r[0] || '').trim())
    .map(r => ({
      id:toClientText_(r[0]), name:toClientText_(r[1]), active:r[2] !== false, sort:Number(r[3])||999,
      pinSet:Boolean(String(r[6]||'').trim()), nickname:toClientText_(r[7]), phone:toClientText_(r[8]), startDate:formatDateInputForClient_(r[9]),
      branch:toClientText_(r[10]), firstName:toClientText_(r[11]), lastName:toClientText_(r[12]), position:toClientText_(r[13]),
      wageType:toClientText_(r[14]), wageAmount:Number(r[15])||0, birthDate:formatDateInputForClient_(r[16]), resignationDate:formatDateInputForClient_(r[17]),
      registeredAddress:toClientText_(r[18]), currentAddress:toClientText_(r[19]), emergencyName:toClientText_(r[20]), emergencyPhone:toClientText_(r[21]),
      emergencyRelationship:toClientText_(r[22]), photoUrl:toClientText_(r[23]), photoFileId:extractDriveFileId_(r[23]),
      employmentStatus:toClientText_(r[24] || 'ACTIVE'), adminNote:toClientText_(r[25]), dailyWage:Number(r[26])||0,
      bankName:toClientText_(r[27]), bankAccountNo:toClientText_(r[28]), bankAccountName:toClientText_(r[29]), bankCode:toClientText_(r[30]),
      department:toClientText_(r[31]), accessRole:toClientText_(r[32] || (String(r[13]||'').toUpperCase()==='MANAGER'?'MANAGER':'EMPLOYEE'))
    }))
    .sort((a,b) => a.sort - b.sort || a.name.localeCompare(b.name,'th'));

  let registrations = [];
  let pendingCount = 0;
  if (regSh && regSh.getLastRow() >= 2) {
    const last = regSh.getLastRow();
    const from = Math.max(2, last - 49);
    const rows = regSh.getRange(from,1,last-from+1,29).getValues().reverse();
    pendingCount = rows.filter(r => String(r[2]) === 'PENDING').length;
    registrations = rows.map(r => ({
      registrationId:toClientText_(r[0]), submittedAt:formatDateTimeForClient_(r[1]), status:toClientText_(r[2]), branch:toClientText_(r[3]),
      firstName:toClientText_(r[4]), lastName:toClientText_(r[5]), nickname:toClientText_(r[6]), phone:toClientText_(r[7]), contact:toClientText_(r[8]),
      position:toClientText_(r[9]), birthDate:formatDateInputForClient_(r[10]), startDate:formatDateInputForClient_(r[11]), registeredAddress:toClientText_(r[12]),
      currentAddress:toClientText_(r[13]), emergencyName:toClientText_(r[14]), emergencyPhone:toClientText_(r[15]), emergencyRelationship:toClientText_(r[16]),
      photoUrl:toClientText_(r[17]), photoFileId:toClientText_(r[18]), adminNote:toClientText_(r[19]), reviewedAt:formatDateTimeForClient_(r[20]), employeeId:toClientText_(r[21]),
      wageType:toClientText_(r[22]), wageAmount:Number(r[23])||0, pinSet:Boolean(String(r[24]||'').trim()),
      bankName:toClientText_(r[25]), bankAccountNo:toClientText_(r[26]), bankAccountName:toClientText_(r[27]), bankCode:toClientText_(r[28])
    }));
  }

  const out = {
    employees:employees,
    registrations:registrations,
    pendingCount:pendingCount,
    nextEmployeeId:employeeIdFromRows_(employeeRows),
    sheetUrl:String(ss.getUrl()),
    generatedAt:Date.now()
  };
  try { cache.put(ADMIN_SUMMARY_CACHE_KEY_, JSON.stringify(out), 300); } catch (e) {}
  return out;
}

function adminGetRegistrationDetail_(token, registrationId) {
  requireAdmin_(token);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(REGISTRATION_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) throw new Error('Registration not found');
  const ids = sh.getRange(2,1,last-1,1).getValues();
  let row = 0;
  for (let i=0;i<ids.length;i++) if (String(ids[i][0]) === String(registrationId)) { row=i+2; break; }
  if (!row) throw new Error('Registration not found');
  const r = sh.getRange(row,1,1,29).getValues()[0];
  return {
    registrationId:toClientText_(r[0]), submittedAt:formatDateTimeForClient_(r[1]), status:toClientText_(r[2]), branch:toClientText_(r[3]),
    firstName:toClientText_(r[4]), lastName:toClientText_(r[5]), nickname:toClientText_(r[6]), phone:toClientText_(r[7]), contact:toClientText_(r[8]),
    position:toClientText_(r[9]), birthDate:formatDateInputForClient_(r[10]), startDate:formatDateInputForClient_(r[11]), registeredAddress:toClientText_(r[12]),
    currentAddress:toClientText_(r[13]), emergencyName:toClientText_(r[14]), emergencyPhone:toClientText_(r[15]), emergencyRelationship:toClientText_(r[16]),
    photoUrl:toClientText_(r[17]), photoFileId:toClientText_(r[18]), adminNote:toClientText_(r[19]), reviewedAt:formatDateTimeForClient_(r[20]), employeeId:toClientText_(r[21]),
    wageType:toClientText_(r[22]), wageAmount:Number(r[23])||0, pinSet:Boolean(String(r[24]||'').trim()),
      bankName:toClientText_(r[25]), bankAccountNo:toClientText_(r[26]), bankAccountName:toClientText_(r[27]), bankCode:toClientText_(r[28]), serverEpochMs:Date.now()
  };
}

function adminGetEmployeeDetail_(token, employeeId) {
  requireAdmin_(token);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(EMPLOYEE_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) throw new Error('Employee not found');
  const rows = sh.getRange(2,1,last-1,31).getValues();
  let r = null;
  for (const row of rows) if (String(row[0]) === String(employeeId)) { r=row; break; }
  if (!r) throw new Error('Employee not found');
  return {
    id:toClientText_(r[0]), name:toClientText_(r[1]), active:r[2] !== false, sort:Number(r[3])||999, pinSet:Boolean(String(r[6]||'').trim()),
    nickname:toClientText_(r[7]), phone:toClientText_(r[8]), startDate:formatDateInputForClient_(r[9]), branch:toClientText_(r[10]),
    firstName:toClientText_(r[11]), lastName:toClientText_(r[12]), position:toClientText_(r[13]), wageType:toClientText_(r[14]), wageAmount:Number(r[15])||0,
    birthDate:formatDateInputForClient_(r[16]), resignationDate:formatDateInputForClient_(r[17]), registeredAddress:toClientText_(r[18]), currentAddress:toClientText_(r[19]),
    emergencyName:toClientText_(r[20]), emergencyPhone:toClientText_(r[21]), emergencyRelationship:toClientText_(r[22]), photoUrl:toClientText_(r[23]),
    photoFileId:extractDriveFileId_(r[23]), employmentStatus:toClientText_(r[24] || 'ACTIVE'), adminNote:toClientText_(r[25]), dailyWage:Number(r[26])||0,
      bankName:toClientText_(r[27]), bankAccountNo:toClientText_(r[28]), bankAccountName:toClientText_(r[29]), bankCode:toClientText_(r[30]), serverEpochMs:Date.now()
  };
}

function attendanceDateKey_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, TZ, 'yyyy-MM-dd');
  const text = String(value || '').trim();
  if (!text) return '';
  let m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return text;
  m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[1]).padStart(2,'0');
  return '';
}

function adminGetEmployeeAttendanceRange_(token, employeeId, startDate, endDate) {
  requireAdmin_(token);
  const id = String(employeeId || '').trim();
  if (!id) throw new Error('ไม่พบรหัสพนักงาน');
  const start = parseIsoDate_(startDate);
  const end = parseIsoDate_(endDate);
  if (!start || !end) throw new Error('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด');
  if (end < start) throw new Error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days > 62) throw new Error('เลือกช่วงวันที่ได้สูงสุด 62 วันต่อครั้ง');

  const startKey = Utilities.formatDate(start, TZ, 'yyyy-MM-dd');
  const endKey = Utilities.formatDate(end, TZ, 'yyyy-MM-dd');
  const cacheKey = 'ATT_RANGE_' + id.replace(/[^A-Za-z0-9_-]/g,'') + '_' + startKey.replace(/-/g,'') + '_' + endKey.replace(/-/g,'') + '_L' + getLeaveRev_();
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(ATTENDANCE_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) return {employeeId:id,startDate:startKey,endDate:endKey,rows:[],leaves:approvedLeavesForRange_(ss,id,startKey,endKey),serverEpochMs:Date.now()};

  // Read only the Date column first. Then read the contiguous row slice for the requested date range.
  const dateValues = sh.getRange(2,3,last-1,1).getValues();
  let firstRow = 0, lastRow = 0;
  for (let i=0;i<dateValues.length;i++) {
    const key = attendanceDateKey_(dateValues[i][0]);
    if (!key) continue;
    if (!firstRow && key >= startKey && key <= endKey) firstRow = i + 2;
    if (key >= startKey && key <= endKey) lastRow = i + 2;
    if (firstRow && key > endKey) break;
  }
  if (!firstRow || !lastRow) {
    const empty = {employeeId:id,startDate:startKey,endDate:endKey,rows:[],leaves:approvedLeavesForRange_(ss,id,startKey,endKey),serverEpochMs:Date.now()};
    try { cache.put(cacheKey, JSON.stringify(empty), 60); } catch (e) {}
    return empty;
  }

  const values = sh.getRange(firstRow,1,lastRow-firstRow+1,15).getValues();
  const rows = values.filter(r => String(r[4] || '').trim() === id).map(r => ({
    transactionId:toClientText_(r[0]),
    timestamp:formatDateTimeForClient_(r[1]),
    date:attendanceDateKey_(r[2]),
    time:formatTimeForClient_(r[3]),
    employeeId:toClientText_(r[4]),
    employeeName:toClientText_(r[5]),
    action:toClientText_(r[6]),
    photoUrl:toClientText_(r[8]),
    photoFileId:toClientText_(r[9]),
    deviceId:toClientText_(r[10]),
    status:toClientText_(r[11]),
    note:toClientText_(r[14])
  }));

  const leaves = approvedLeavesForRange_(ss,id,startKey,endKey);
  const out = {employeeId:id,startDate:startKey,endDate:endKey,rows:rows,leaves:leaves,serverEpochMs:Date.now()};
  try { cache.put(cacheKey, JSON.stringify(out), 60); } catch (e) {}
  return out;
}


function payrollPeriodKey_(startDate, endDate, payDate) {
  return String(startDate||'').replace(/-/g,'') + '_' + String(endDate||'').replace(/-/g,'') + '_' + String(payDate||'').replace(/-/g,'');
}

function dateAtTime_(dateKey, hh, mm, addDays) {
  const p=String(dateKey).split('-').map(Number);if(p.length!==3)return null;
  return new Date(p[0],p[1]-1,p[2]+(addDays||0),hh,mm||0,0,0);
}

function minutesOfDay_(d) { return d.getHours()*60+d.getMinutes()+d.getSeconds()/60; }
function wholeMinutesBetween_(a,b) { return Math.max(0,Math.floor((b.getTime()-a.getTime())/60000)); }
function roundMoney_(n) { return Math.round((Number(n)||0)*100)/100; }

function classifyPayrollShift_(inTime,outTime) {
  if (!(inTime instanceof Date) || isNaN(inTime.getTime())) return {shift:'UNKNOWN',workDate:''};
  const m=minutesOfDay_(inTime), inKey=Utilities.formatDate(inTime,TZ,'yyyy-MM-dd');
  if (m>=1140) return {shift:'NIGHT',workDate:inKey}; // 19:00 onward is night by rule.
  if (m>=480 && m<1140) return {shift:'DAY',workDate:inKey};
  if (!(outTime instanceof Date) || isNaN(outTime.getTime())) return {shift:'UNKNOWN',workDate:inKey};
  // Early-morning check-in is ambiguous. Use both in/out and choose the standard 12h window that fits best.
  const dayStart=dateAtTime_(inKey,8,0,0),dayEnd=dateAtTime_(inKey,20,0,0);
  const nightStart=dateAtTime_(inKey,20,0,-1),nightEnd=dateAtTime_(inKey,8,0,0);
  const scoreDay=Math.abs(inTime-dayStart)+Math.abs(outTime-dayEnd);
  const scoreNight=Math.abs(inTime-nightStart)+Math.abs(outTime-nightEnd);
  if(scoreNight<scoreDay){return {shift:'NIGHT',workDate:Utilities.formatDate(nightStart,TZ,'yyyy-MM-dd')}}
  return {shift:'DAY',workDate:inKey};
}

function attendanceEventsForPayroll_(ss, employeeId, startKey, endKey) {
  const sh=ss.getSheetByName(ATTENDANCE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];
  const start=parseIsoDate_(startKey),end=parseIsoDate_(endKey),scanStart=new Date(start),scanEnd=new Date(end);
  scanStart.setDate(scanStart.getDate()-1);scanEnd.setDate(scanEnd.getDate()+1);
  const scanStartKey=Utilities.formatDate(scanStart,TZ,'yyyy-MM-dd'),scanEndKey=Utilities.formatDate(scanEnd,TZ,'yyyy-MM-dd');
  const dates=sh.getRange(2,3,last-1,1).getValues();let first=0,lastRow=0;
  for(let i=0;i<dates.length;i++){
    const k=attendanceDateKey_(dates[i][0]);if(!k)continue;
    if(!first&&k>=scanStartKey&&k<=scanEndKey)first=i+2;
    if(k>=scanStartKey&&k<=scanEndKey)lastRow=i+2;
    if(first&&k>scanEndKey)break;
  }
  if(!first||!lastRow)return[];
  return sh.getRange(first,1,lastRow-first+1,Math.min(19,sh.getLastColumn())).getValues().filter(r=>String(r[4]||'')===String(employeeId) && String(r[11]||'').indexOf('VOID')!==0).map(r=>({
    transactionId:toClientText_(r[0]),timestamp:r[1] instanceof Date?r[1]:null,date:attendanceDateKey_(r[2]),time:formatTimeForClient_(r[3]),action:toClientText_(r[6]),photoUrl:toClientText_(r[8]),photoFileId:toClientText_(r[9]),deviceId:toClientText_(r[10]),status:toClientText_(r[11]),note:toClientText_(r[14]),nickname:toClientText_(r[15])
  })).filter(x=>x.timestamp).sort((a,b)=>a.timestamp-b.timestamp);
}

function pairPayrollSessions_(events) {
  const sessions=[];let open=null;
  (events||[]).forEach(ev=>{
    const k=actionKindServer_(ev.action);
    if(k==='IN'){
      if(open)sessions.push({inEvent:open,outEvent:null});
      open=ev;
    }else if(k==='OUT'){
      if(open){
        const hrs=(ev.timestamp-open.timestamp)/3600000;
        if(hrs>=0&&hrs<=20){sessions.push({inEvent:open,outEvent:ev});open=null;return}
        sessions.push({inEvent:open,outEvent:null});open=null;
      }
      sessions.push({inEvent:null,outEvent:ev});
    }
  });
  if(open)sessions.push({inEvent:open,outEvent:null});
  return sessions;
}

function actionKindServer_(a){
  const t=String(a||'').toUpperCase();if(t==='IN'||t.indexOf('เข้างาน')>=0)return'IN';if(t==='OUT'||t.indexOf('เลิกงาน')>=0)return'OUT';if(t==='BREAK_OUT'||t.indexOf('เริ่มพัก')>=0)return'BREAK_OUT';if(t==='BREAK_IN'||t.indexOf('กลับจากพัก')>=0)return'BREAK_IN';return t;
}

function employeePayrollConfig_(ss, employeeId) {
  const sh=ss.getSheetByName(EMPLOYEE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)throw new Error('ไม่พบพนักงาน');
  const rows=sh.getRange(2,1,last-1,27).getValues();
  for(const r of rows)if(String(r[0])===String(employeeId))return {id:String(r[0]),name:String(r[1]),nickname:String(r[7]||''),wageType:String(r[14]||''),wageAmount:Number(r[15])||0,dailyWage:Number(r[26])||0};
  throw new Error('ไม่พบพนักงาน');
}

function employeePayItems_(ss, employeeId, startKey, endKey) {
  const sh=ss.getSheetByName(EMPLOYEE_PAY_ITEMS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];
  return sh.getRange(2,1,last-1,13).getValues().filter(r=>String(r[1])===String(employeeId)&&r[8]!==false).map(r=>({itemId:String(r[0]),type:String(r[2]),name:String(r[3]),method:String(r[4]),amount:Number(r[5])||0,effectiveStart:attendanceDateKey_(r[6]),effectiveEnd:attendanceDateKey_(r[7]),active:r[8]!==false,note:String(r[12]||'')})).filter(x=>(!x.effectiveStart||x.effectiveStart<=endKey)&&(!x.effectiveEnd||x.effectiveEnd>=startKey));
}

function payrollAdjustments_(ss, employeeId, periodKey) {
  const sh=ss.getSheetByName(PAYROLL_ADJUSTMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];
  return sh.getRange(2,1,last-1,13).getValues().filter(r=>String(r[1])===String(periodKey)&&String(r[2])===String(employeeId)&&String(r[7]||'ACTIVE')!=='DELETED').map(r=>({adjustmentId:String(r[0]),type:String(r[3]),name:String(r[4]),amount:Number(r[5])||0,effectiveDate:attendanceDateKey_(r[6]),note:String(r[10]||''),locked:Boolean(r[12])}));
}

function adminGetPayrollPreview_(token, employeeId, startDate, endDate, payDate) {
  requireAdmin_(token);
  const id=String(employeeId||'').trim();if(!id)throw new Error('ไม่พบรหัสพนักงาน');
  const start=parseIsoDate_(startDate),end=parseIsoDate_(endDate);if(!start||!end||end<start)throw new Error('ช่วงวันที่ไม่ถูกต้อง');
  const days=Math.floor((end-start)/86400000)+1;if(days>31)throw new Error('เลือกช่วงได้สูงสุด 31 วัน');
  const today=new Date();today.setHours(0,0,0,0);if(end>=today)throw new Error('รอบคิดเงินจริงต้องสิ้นสุดก่อนวันปัจจุบัน');
  const startKey=Utilities.formatDate(start,TZ,'yyyy-MM-dd'),endKey=Utilities.formatDate(end,TZ,'yyyy-MM-dd'),periodKey=payrollPeriodKey_(startDate,endDate,payDate);
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),emp=employeePayrollConfig_(ss,id);
  const events=attendanceEventsForPayroll_(ss,id,startKey,endKey),sessions=pairPayrollSessions_(events),leaves=approvedLeavesForRange_(ss,id,startKey,endKey);
  const byDay={};
  sessions.forEach(s=>{
    if(s.inEvent){
      const cls=classifyPayrollShift_(s.inEvent.timestamp,s.outEvent&&s.outEvent.timestamp);const key=cls.workDate||Utilities.formatDate(s.inEvent.timestamp,TZ,'yyyy-MM-dd');
      if(key<startKey||key>endKey)return;
      const cur=byDay[key]||{sessions:[],outOnly:[]};cur.sessions.push({inEvent:s.inEvent,outEvent:s.outEvent,shift:cls.shift});byDay[key]=cur;
    }else if(s.outEvent){
      const key=Utilities.formatDate(s.outEvent.timestamp,TZ,'yyyy-MM-dd');if(key<startKey||key>endKey)return;const cur=byDay[key]||{sessions:[],outOnly:[]};cur.outOnly.push(s.outEvent);byDay[key]=cur;
    }
  });
  const dailyWage=Number(emp.dailyWage)||0, rows=[];let totalBase=0,totalLateDeduction=0,totalNight=0,totalOtPay=0,totalOtHours=0,workedDays=0,nightShifts=0;
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const key=Utilities.formatDate(d,TZ,'yyyy-MM-dd'),bucket=byDay[key]||{sessions:[],outOnly:[]},leave=leaves.find(x=>x.startDate<=key&&x.endDate>=key)||null;
    let inEv=null,outEv=null,shift='UNKNOWN';
    if(bucket.sessions.length){bucket.sessions.sort((a,b)=>a.inEvent.timestamp-b.inEvent.timestamp);inEv=bucket.sessions[0].inEvent;shift=bucket.sessions[0].shift;const outs=bucket.sessions.filter(x=>x.outEvent).map(x=>x.outEvent).sort((a,b)=>a.timestamp-b.timestamp);outEv=outs.length?outs[outs.length-1]:null}
    else if(bucket.outOnly.length){bucket.outOnly.sort((a,b)=>a.timestamp-b.timestamp);outEv=bucket.outOnly[bucket.outOnly.length-1]}
    const dayEvents=events.filter(ev=>Utilities.formatDate(ev.timestamp,TZ,'yyyy-MM-dd')===key);
    const dayNoteText=dayEvents.map(ev=>String(ev.note||'')).join(' ');
    const forcedDayOff=/ขาดงาน|สลับกะ/.test(dayNoteText);
    const worked=!forcedDayOff&&Boolean(inEv||outEv);let base=worked?dailyWage:0,lateMin=0,lateDed=0,night=0,beforeMin=0,afterMin=0,otHours=0,otPay=0,note=[];
    if(forcedDayOff) note.push(/ขาดงาน/.test(dayNoteText)?'ขาดงาน':'สลับกะ');
    if(worked)workedDays++;
    if(inEv&&shift==='NIGHT'){night=65;nightShifts++}
    if(inEv&&shift!=='UNKNOWN'){
      const scheduleStart=shift==='DAY'?dateAtTime_(key,8,0,0):dateAtTime_(key,20,0,0);
      const lateThreshold=new Date(scheduleStart.getTime()+6*60000);
      if(inEv.timestamp>=lateThreshold){lateMin=Math.floor((inEv.timestamp-scheduleStart)/60000);lateDed=100}
    }
    if(inEv&&outEv&&shift!=='UNKNOWN'){
      const scheduleStart=shift==='DAY'?dateAtTime_(key,8,0,0):dateAtTime_(key,20,0,0);
      const scheduleEnd=shift==='DAY'?dateAtTime_(key,20,0,0):dateAtTime_(key,8,0,1);
      beforeMin=inEv.timestamp<scheduleStart?wholeMinutesBetween_(inEv.timestamp,scheduleStart):0;
      afterMin=outEv.timestamp>scheduleEnd?wholeMinutesBetween_(scheduleEnd,outEv.timestamp):0;
      otHours=Math.floor(beforeMin/60)+Math.floor(afterMin/60);
      otPay=dailyWage>0?roundMoney_(otHours*((dailyWage/12)*1.5)):0;
    } else if(worked) {
      if(!inEv)note.push('ไม่มีเวลาเข้า');if(!outEv)note.push('ไม่มีเวลาออก');note.push('ไม่คำนวณ OT');
    }
    if(inEv&&shift==='UNKNOWN')note.push('กะไม่ชัดเจน');
    if(leave)note.push('ลา: '+leave.leaveTypeLabel+' '+leave.durationLabel);
    if(worked&&dailyWage<=0)note.push('ยังไม่ได้กำหนดค่าแรงรายวัน');
    const dayNet=roundMoney_(base-lateDed+night+otPay);
    totalBase+=base;totalLateDeduction+=lateDed;totalNight+=night;totalOtPay+=otPay;totalOtHours+=otHours;
    rows.push({date:key,dayName:Utilities.formatDate(d,TZ,'EEEE'),shift:shift,inTime:inEv?Utilities.formatDate(inEv.timestamp,TZ,'HH:mm:ss'):'',outTime:outEv?Utilities.formatDate(outEv.timestamp,TZ,'HH:mm:ss'):'',baseWage:roundMoney_(base),lateMinutes:lateMin,lateDeduction:lateDed,nightAllowance:night,otBeforeMinutes:beforeMin,otAfterMinutes:afterMin,otPaidHours:otHours,otPay:roundMoney_(otPay),dayNet:dayNet,worked:worked,leave:leave,note:note.join(' • '),inPhotoFileId:inEv?inEv.photoFileId:'',outPhotoFileId:outEv?outEv.photoFileId:'',inPhotoUrl:inEv?inEv.photoUrl:'',outPhotoUrl:outEv?outEv.photoUrl:''});
  }
  const items=employeePayItems_(ss,id,startKey,endKey),itemResults=[];let recurringEarn=0,recurringDed=0;
  items.forEach(it=>{let qty=1;if(it.method==='PER_WORKDAY')qty=workedDays;else if(it.method==='PER_NIGHT_SHIFT')qty=nightShifts;const amount=roundMoney_(it.amount*qty);itemResults.push(Object.assign({},it,{quantity:qty,total:amount}));if(it.type==='DEDUCTION')recurringDed+=amount;else recurringEarn+=amount});
  const adjustments=payrollAdjustments_(ss,id,periodKey);let adjEarn=0,adjDed=0;adjustments.forEach(a=>{if(a.type==='DEDUCTION')adjDed+=a.amount;else adjEarn+=a.amount});
  totalBase=roundMoney_(totalBase);totalLateDeduction=roundMoney_(totalLateDeduction);totalNight=roundMoney_(totalNight);totalOtPay=roundMoney_(totalOtPay);recurringEarn=roundMoney_(recurringEarn);recurringDed=roundMoney_(recurringDed);adjEarn=roundMoney_(adjEarn);adjDed=roundMoney_(adjDed);
  const gross=roundMoney_(totalBase+totalNight+totalOtPay+recurringEarn+adjEarn),deductions=roundMoney_(totalLateDeduction+recurringDed+adjDed),net=roundMoney_(gross-deductions);
  return {employee:emp,periodKey:periodKey,startDate:startKey,endDate:endKey,payDate:String(payDate||''),rows:rows,leaves:leaves,attendance:events.map(e=>({transactionId:e.transactionId,date:Utilities.formatDate(e.timestamp,TZ,'yyyy-MM-dd'),time:Utilities.formatDate(e.timestamp,TZ,'HH:mm:ss'),action:e.action,photoUrl:e.photoUrl,photoFileId:e.photoFileId,deviceId:e.deviceId,status:e.status,note:e.note})),recurringItems:itemResults,adjustments:adjustments,totals:{baseWage:totalBase,lateDeduction:totalLateDeduction,nightAllowance:totalNight,otHours:totalOtHours,otPay:totalOtPay,recurringEarnings:recurringEarn,recurringDeductions:recurringDed,adjustmentEarnings:adjEarn,adjustmentDeductions:adjDed,gross:gross,totalDeductions:deductions,net:net,workedDays:workedDays,nightShifts:nightShifts},serverEpochMs:Date.now()};
}

function adminGetEmployeePayItems_(token, employeeId) {
  requireAdmin_(token);const ss=SpreadsheetApp.openById(SPREADSHEET_ID);return {rows:employeePayItems_(ss,String(employeeId||''),'0000-01-01','9999-12-31'),serverEpochMs:Date.now()};
}

function adminSaveEmployeePayItem_(token, employeeId, item) {
  requireAdmin_(token);const id=String(employeeId||'').trim();if(!id)throw new Error('ไม่พบพนักงาน');
  const type=String(item.type||'EARNING').toUpperCase(),method=String(item.method||'PER_PERIOD').toUpperCase(),name=String(item.name||'').trim(),amount=Number(item.amount)||0;
  if(!['EARNING','DEDUCTION'].includes(type))throw new Error('ประเภทรายการไม่ถูกต้อง');if(!['PER_WORKDAY','PER_NIGHT_SHIFT','PER_PERIOD'].includes(method))throw new Error('วิธีคิดไม่ถูกต้อง');if(!name)throw new Error('กรุณาระบุชื่อรายการ');if(amount<0)throw new Error('จำนวนเงินต้องไม่ติดลบ');
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(EMPLOYEE_PAY_ITEMS_SHEET);let row=0,itemId=String(item.itemId||'').trim();
  if(itemId&&sh.getLastRow()>=2){const ids=sh.getRange(2,1,sh.getLastRow()-1,1).getValues();for(let i=0;i<ids.length;i++)if(String(ids[i][0])===itemId){row=i+2;break}}
  const start=item.effectiveStart?parseIsoDate_(item.effectiveStart):'',end=item.effectiveEnd?parseIsoDate_(item.effectiveEnd):'';if(start&&end&&end<start)throw new Error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันเริ่ม');
  if(!itemId)itemId='PAYITEM-'+Utilities.getUuid().slice(0,8).toUpperCase();const now=new Date();
  const values=[itemId,id,type,name,method,amount,start||'',end||'',item.active!==false,false,row?sh.getRange(row,11).getValue()||now:now,now,String(item.note||'')];
  if(row)sh.getRange(row,1,1,13).setValues([values]);else sh.appendRow(values);
  return {ok:true,itemId:itemId};
}

function adminDeleteEmployeePayItem_(token, itemId) {
  requireAdmin_(token);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(EMPLOYEE_PAY_ITEMS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)throw new Error('ไม่พบรายการ');
  const ids=sh.getRange(2,1,last-1,1).getValues();for(let i=0;i<ids.length;i++)if(String(ids[i][0])===String(itemId)){sh.getRange(i+2,9).setValue(false);sh.getRange(i+2,12).setValue(new Date());return {ok:true}}
  throw new Error('ไม่พบรายการ');
}

function adminAddPayrollAdjustment_(token, adjustment) {
  requireAdmin_(token);const type=String(adjustment.type||'EARNING').toUpperCase(),name=String(adjustment.name||'').trim(),amount=Number(adjustment.amount)||0,employeeId=String(adjustment.employeeId||'').trim(),periodKey=String(adjustment.periodKey||'').trim();
  if(!['EARNING','DEDUCTION'].includes(type)||!name||!employeeId||!periodKey)throw new Error('ข้อมูลรายการเพิ่ม/หักไม่ครบ');if(amount<0)throw new Error('จำนวนเงินต้องไม่ติดลบ');
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(PAYROLL_ADJUSTMENTS_SHEET),id='ADJ-'+Utilities.getUuid().slice(0,8).toUpperCase(),dt=adjustment.effectiveDate?parseIsoDate_(adjustment.effectiveDate):'';
  sh.appendRow([id,periodKey,employeeId,type,name,amount,dt||'','ACTIVE',new Date(),'ADMIN',String(adjustment.note||''),String(adjustment.reference||''),false]);return {ok:true,adjustmentId:id};
}

function adminDeletePayrollAdjustment_(token, adjustmentId) {
  requireAdmin_(token);const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(PAYROLL_ADJUSTMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)throw new Error('ไม่พบรายการ');
  const vals=sh.getRange(2,1,last-1,13).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(adjustmentId)){if(Boolean(vals[i][12]))throw new Error('รายการนี้ถูกล็อกแล้ว');sh.getRange(i+2,8).setValue('DELETED');return {ok:true}}
  throw new Error('ไม่พบรายการ');
}

function adminGetAttendanceLatest_(token, limit) {
  requireAdmin_(token);
  const n = Math.max(1, Math.min(Number(limit)||50, 100));
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(ATTENDANCE_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) return {rows:[], serverEpochMs:Date.now()};
  const start = Math.max(2, last - n + 1);
  const rows = sh.getRange(start,1,last-start+1,15).getValues().reverse().map(r => ({
    transactionId:toClientText_(r[0]), timestamp:formatDateTimeForClient_(r[1]), employeeId:toClientText_(r[4]), employeeName:toClientText_(r[5]),
    action:toClientText_(r[6]), photoUrl:toClientText_(r[8]), deviceId:toClientText_(r[10]), status:toClientText_(r[11]), note:toClientText_(r[14])
  }));
  return {rows:rows, serverEpochMs:Date.now()};
}

function adminApproveRegistrationFast_(token, registrationId, employee, registration) {
  requireAdmin_(token);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const regSh = ss.getSheetByName(REGISTRATION_SHEET);
    const empSh = ss.getSheetByName(EMPLOYEE_SHEET);
    if (!regSh || !empSh) throw new Error('ไม่พบชีตระบบ');

    const regLast = regSh.getLastRow();
    if (regLast < 2) throw new Error('Registration not found');
    const regIds = regSh.getRange(2,1,regLast-1,1).getValues();
    let regRow = 0;
    for (let i=0;i<regIds.length;i++) if (String(regIds[i][0]) === String(registrationId)) { regRow=i+2; break; }
    if (!regRow) throw new Error('Registration not found');

    let r = regSh.getRange(regRow,1,1,Math.max(30,regSh.getLastColumn())).getValues()[0];
    if (String(r[2]) === 'APPROVED') throw new Error('Registration already approved');

    if (registration && Object.keys(registration).length) {
      const branch=validateBranchV7_(registration.branch,false);
      const position=validateRegistrationChoice_(registration.position,['MANAGER','SUPERVISOR','STAFF'],'Position');
      const department=registration.department!==undefined?validateDepartmentV7_(registration.department,true):String(r[29]||'');
      const birthDate=parseIsoDate_(registration.birthDate), startDate=parseIsoDate_(registration.startDate);
      const photoUrl=String(registration.photoUrl || r[17] || '');
      const photoFileId=String(r[18] || '');
      regSh.getRange(regRow,4,1,17).setValues([[
        branch,String(registration.firstName||''),String(registration.lastName||''),String(registration.nickname||''),String(registration.phone||''),String(registration.contact||''),position,
        birthDate,startDate,String(registration.registeredAddress||''),String(registration.currentAddress||''),String(registration.emergencyName||''),String(registration.emergencyPhone||''),
        String(registration.emergencyRelationship||''),photoUrl,photoFileId,String(registration.adminNote||'')
      ]]);
      regSh.getRange(regRow,8).setNumberFormat('@'); regSh.getRange(regRow,13,1,2).setNumberFormat('@'); regSh.getRange(regRow,16).setNumberFormat('@'); regSh.getRange(regRow,11,1,2).setNumberFormat('dd/mm/yyyy');
      regSh.getRange(regRow,23).setValue(String(registration.wageType||'')); regSh.getRange(regRow,24).setValue(Number(registration.wageAmount)||0).setNumberFormat('#,##0.00');
      regSh.getRange(regRow,26).setNumberFormat('@').setValue(String(registration.bankName||'').trim()); regSh.getRange(regRow,27).setNumberFormat('@').setValue(String(registration.bankAccountNo||'').replace(/[^0-9A-Za-z-]/g,'').trim()); regSh.getRange(regRow,28).setNumberFormat('@').setValue(String(registration.bankAccountName||'').trim()); regSh.getRange(regRow,29).setNumberFormat('@').setValue(String(registration.bankCode||'').trim()); regSh.getRange(regRow,30).setValue(department);
      r = regSh.getRange(regRow,1,1,Math.max(30,regSh.getLastColumn())).getValues()[0];
    }

    const empLast = empSh.getLastRow();
    const empRows = empLast >= 2 ? empSh.getRange(2,1,empLast-1,26).getValues() : [];
    const id = employeeIdFromRows_(empRows);
    let employeePinHash = String(r[24]||'').trim();
    const fallbackPin = String((employee && employee.pin) || '');
    if (!employeePinHash) {
      if (!/^\d{4}$/.test(fallbackPin)) throw new Error('รายการเก่านี้ยังไม่มี PIN กรุณากำหนด PIN 4 หลัก');
      employeePinHash = hashPortablePin_(fallbackPin);
    }
    const wageType=String((employee && employee.wageType)||r[22]||'').trim();
    const wageAmount=Number((employee && employee.wageAmount)||r[23]||0);
    const fullName=(String(r[4])+' '+String(r[5])).trim();
    empSh.appendRow([id,fullName,true,Number((employee&&employee.sort)||999),'',new Date(),employeePinHash,String(r[6]||''),String(r[7]||''),r[11]||'',String(r[3]||''),String(r[4]||''),String(r[5]||''),String(r[9]||''),wageType,wageAmount,r[10]||'','',String(r[12]||''),String(r[13]||''),String(r[14]||''),String(r[15]||''),String(r[16]||''),String(r[17]||''),'ACTIVE',String(r[19]||''),0,String(r[25]||''),String(r[26]||''),String(r[27]||''),String(r[28]||''),String(r[29]||''),'EMPLOYEE']);
    const erow=empSh.getLastRow();
    empSh.getRange(erow,9).setNumberFormat('@'); empSh.getRange(erow,10).setNumberFormat('dd/mm/yyyy'); empSh.getRange(erow,16).setNumberFormat('#,##0.00'); empSh.getRange(erow,17,1,2).setNumberFormat('dd/mm/yyyy'); empSh.getRange(erow,22).setNumberFormat('@'); empSh.getRange(erow,19,1,2).setNumberFormat('@'); empSh.getRange(erow,28,1,4).setNumberFormat('@');

    regSh.getRange(regRow,3).setValue('APPROVED'); regSh.getRange(regRow,21).setValue(new Date()); regSh.getRange(regRow,22).setValue(id); regSh.getRange(regRow,23).setValue(wageType); regSh.getRange(regRow,24).setValue(wageAmount).setNumberFormat('#,##0.00');
    attachDocumentsToEmployee_(ss, registrationId, id);
    SpreadsheetApp.flush();
    invalidateAdminSummary_();
    return {ok:true,employeeId:id,nextEmployeeId:employeeIdFromRows_(empRows.concat([[id]])),serverEpochMs:Date.now()};
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function adminGetDashboard(token) {
  requireAdmin_(token);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(ATTENDANCE_SHEET);
  const last = sh.getLastRow();
  const start = Math.max(2, last - 99);
  let rows = [];

  if (last >= 2) {
    rows = sh.getRange(start, 1, last - start + 1, 15).getValues()
      .reverse()
      .map(r => ({
        transactionId: toClientText_(r[0]),
        timestamp: formatDateTimeForClient_(r[1]),
        date: formatDateForClient_(r[2]),
        time: formatTimeForClient_(r[3]),
        employeeId: toClientText_(r[4]),
        employeeName: toClientText_(r[5]),
        action: toClientText_(r[6]),
        photoUrl: toClientText_(r[8]),
        deviceId: toClientText_(r[10]),
        status: toClientText_(r[11]),
        note: toClientText_(r[14])
      }));
  }

  // สำคัญ: ข้อมูลที่ส่งกลับไปหน้า HTML ต้องเป็นชนิดที่ serialize ได้
  // จึงแปลง Date ทั้งหมดเป็น string ก่อนส่งผ่าน google.script.run
  return {
    employees: getEmployeesAdmin_().map(e => ({
      id: toClientText_(e.id),
      name: toClientText_(e.name),
      active: Boolean(e.active),
      sort: Number(e.sort) || 999,
      pinSet: Boolean(e.pinSet),
      nickname: toClientText_(e.nickname),
      phone: toClientText_(e.phone),
      startDate: formatDateInputForClient_(e.startDate),
      branch: toClientText_(e.branch),
      firstName: toClientText_(e.firstName),
      lastName: toClientText_(e.lastName),
      position: toClientText_(e.position),
      wageType: toClientText_(e.wageType),
      wageAmount: Number(e.wageAmount) || 0,
      birthDate: formatDateInputForClient_(e.birthDate),
      resignationDate: formatDateInputForClient_(e.resignationDate),
      registeredAddress: toClientText_(e.registeredAddress),
      currentAddress: toClientText_(e.currentAddress),
      emergencyName: toClientText_(e.emergencyName),
      emergencyPhone: toClientText_(e.emergencyPhone),
      emergencyRelationship: toClientText_(e.emergencyRelationship),
      photoUrl: toClientText_(e.photoUrl),
      photoFileId: extractDriveFileId_(e.photoUrl),
      employmentStatus: toClientText_(e.employmentStatus),
      adminNote: toClientText_(e.adminNote),
      dailyWage: Number(e.dailyWage) || 0,
      bankName: toClientText_(e.bankName),
      bankAccountNo: toClientText_(e.bankAccountNo),
      bankAccountName: toClientText_(e.bankAccountName),
      bankCode: toClientText_(e.bankCode),
      department: toClientText_(e.department),
      accessRole: toClientText_(e.accessRole)
    })),
    registrations: getEmployeeRegistrationsAdmin_(),
    attendance: rows,
    nextEmployeeId: nextEmployeeId_(),
    sheetUrl: String(ss.getUrl())
  };
}

function toClientText_(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return Utilities.formatDate(value, TZ, 'dd/MM/yyyy HH:mm:ss');
  return String(value);
}

function formatDateTimeForClient_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, TZ, 'dd/MM/yyyy HH:mm:ss');
  return toClientText_(value);
}

function formatDateForClient_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, TZ, 'dd/MM/yyyy');
  return toClientText_(value);
}

function formatTimeForClient_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, TZ, 'HH:mm:ss');
  return toClientText_(value);
}

function formatDateInputForClient_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, TZ, 'yyyy-MM-dd');
  const text = String(value || '').trim();
  if (!text) return '';
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? text : '';
}

function parseIsoDate_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('วันที่เริ่มงานไม่ถูกต้อง');
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) throw new Error('วันที่เริ่มงานไม่ถูกต้อง');
  return dt;
}

function adminAddEmployee(token, employee) {
  requireAdmin_(token);
  if (!employee || !String(employee.id||'').trim() || !String(employee.name||'').trim()) throw new Error('กรอกรหัสและชื่อพนักงาน');
  const id = String(employee.id).trim();
  const pin = String(employee.pin || '');
  if (!/^\d{4}$/.test(pin)) throw new Error('รหัสลงเวลาต้องเป็นตัวเลข 4 หลัก');
  if (findEmployeeAny_(id)) throw new Error('รหัสพนักงานนี้มีอยู่แล้ว');
  const nickname = String(employee.nickname || '').trim();
  const phone = String(employee.phone || '').trim();
  const startDate = parseIsoDate_(employee.startDate);
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  sh.appendRow([id, String(employee.name).trim(), true, Number(employee.sort)||999, '', new Date(), hashPortablePin_(pin), nickname, phone, startDate, String(employee.branch||''), String(employee.firstName||''), String(employee.lastName||''), String(employee.position||''), String(employee.wageType||''), Number(employee.wageAmount)||0, parseIsoDate_(employee.birthDate), parseIsoDate_(employee.resignationDate), String(employee.registeredAddress||''), String(employee.currentAddress||''), String(employee.emergencyName||''), String(employee.emergencyPhone||''), String(employee.emergencyRelationship||''), String(employee.photoUrl||''), String(employee.employmentStatus||'ACTIVE'), String(employee.adminNote||''), Number(employee.dailyWage)||0, String(employee.bankName||''), String(employee.bankAccountNo||''), String(employee.bankAccountName||''), String(employee.bankCode||''), String(employee.department||''), String(employee.accessRole||'EMPLOYEE')]);
  const row = sh.getLastRow();
  sh.getRange(row, 9).setNumberFormat('@');
  if (startDate) sh.getRange(row, 10).setNumberFormat('dd/mm/yyyy');
  return { ok:true };
}

function adminSetEmployeeActive(token, employeeId, active) {
  requireAdmin_(token);
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  if (last < 2) throw new Error('ไม่พบพนักงาน');
  const vals = sh.getRange(2,1,last-1,6).getValues();
  for (let i=0;i<vals.length;i++) {
    if (String(vals[i][0]) === String(employeeId)) {
      sh.getRange(i+2,3).setValue(Boolean(active));
      sh.getRange(i+2,6).setValue(new Date());
      return {ok:true};
    }
  }
  throw new Error('ไม่พบพนักงาน');
}

function adminSetEmployeePin(token, employeeId, newPin) {
  requireAdmin_(token);
  const id = String(employeeId || '').trim();
  const pin = String(newPin || '');
  if (!/^\d{4}$/.test(pin)) throw new Error('รหัสลงเวลาต้องเป็นตัวเลข 4 หลัก');
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  if (last < 2) throw new Error('ไม่พบพนักงาน');
  const vals = sh.getRange(2,1,last-1,7).getValues();
  for (let i=0;i<vals.length;i++) {
    if (String(vals[i][0]) === id) {
      sh.getRange(i+2,7).setValue(hashPortablePin_(pin));
      sh.getRange(i+2,6).setValue(new Date());
      return {ok:true};
    }
  }
  throw new Error('ไม่พบพนักงาน');
}

function adminUpdateEmployeeProfile(token, employeeId, profile) {
  requireAdmin_(token);
  const id = String(employeeId || '').trim();
  if (!id) throw new Error('Employee ID required');
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  if (last < 2) throw new Error('Employee not found');
  const vals = sh.getRange(2,1,last-1,1).getValues();
  for (let i=0;i<vals.length;i++) {
    if (String(vals[i][0]) === id) {
      const row = i + 2;
      const nickname = String((profile && profile.nickname) || '').trim();
      const phone = String((profile && profile.phone) || '').trim();
      const startDate = parseIsoDate_(profile && profile.startDate);
      const birthDate = parseIsoDate_(profile && profile.birthDate);
      const resignationDate = parseIsoDate_(profile && profile.resignationDate);
      sh.getRange(row,8).setValue(nickname);
      sh.getRange(row,9).setNumberFormat('@').setValue(phone);
      if (startDate) sh.getRange(row,10).setValue(startDate).setNumberFormat('dd/mm/yyyy'); else sh.getRange(row,10).clearContent();
      sh.getRange(row,11).setValue(String((profile && profile.branch) || ''));
      sh.getRange(row,12).setValue(String((profile && profile.firstName) || ''));
      sh.getRange(row,13).setValue(String((profile && profile.lastName) || ''));
      sh.getRange(row,14).setValue(String((profile && profile.position) || ''));
      sh.getRange(row,15).setValue(String((profile && profile.wageType) || ''));
      sh.getRange(row,16).setValue(Number((profile && profile.wageAmount) || 0)).setNumberFormat('#,##0.00');
      if (birthDate) sh.getRange(row,17).setValue(birthDate).setNumberFormat('dd/mm/yyyy'); else sh.getRange(row,17).clearContent();
      if (resignationDate) sh.getRange(row,18).setValue(resignationDate).setNumberFormat('dd/mm/yyyy'); else sh.getRange(row,18).clearContent();
      sh.getRange(row,19).setValue(String((profile && profile.registeredAddress) || ''));
      sh.getRange(row,20).setValue(String((profile && profile.currentAddress) || ''));
      sh.getRange(row,21).setValue(String((profile && profile.emergencyName) || ''));
      sh.getRange(row,22).setNumberFormat('@').setValue(String((profile && profile.emergencyPhone) || ''));
      sh.getRange(row,23).setValue(String((profile && profile.emergencyRelationship) || ''));
      sh.getRange(row,24).setValue(String((profile && profile.photoUrl) || ''));
      sh.getRange(row,25).setValue(String((profile && profile.employmentStatus) || 'ACTIVE'));
      sh.getRange(row,26).setValue(String((profile && profile.adminNote) || ''));
      sh.getRange(row,27).setValue(Number((profile && profile.dailyWage) || 0)).setNumberFormat('#,##0.00');
      sh.getRange(row,28).setNumberFormat('@').setValue(String((profile && profile.bankName) || '').trim());
      sh.getRange(row,29).setNumberFormat('@').setValue(String((profile && profile.bankAccountNo) || '').replace(/[^0-9A-Za-z-]/g,'').trim());
      sh.getRange(row,30).setNumberFormat('@').setValue(String((profile && profile.bankAccountName) || '').trim());
      sh.getRange(row,31).setNumberFormat('@').setValue(String((profile && profile.bankCode) || '').trim());
      if (profile && profile.department !== undefined) sh.getRange(row,32).setValue(validateDepartmentV7_(profile.department,true));
      if (profile && profile.accessRole !== undefined) { const role=String(profile.accessRole||'EMPLOYEE').toUpperCase(); if(['EMPLOYEE','MANAGER'].indexOf(role)<0) throw new Error('Access Role ไม่ถูกต้อง'); sh.getRange(row,33).setValue(role); }
      sh.getRange(row,6).setValue(new Date());
      return {ok:true};
    }
  }
  throw new Error('Employee not found');
}

function adminChangePin(token, newPin) {
  requireAdmin_(token);
  if (!/^\d{6}$/.test(String(newPin))) throw new Error('PIN Admin ต้องเป็นตัวเลข 6 หลัก');
  PropertiesService.getScriptProperties().setProperty('ADMIN_PIN', String(newPin));
  return {ok:true};
}

function requireAdmin_(token) {
  const cache = CacheService.getScriptCache();
  if (!token || cache.get('ADMIN_' + token) !== '1') throw new Error('สิทธิ์ Admin หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  // ต่ออายุ Session เมื่อ Admin ยังใช้งานอยู่
  cache.put('ADMIN_' + token, '1', 14400);
}


function findEmployee_(employeeId) {
  const e = findEmployeeAny_(employeeId);
  return e && e.active ? e : null;
}

function findEmployeeAny_(employeeId) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return null;
  const vals = sh.getRange(2,1,last-1,8).getValues();
  for (const r of vals) {
    if (String(r[0]) === String(employeeId)) return {id:String(r[0]), name:String(r[1]), active:r[2] !== false, sort:Number(r[3])||999, pinHash:String(r[6]||''), nickname:String(r[7]||'')};
  }
  return null;
}

function getEmployeesAdmin_() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2,1,last-1,Math.max(33,sh.getLastColumn())).getValues()
    .filter(r => String(r[0]).trim())
    .map(r => ({
      id:String(r[0]), name:String(r[1]), active:r[2] !== false, sort:Number(r[3])||999,
      pinSet:Boolean(String(r[6]||'').trim()), nickname:String(r[7]||''), phone:String(r[8]||''), startDate:r[9] || '',
      branch:String(r[10]||''), firstName:String(r[11]||''), lastName:String(r[12]||''), position:String(r[13]||''),
      wageType:String(r[14]||''), wageAmount:Number(r[15])||0, birthDate:r[16]||'', resignationDate:r[17]||'',
      registeredAddress:String(r[18]||''), currentAddress:String(r[19]||''), emergencyName:String(r[20]||''), emergencyPhone:String(r[21]||''),
      emergencyRelationship:String(r[22]||''), photoUrl:String(r[23]||''), employmentStatus:String(r[24]||''), adminNote:String(r[25]||''), dailyWage:Number(r[26])||0,
      bankName:String(r[27]||''), bankAccountNo:String(r[28]||''), bankAccountName:String(r[29]||''), bankCode:String(r[30]||''),
      department:String(r[31]||''), accessRole:String(r[32]||'') || (String(r[13]||'').toUpperCase()==='MANAGER'?'MANAGER':'EMPLOYEE')
    }))
    .sort((a,b) => a.sort - b.sort || a.name.localeCompare(b.name, 'th'));
}


function validateRegistrationChoice_(value, allowed, label) {
  const text = String(value || '').trim();
  if (!allowed.includes(text)) throw new Error(label + ' invalid');
  return text;
}

function submitEmployeeRegistration_(registration) {
  const branch = validateBranchV7_(registration.branch, false);
  const position = validateRegistrationChoice_(registration.position, ['MANAGER','SUPERVISOR','STAFF'], 'Position');
  const department = validateDepartmentV7_(registration.department, true);
  const firstName = String(registration.firstName || '').trim();
  const lastName = String(registration.lastName || '').trim();
  const nickname = String(registration.nickname || '').trim();
  const phone = String(registration.phone || '').trim();
  const contact = String(registration.contact || '').trim();
  const registeredAddress = String(registration.registeredAddress || '').trim();
  const currentAddress = String(registration.currentAddress || '').trim();
  const emergencyName = String(registration.emergencyName || '').trim();
  const emergencyPhone = String(registration.emergencyPhone || '').trim();
  const emergencyRelationship = String(registration.emergencyRelationship || '').trim();
  const bankName = String(registration.bankName || '').trim();
  const bankAccountNo = String(registration.bankAccountNo || '').replace(/[^0-9A-Za-z-]/g,'').trim();
  const bankAccountName = String(registration.bankAccountName || '').trim();
  const bankCode = String(registration.bankCode || '').trim();
  const birthDate = parseIsoDate_(registration.birthDate);
  const startDate = parseIsoDate_(registration.startDate);
  const employeePin = String(registration.employeePin || '');
  if (!/^\d{4}$/.test(employeePin)) throw new Error('กรุณาตั้ง PIN ลงเวลาเป็นตัวเลข 4 หลัก');
  const registrationPinHash = hashPortablePin_(employeePin);
  if (!firstName || !lastName || !phone || !registeredAddress || !currentAddress || !emergencyName || !emergencyPhone || !birthDate || !bankName || !bankAccountNo || !bankAccountName) throw new Error('Required fields missing');
  if (!registration.consent) throw new Error('Consent required');
  const registrationId = 'REG-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0,6).toUpperCase();
  let photoUrl='', photoFileId='';
  if (registration.photoData) {
    const folder = ensureRegistrationPhotoFolder_();
    const blob = dataUrlToBlob_(registration.photoData, registrationId + '.jpg');
    const file = folder.createFile(blob);
    file.setDescription('Employee registration ' + registrationId + ' ' + firstName + ' ' + lastName);
    photoUrl = file.getUrl(); photoFileId = file.getId();
  }
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REGISTRATION_SHEET);
  sh.appendRow([registrationId,new Date(),'PENDING',branch,firstName,lastName,nickname,phone,contact,position,birthDate,startDate,registeredAddress,currentAddress,emergencyName,emergencyPhone,emergencyRelationship,photoUrl,photoFileId,'','', '', '', 0, registrationPinHash,bankName,bankAccountNo,bankAccountName,bankCode,department]);
  const row = sh.getLastRow();
  sh.getRange(row,8).setNumberFormat('@'); sh.getRange(row,13,1,2).setNumberFormat('@'); sh.getRange(row,16).setNumberFormat('@');
  sh.getRange(row,11,1,2).setNumberFormat('dd/mm/yyyy'); sh.getRange(row,26,1,4).setNumberFormat('@');
  return {ok:true, registrationId:registrationId};
}

function getEmployeeRegistrationsAdmin_() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REGISTRATION_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) return [];
  return sh.getRange(2,1,last-1,Math.max(30,sh.getLastColumn())).getValues().reverse().map(r => ({
    registrationId:toClientText_(r[0]), submittedAt:formatDateTimeForClient_(r[1]), status:toClientText_(r[2]), branch:toClientText_(r[3]),
    firstName:toClientText_(r[4]), lastName:toClientText_(r[5]), nickname:toClientText_(r[6]), phone:toClientText_(r[7]), contact:toClientText_(r[8]),
    position:toClientText_(r[9]), birthDate:formatDateInputForClient_(r[10]), startDate:formatDateInputForClient_(r[11]), registeredAddress:toClientText_(r[12]),
    currentAddress:toClientText_(r[13]), emergencyName:toClientText_(r[14]), emergencyPhone:toClientText_(r[15]), emergencyRelationship:toClientText_(r[16]),
    photoUrl:toClientText_(r[17]), photoFileId:toClientText_(r[18]), adminNote:toClientText_(r[19]), reviewedAt:formatDateTimeForClient_(r[20]), employeeId:toClientText_(r[21]),
    wageType:toClientText_(r[22]), wageAmount:Number(r[23])||0, pinSet:Boolean(String(r[24]||'').trim()),
      bankName:toClientText_(r[25]), bankAccountNo:toClientText_(r[26]), bankAccountName:toClientText_(r[27]), bankCode:toClientText_(r[28]), department:toClientText_(r[29])
  }));
}

function findRegistrationRow_(registrationId) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REGISTRATION_SHEET);
  const last = sh.getLastRow();
  if (last < 2) throw new Error('Registration not found');
  const vals = sh.getRange(2,1,last-1,1).getValues();
  for (let i=0;i<vals.length;i++) if (String(vals[i][0])===String(registrationId)) return {sh:sh,row:i+2};
  throw new Error('Registration not found');
}

function adminUpdateRegistration(token, registrationId, registration) {
  requireAdmin_(token);
  const x=findRegistrationRow_(registrationId), sh=x.sh, row=x.row;
  const branch=validateBranchV7_(registration.branch,false);
  const position=validateRegistrationChoice_(registration.position,['MANAGER','SUPERVISOR','STAFF'],'Position');
  const department=registration.department!==undefined?validateDepartmentV7_(registration.department,true):String(sh.getRange(row,30).getValue()||'');
  const birthDate=parseIsoDate_(registration.birthDate), startDate=parseIsoDate_(registration.startDate);
  sh.getRange(row,4,1,17).setValues([[
    branch,String(registration.firstName||''),String(registration.lastName||''),String(registration.nickname||''),String(registration.phone||''),String(registration.contact||''),position,
    birthDate,startDate,String(registration.registeredAddress||''),String(registration.currentAddress||''),String(registration.emergencyName||''),String(registration.emergencyPhone||''),
    String(registration.emergencyRelationship||''),String(registration.photoUrl||sh.getRange(row,18).getValue()||''),sh.getRange(row,19).getValue(),String(registration.adminNote||'')
  ]]);
  sh.getRange(row,8).setNumberFormat('@'); sh.getRange(row,16).setNumberFormat('@'); sh.getRange(row,11,1,2).setNumberFormat('dd/mm/yyyy');
  sh.getRange(row,23).setValue(String(registration.wageType||'')); sh.getRange(row,24).setValue(Number(registration.wageAmount)||0).setNumberFormat('#,##0.00');
  sh.getRange(row,26).setNumberFormat('@').setValue(String(registration.bankName||'').trim()); sh.getRange(row,27).setNumberFormat('@').setValue(String(registration.bankAccountNo||'').replace(/[^0-9A-Za-z-]/g,'').trim()); sh.getRange(row,28).setNumberFormat('@').setValue(String(registration.bankAccountName||'').trim()); sh.getRange(row,29).setNumberFormat('@').setValue(String(registration.bankCode||'').trim());
  sh.getRange(row,30).setValue(department);
  return {ok:true};
}

function adminApproveRegistration(token, registrationId, employee, registration) {
  requireAdmin_(token);
  // บันทึกการแก้ไขจากหน้า Admin และอนุมัติใน server call เดียว ลดเวลารอและลดโอกาส timeout
  if (registration && Object.keys(registration).length) {
    adminUpdateRegistration(token, registrationId, registration);
  }
  const x=findRegistrationRow_(registrationId), sh=x.sh, row=x.row;
  const r=sh.getRange(row,1,1,Math.max(30,sh.getLastColumn())).getValues()[0];
  if (String(r[2])==='APPROVED') throw new Error('Registration already approved');
  const id=nextEmployeeId_(), pin=String(employee.pin||'');
  let employeePinHash = String(r[24]||'').trim();
  if (!employeePinHash) {
    if (!/^\d{4}$/.test(pin)) throw new Error('รายการเก่านี้ยังไม่มี PIN กรุณากำหนด PIN 4 หลัก');
    employeePinHash = hashPortablePin_(pin);
  }
  if (findEmployeeAny_(id)) throw new Error('Employee ID already exists');
  const wageType=String(employee.wageType||r[22]||'').trim();
  const wageAmount=Number(employee.wageAmount||r[23]||0);
  const fullName=(String(r[4])+' '+String(r[5])).trim();
  const empSh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  empSh.appendRow([id,fullName,true,Number(employee.sort)||999,'',new Date(),employeePinHash,String(r[6]||''),String(r[7]||''),r[11]||'',String(r[3]||''),String(r[4]||''),String(r[5]||''),String(r[9]||''),wageType,wageAmount,r[10]||'','',String(r[12]||''),String(r[13]||''),String(r[14]||''),String(r[15]||''),String(r[16]||''),String(r[17]||''),'ACTIVE',String(r[19]||''),0,String(r[25]||''),String(r[26]||''),String(r[27]||''),String(r[28]||''),String(r[29]||''),'EMPLOYEE']);
  const erow=empSh.getLastRow(); empSh.getRange(erow,9).setNumberFormat('@'); empSh.getRange(erow,10).setNumberFormat('dd/mm/yyyy'); empSh.getRange(erow,16).setNumberFormat('#,##0.00'); empSh.getRange(erow,17,1,2).setNumberFormat('dd/mm/yyyy'); empSh.getRange(erow,22).setNumberFormat('@'); empSh.getRange(erow,28,1,4).setNumberFormat('@');
  sh.getRange(row,3).setValue('APPROVED'); sh.getRange(row,21).setValue(new Date()); sh.getRange(row,22).setValue(id); sh.getRange(row,23).setValue(wageType); sh.getRange(row,24).setValue(wageAmount).setNumberFormat('#,##0.00');
  return {ok:true,employeeId:id};
}

function adminRejectRegistration(token, registrationId, note) {
  requireAdmin_(token);
  const x=findRegistrationRow_(registrationId);
  x.sh.getRange(x.row,3).setValue('REJECTED'); x.sh.getRange(x.row,20).setValue(String(note||'')); x.sh.getRange(x.row,21).setValue(new Date());
  return {ok:true};
}


function ensureEmployeeDocumentFolder_(registrationId) {
  const props = PropertiesService.getScriptProperties();
  const key='EMPLOYEE_DOCUMENTS_ROOT_FOLDER_ID';
  let root=null;
  const existing=props.getProperty(key);
  if (existing) { try { root=DriveApp.getFolderById(existing); } catch(e) {} }
  if (!root) {
    const name='Krua Flow Employee Documents';
    const it=DriveApp.getFoldersByName(name);
    root=it.hasNext()?it.next():DriveApp.createFolder(name);
    props.setProperty(key,root.getId());
  }
  const safe=String(registrationId||'UNASSIGNED').replace(/[^A-Za-z0-9_-]/g,'_');
  const it2=root.getFoldersByName(safe);
  return it2.hasNext()?it2.next():root.createFolder(safe);
}

function genericDataUrlToBlob_(dataUrl, fileName) {
  const m=String(dataUrl||'').match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('ไฟล์เอกสารไม่ถูกต้อง');
  const mime=String(m[1]||'application/octet-stream');
  const bytes=Utilities.base64Decode(m[2]);
  if (bytes.length > 6*1024*1024) throw new Error('ไฟล์เอกสารใหญ่เกิน 6 MB');
  return Utilities.newBlob(bytes,mime,String(fileName||'document'));
}

function uploadEmployeeRegistrationDocument_(registrationId, document) {
  const rid=String(registrationId||'').trim();
  if (!rid) throw new Error('ไม่พบเลขอ้างอิงการลงทะเบียน');
  // Require registration to exist so arbitrary public uploads cannot create unlinked documents.
  findRegistrationRow_(rid);
  const type=String(document.type||'OTHER').trim().toUpperCase();
  const allowed=['ID_CARD','HOUSE_REGISTRATION','EDUCATION','OTHER'];
  if (!allowed.includes(type)) throw new Error('ประเภทเอกสารไม่ถูกต้อง');
  const label=String(document.label||'เอกสาร').trim().slice(0,120);
  const original=String(document.fileName||'document').replace(/[\\/:*?\"<>|]/g,'_').slice(0,180);
  const blob=genericDataUrlToBlob_(document.dataUrl,original);
  const folder=ensureEmployeeDocumentFolder_(rid);
  const docId='DOC-'+Utilities.formatDate(new Date(),TZ,'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
  blob.setName(docId+'_'+original);
  const file=folder.createFile(blob);
  file.setDescription('Krua Flow employee document '+rid+' '+label);
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName(EMPLOYEE_DOCUMENTS_SHEET);
  if (!sh) {
    sh=ss.insertSheet(EMPLOYEE_DOCUMENTS_SHEET);
    const headers=['Document ID','Registration ID','Employee ID','Document Type','Document Label','File Name','MIME Type','File URL','File ID','Uploaded At','Status','Admin Note'];
    sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);
  }
  sh.appendRow([docId,rid,'',type,label,original,blob.getContentType(),file.getUrl(),file.getId(),new Date(),'ACTIVE','']);
  const row=sh.getLastRow();sh.getRange(row,2,1,2).setNumberFormat('@');sh.getRange(row,9).setNumberFormat('@');sh.getRange(row,10).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  return {ok:true,documentId:docId};
}

function adminGetRegistrationDocuments_(token, registrationId, employeeId) {
  requireAdmin_(token);
  const rid=String(registrationId||'').trim(),eid=String(employeeId||'').trim();
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_DOCUMENTS_SHEET);
  const last=sh?sh.getLastRow():0;if(!sh||last<2)return {rows:[],serverEpochMs:Date.now()};
  const vals=sh.getRange(2,1,last-1,12).getValues();
  const rows=vals.filter(r=>String(r[10]||'ACTIVE')!=='DELETED' && ((rid&&String(r[1])===rid)||(eid&&String(r[2])===eid))).map(r=>({
    documentId:toClientText_(r[0]),registrationId:toClientText_(r[1]),employeeId:toClientText_(r[2]),type:toClientText_(r[3]),label:toClientText_(r[4]),fileName:toClientText_(r[5]),mimeType:toClientText_(r[6]),fileId:toClientText_(r[8]),uploadedAt:formatDateTimeForClient_(r[9]),status:toClientText_(r[10]),note:toClientText_(r[11])
  }));
  return {rows:rows,serverEpochMs:Date.now()};
}

function adminGetDocument_(token, fileId) {
  requireAdmin_(token);
  const id=String(fileId||'').trim();if(!id)throw new Error('ไม่พบไฟล์เอกสาร');
  const file=DriveApp.getFileById(id),blob=file.getBlob(),mime=blob.getContentType()||'application/octet-stream';
  return {ok:true,fileName:file.getName(),mimeType:mime,dataUrl:'data:'+mime+';base64,'+Utilities.base64Encode(blob.getBytes())};
}

function attachDocumentsToEmployee_(ss, registrationId, employeeId) {
  const sh=ss.getSheetByName(EMPLOYEE_DOCUMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return;
  const vals=sh.getRange(2,1,last-1,3).getValues();
  for(let i=0;i<vals.length;i++) if(String(vals[i][1])===String(registrationId) && !String(vals[i][2]||'').trim()) sh.getRange(i+2,3).setNumberFormat('@').setValue(String(employeeId));
}

function ensureRegistrationPhotoFolder_() {
  const props = PropertiesService.getScriptProperties();
  const key='REGISTRATION_PHOTO_FOLDER_ID';
  const existing=props.getProperty(key);
  if (existing) { try { return DriveApp.getFolderById(existing); } catch(e) {} }
  const name='Krua Flow Employee Registration Photos';
  const it=DriveApp.getFoldersByName(name);
  const folder=it.hasNext()?it.next():DriveApp.createFolder(name);
  props.setProperty(key,folder.getId());
  return folder;
}

function getPinSalt_() {
  const props = PropertiesService.getScriptProperties();
  let salt = props.getProperty('PIN_SALT');
  if (!salt) {
    salt = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('PIN_SALT', salt);
  }
  return salt;
}

function hashEmployeePin_(employeeId, pin) {
  const raw = getPinSalt_() + '|' + String(employeeId) + '|' + String(pin);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function hashPortablePin_(pin) {
  const raw = getPinSalt_() + '|PIN|' + String(pin);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  const hex = bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
  return 'v2$' + hex;
}

function verifyEmployeePin_(employee, pin) {
  const stored = String(employee.pinHash || '');
  if (stored.indexOf('v2$') === 0) return stored === hashPortablePin_(pin);
  return stored === hashEmployeePin_(employee.id, pin);
}

function rejectDuplicate_(sh, employeeId, action, now, seconds) {
  const last = sh.getLastRow();
  if (last < 2) return;
  const from = Math.max(2, last - 30);
  const vals = sh.getRange(from, 1, last - from + 1, 7).getValues();
  const actionLabel = actionLabel_(action);
  for (let i=vals.length-1;i>=0;i--) {
    if (String(vals[i][4]) === String(employeeId) && String(vals[i][6]) === actionLabel && vals[i][1] instanceof Date) {
      const diff = (now.getTime() - vals[i][1].getTime()) / 1000;
      if (diff >= 0 && diff < seconds) throw new Error('รายการเดิมถูกบันทึกไปแล้ว กรุณารอสักครู่ก่อนบันทึกซ้ำ');
      break;
    }
  }
}

function actionLabel_(action) {
  return ({IN:'เข้างาน', BREAK_OUT:'เริ่มพัก', BREAK_IN:'กลับจากพัก', OUT:'เลิกงาน'})[action] || action;
}

function dataUrlToBlob_(dataUrl, name) {
  const m = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) throw new Error('รูปภาพไม่ถูกต้อง');
  const bytes = Utilities.base64Decode(m[2]);
  return Utilities.newBlob(bytes, m[1], name).getAs('image/jpeg');
}

function ensurePhotoFolder_() {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty('PHOTO_FOLDER_ID');
  if (existing) {
    try { return DriveApp.getFolderById(existing); } catch(e) {}
  }
  const name = getSetting_('PHOTO_FOLDER_NAME') || 'Krua Flow Attendance Photos';
  const it = DriveApp.getFoldersByName(name);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(name);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function getSetting_(key) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SETTINGS_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return '';
  const vals = sh.getRange(2,1,last-1,2).getValues();
  for (const r of vals) if (String(r[0]) === String(key)) return r[1];
  return '';
}

// ============================================================================
// Krua Flow Workforce Management Extension V7.0
// Organization / Manager Scope / Schedule / Leave Quota / Employee Portal /
// Attendance Correction / Shift Monitoring / Payroll Review / Audit / Backup
// ============================================================================

const BRANCHES_SHEET = 'Branches';
const DEPARTMENTS_SHEET = 'Departments';
const SHIFTS_SHEET = 'Shifts';
const MANAGER_SCOPES_SHEET = 'Manager_Scopes';
const WORK_SCHEDULES_SHEET = 'Work_Schedules';
const SCHEDULE_VERSIONS_SHEET = 'Schedule_Versions';
const SCHEDULE_ACK_SHEET = 'Schedule_Acknowledgements';
const LEAVE_QUOTA_RULES_SHEET = 'Leave_Quota_Rules';
const LEAVE_BALANCES_SHEET = 'Leave_Balances';
const ATTENDANCE_CORRECTIONS_SHEET = 'Attendance_Corrections';
const SHIFT_DAILY_CHECKS_SHEET = 'Shift_Daily_Checks';
const SHIFT_SWAP_REQUESTS_SHEET = 'Shift_Swap_Requests';
const STANDBY_ASSIGNMENTS_SHEET = 'Standby_Assignments';
const PAYROLL_SNAPSHOTS_SHEET = 'Payroll_Snapshots';
const PAYROLL_DISPUTES_SHEET = 'Payroll_Disputes';
const EMPLOYEE_CHANGE_REQUESTS_SHEET = 'Employee_Change_Requests';
const NOTIFICATIONS_SHEET = 'Notifications';
const NOTIFICATION_CHANNELS_SHEET = 'Notification_Channels';
const AUDIT_LOG_SHEET = 'Audit_Log';
const BACKUP_LOG_SHEET = 'Backup_Log';
const DEVICES_SHEET = 'Devices';

const PORTAL_TOKEN_PREFIX_ = 'PORTAL_';
const PORTAL_TOKEN_TTL_SECONDS_ = 21600;

function apiV7HandlePost_(payload) {
  const op = String(payload.op || '');

  // Public master data for registration / leave forms.
  if (op === 'orgBootstrap') return orgBootstrapV7_();

  // Employee / Manager portal.
  if (op === 'portalLogin') return portalLoginV7_(payload);
  if (op === 'portalLogout') return portalLogoutV7_(payload);
  if (op === 'portalBootstrap') return portalBootstrapV7_(payload);
  if (op === 'portalHomeBootstrap') return portalHomeBootstrapV7_(payload);
  if (op === 'portalGetProfile') return portalGetProfileV7_(payload);
  if (op === 'portalGetAttendance') return portalGetAttendanceV7_(payload);
  if (op === 'portalGetSchedule') return portalGetScheduleV7_(payload);
  if (op === 'portalAcknowledgeSchedule') return portalAcknowledgeScheduleV7_(payload);
  if (op === 'portalGetLeaveAvailability') return portalGetLeaveAvailabilityV7_(payload);
  if (op === 'portalSubmitLeave') return portalSubmitLeaveV7_(payload);
  if (op === 'portalGetLeaveRequests') return portalGetLeaveRequestsV7_(payload);
  if (op === 'portalSubmitChangeRequest') return portalSubmitChangeRequestV7_(payload);
  if (op === 'portalGetChangeRequests') return portalGetChangeRequestsV7_(payload);
  if (op === 'portalSubmitAttendanceCorrection') return portalSubmitAttendanceCorrectionV7_(payload);
  if (op === 'portalGetAttendanceCorrections') return portalGetAttendanceCorrectionsV7_(payload);
  if (op === 'portalGetPayroll') return portalGetPayrollV7_(payload);
  if (op === 'portalRespondPayroll') return portalRespondPayrollV7_(payload);
  if (op === 'portalGetPayrollDisputes') return portalGetPayrollDisputesV7_(payload);
  if (op === 'portalGetNotifications') return portalGetNotificationsV7_(payload);
  if (op === 'portalMarkNotificationRead') return portalMarkNotificationReadV7_(payload);
  if (op === 'portalRequestShiftSwap') return portalRequestShiftSwapV7_(payload);
  if (op === 'portalRespondShiftSwap') return portalRespondShiftSwapV7_(payload);
  if (op === 'portalGetShiftSwapRequests') return portalGetShiftSwapRequestsV7_(payload);
  if (op === 'portalGetLeaveBalances') return portalGetLeaveBalancesV7_(payload);

  // Manager portal. Manager never receives Admin privileges.
  if (op === 'managerSummary') return managerSummaryV7_(payload);
  if (op === 'managerDashboardBundle') return managerDashboardBundleV7_(payload);
  if (op === 'managerScheduleBundle') return managerScheduleBundleV7_(payload);
  if (op === 'managerGetTeam') return managerGetTeamV7_(payload);
  if (op === 'managerGetLeaveRequests') return managerGetLeaveRequestsV7_(payload);
  if (op === 'managerReviewLeave') return managerReviewLeaveV7_(payload);
  if (op === 'managerGetSchedule') return managerGetScheduleV7_(payload);
  if (op === 'managerSaveSchedule') return managerSaveScheduleV7_(payload);
  if (op === 'managerPublishSchedule') return managerPublishScheduleV7_(payload);
  if (op === 'managerGetDailyChecks') return managerGetDailyChecksV7_(payload);
  if (op === 'managerResolveDailyCheck') return managerResolveDailyCheckV7_(payload);
  if (op === 'managerGetAttendanceCorrections') return managerGetAttendanceCorrectionsV7_(payload);
  if (op === 'managerReviewAttendanceCorrection') return managerReviewAttendanceCorrectionV7_(payload);
  if (op === 'managerGetShiftSwapRequests') return managerGetShiftSwapRequestsV7_(payload);
  if (op === 'managerReviewShiftSwap') return managerReviewShiftSwapV7_(payload);
  if (op === 'managerGetStandby') return managerGetStandbyV7_(payload);
  if (op === 'managerSaveStandby') return managerSaveStandbyV7_(payload);

  // Admin organization / policy / payroll control.
  if (op === 'adminGetOrgMasters') return adminGetOrgMastersV7_(payload);
  if (op === 'adminSaveBranch') return adminSaveBranchV7_(payload);
  if (op === 'adminSaveDepartment') return adminSaveDepartmentV7_(payload);
  if (op === 'adminSaveShift') return adminSaveShiftV7_(payload);
  if (op === 'adminGetPermissionUsers') return adminGetPermissionUsersV7_(payload);
  if (op === 'adminGetManagerScopes') return adminGetManagerScopesV7_(payload);
  if (op === 'adminSaveManagerScope') return adminSaveManagerScopeV7_(payload);
  if (op === 'adminDeleteManagerScope') return adminDeleteManagerScopeV7_(payload);
  if (op === 'adminSetEmployeeAccessRole') return adminSetEmployeeAccessRoleV7_(payload);
  if (op === 'adminGetLeaveQuotaRules') return adminGetLeaveQuotaRulesV7_(payload);
  if (op === 'adminSaveLeaveQuotaRule') return adminSaveLeaveQuotaRuleV7_(payload);
  if (op === 'adminSetLeaveBalance') return adminSetLeaveBalanceV7_(payload);
  if (op === 'adminGetLeaveBalances') return adminGetLeaveBalancesV7_(payload);
  if (op === 'adminGetChangeRequests') return adminGetChangeRequestsV7_(payload);
  if (op === 'adminReviewChangeRequest') return adminReviewChangeRequestV7_(payload);
  if (op === 'adminCreatePayrollReview') return adminCreatePayrollReviewV7_(payload);
  if (op === 'adminCreatePayrollReviewBatch') return adminCreatePayrollReviewBatchV7_(payload);
  if (op === 'adminGetPayrollSnapshots') return adminGetPayrollSnapshotsV7_(payload);
  if (op === 'adminDashboardPayrollBundle') return adminDashboardPayrollBundleV7_(payload);
  if (op === 'adminFinalizePayroll') return adminFinalizePayrollV7_(payload);
  if (op === 'adminFinalizePayrollBatch') return adminFinalizePayrollBatchV7_(payload);
  if (op === 'adminMarkPayrollPaid') return adminMarkPayrollPaidV7_(payload);
  if (op === 'adminMarkPayrollPaidBatch') return adminMarkPayrollPaidBatchV7_(payload);
  if (op === 'adminGetPayrollDisputes') return adminGetPayrollDisputesV7_(payload);
  if (op === 'adminReviewPayrollDispute') return adminReviewPayrollDisputeV7_(payload);
  if (op === 'adminScheduleBundle') return adminScheduleBundleV7_(payload);
  if (op === 'adminGetSchedule') return adminGetScheduleV7_(payload);
  if (op === 'adminSaveSchedule') return adminSaveScheduleV7_(payload);
  if (op === 'adminPublishSchedule') return adminPublishScheduleV7_(payload);
  if (op === 'adminGetAuditLog') return adminGetAuditLogV7_(payload);
  if (op === 'adminGetDevices') return adminGetDevicesV7_(payload);
  if (op === 'adminSaveDevice') return adminSaveDeviceV7_(payload);
  if (op === 'adminUpdateDocumentMeta') return adminUpdateDocumentMetaV7_(payload);
  if (op === 'adminSaveNotificationChannel') return adminSaveNotificationChannelV7_(payload);
  if (op === 'adminBackupNow') return adminBackupNowV7_(payload);
  if (op === 'adminInstallTriggers') return adminInstallTriggersV7_(payload);
  if (op === 'adminOffboardEmployee') return adminOffboardEmployeeV7_(payload);

  return null;
}

function ensureSheetV7_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function setupWorkforceSystem_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const branchSh = ensureSheetV7_(ss, BRANCHES_SHEET, ['Branch Code','Branch Name','Short Name','Active','Sort Order','Address','Phone','Timezone','Created At','Updated At','Admin Note']);
  const deptSh = ensureSheetV7_(ss, DEPARTMENTS_SHEET, ['Department Code','Department Name','Short Name','Active','Sort Order','Created At','Updated At','Admin Note','Color Tag']);
  const shiftSh = ensureSheetV7_(ss, SHIFTS_SHEET, ['Shift Code','Shift Name','Start Time','End Time','Cross Midnight','Standard Hours','Night Allowance','Min Staffing','Late Grace Minutes','Late Deduction','Active','Sort Order','Color Tag','Admin Note']);
  ensureSheetV7_(ss, MANAGER_SCOPES_SHEET, ['Scope ID','Employee ID','Branch Code','Department Code','Can Approve Leave','Can Manage Schedule','Can View Attendance','Active','Created At','Updated At','Admin Note']);
  ensureSheetV7_(ss, WORK_SCHEDULES_SHEET, ['Schedule ID','Version ID','Week Start','Date','Employee ID','Employee Name','Branch Code','Department Code','Shift Code','Work Status','Start Time','End Time','Source','Note','Created At','Updated At','Updated By']);
  ensureSheetV7_(ss, SCHEDULE_VERSIONS_SHEET, ['Version ID','Week Start','Branch Code','Department Code','Version No','Status','Published At','Published By','Created At','Updated At','Note']);
  ensureSheetV7_(ss, SCHEDULE_ACK_SHEET, ['Acknowledgement ID','Version ID','Employee ID','Acknowledged At','Device','Note']);
  ensureSheetV7_(ss, LEAVE_QUOTA_RULES_SHEET, ['Rule ID','Branch Code','Department Code','Shift Code','Max Off','Min Staffing','Min Lead Days','Blackout','Effective Start','Effective End','Active','Priority','Admin Note','Updated At']);
  ensureSheetV7_(ss, LEAVE_BALANCES_SHEET, ['Balance ID','Employee ID','Leave Type','Year','Entitled Days','Used Days','Reserved Days','Remaining Days','Updated At','Admin Note']);
  ensureSheetV7_(ss, ATTENDANCE_CORRECTIONS_SHEET, ['Correction ID','Employee ID','Date','Correction Type','Requested In','Requested Out','Reason','Status','Submitted At','Reviewed At','Reviewed By','Manager Note','Original JSON','Applied Transaction IDs','Branch Code','Department Code']);
  ensureSheetV7_(ss, SHIFT_DAILY_CHECKS_SHEET, ['Check ID','Check Type','Date','Branch Code','Department Code','Shift Code','Schedule Version ID','Expected Count','Leave Count','Required Count','Present Count','Late Count','Missing Count','Unplanned Count','Minimum Staffing','Status','Detail JSON','Created At','Resolved At','Resolved By','Resolution Note']);
  ensureSheetV7_(ss, SHIFT_SWAP_REQUESTS_SHEET, ['Swap ID','Requester ID','Target Employee ID','Date','Requester Shift','Target Shift','Status','Reason','Submitted At','Peer Responded At','Manager Reviewed At','Manager Reviewed By','Manager Note','Branch Code','Department Code']);
  ensureSheetV7_(ss, STANDBY_ASSIGNMENTS_SHEET, ['Standby ID','Date','Employee ID','Branch Code','Department Code','Shift Code','Status','Note','Created At','Created By','Updated At']);
  ensureSheetV7_(ss, PAYROLL_SNAPSHOTS_SHEET, ['Snapshot ID','Period Key','Employee ID','Start Date','End Date','Pay Date','Status','Gross','Deductions','Net','Detail JSON','Created At','Created By','Finalized At','Paid At','Paid Reference','Employee Response','Employee Response At','Updated At']);
  ensureSheetV7_(ss, PAYROLL_DISPUTES_SHEET, ['Dispute ID','Snapshot ID','Period Key','Employee ID','Category','Message','Status','Submitted At','Reviewed At','Reviewed By','Resolution Note']);
  ensureSheetV7_(ss, EMPLOYEE_CHANGE_REQUESTS_SHEET, ['Request ID','Employee ID','Field Name','Old Value','New Value','Reason','Status','Submitted At','Reviewed At','Reviewed By','Admin Note','Attachment File ID']);
  ensureSheetV7_(ss, NOTIFICATIONS_SHEET, ['Notification ID','Recipient Type','Recipient ID','Title','Message','Severity','Reference Type','Reference ID','Status','Created At','Read At','Channel Status']);
  ensureSheetV7_(ss, NOTIFICATION_CHANNELS_SHEET, ['Channel ID','Employee ID','Channel Type','Channel Address','Active','Created At','Updated At','Admin Note']);
  ensureSheetV7_(ss, AUDIT_LOG_SHEET, ['Audit ID','Timestamp','Actor Type','Actor ID','Action','Entity Type','Entity ID','Before JSON','After JSON','Reason','Request ID']);
  ensureSheetV7_(ss, BACKUP_LOG_SHEET, ['Backup ID','Created At','File ID','File URL','Status','Created By','Note']);
  const deviceSh = ensureSheetV7_(ss, DEVICES_SHEET, ['Device ID','Branch Code','Label','Active','Registered At','Updated At','Admin Note']);

  // Extend existing employee / registration / leave / attendance / document schemas.
  const empSh = ss.getSheetByName(EMPLOYEE_SHEET);
  if (empSh) {
    if (empSh.getMaxColumns() < 33) empSh.insertColumnsAfter(empSh.getMaxColumns(), 33 - empSh.getMaxColumns());
    empSh.getRange(1,32).setValue('Department');
    empSh.getRange(1,33).setValue('Access Role');
  }
  const regSh = ss.getSheetByName(REGISTRATION_SHEET);
  if (regSh) {
    if (regSh.getMaxColumns() < 30) regSh.insertColumnsAfter(regSh.getMaxColumns(), 30 - regSh.getMaxColumns());
    regSh.getRange(1,30).setValue('Department');
  }
  const leaveSh = ss.getSheetByName(LEAVE_SHEET);
  if (leaveSh) {
    const extra = ['Branch Code','Department Code','Shift Code','Quota Status','Schedule Conflict','Override','Override Reason','Requested By Role','Cancelled At','Cancelled By','Updated At','Source'];
    if (leaveSh.getMaxColumns() < 14 + extra.length) leaveSh.insertColumnsAfter(leaveSh.getMaxColumns(), 14 + extra.length - leaveSh.getMaxColumns());
    leaveSh.getRange(1,15,1,extra.length).setValues([extra]);
  }
  const attSh = ss.getSheetByName(ATTENDANCE_SHEET);
  if (attSh) {
    if (attSh.getMaxColumns() < 19) attSh.insertColumnsAfter(attSh.getMaxColumns(), 19 - attSh.getMaxColumns());
    attSh.getRange(1,17,1,3).setValues([['Actual Branch','Department','Source']]);
  }
  const docSh = ss.getSheetByName(EMPLOYEE_DOCUMENTS_SHEET);
  if (docSh) {
    if (docSh.getMaxColumns() < 16) docSh.insertColumnsAfter(docSh.getMaxColumns(), 16 - docSh.getMaxColumns());
    docSh.getRange(1,13,1,4).setValues([['Expiry Date','Required','Verified At','Verified By']]);
  }

  // Seed master data only when the table is empty.
  if (branchSh.getLastRow() < 2) {
    branchSh.appendRow(['KORAT','นครราชสีมา','โคราช',true,1,'','','Asia/Bangkok',new Date(),new Date(),'']);
    branchSh.appendRow(['UDOMSUK','อุดมสุข','อุดมสุข',true,2,'','','Asia/Bangkok',new Date(),new Date(),'']);
  }
  if (deptSh.getLastRow() < 2) {
    deptSh.appendRow(['KITCHEN','ผลิต / ครัว','ครัว',true,1,new Date(),new Date(),'','#2E7D32']);
    deptSh.appendRow(['OFFICE','สำนักงาน','สำนักงาน',true,2,new Date(),new Date(),'','#1565C0']);
  }
  if (shiftSh.getLastRow() < 2) {
    shiftSh.appendRow(['DAY','กะกลางวัน','08:00','20:00',false,12,0,0,5,100,true,1,'#43A047','']);
    shiftSh.appendRow(['NIGHT','กะกลางคืน','20:00','08:00',true,12,65,0,5,100,true,2,'#5E35B1','']);
  }

  syncDevicesFromPropertiesV7_(deviceSh);
  ensureSettingV7_('SHIFT_CHECK_TARGET_MINUTES','25','สร้างรายงานหลังกะเริ่ม เพื่อให้ส่งได้ภายใน 30 นาที');
  ensureSettingV7_('END_SHIFT_CHECK_DELAY_MINUTES','30','สร้างสรุปหลังจบกะ');
  ensureSettingV7_('BACKUP_RETENTION_DAYS','30','จำนวนวันที่เก็บไฟล์สำรอง');
  ensureSettingV7_('DOCUMENT_EXPIRY_WARNING_DAYS','30','แจ้งเตือนเอกสารใกล้หมดอายุ');
  return {ok:true,version:'7.0',message:'Workforce schema ready'};
}

function ensureSettingV7_(key, value, description) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) sh = ss.insertSheet(SETTINGS_SHEET);
  if (sh.getLastRow() < 1) sh.getRange(1,1,1,3).setValues([['Setting','Value','Description']]);
  const last = sh.getLastRow();
  if (last >= 2) {
    const vals = sh.getRange(2,1,last-1,1).getValues();
    for (let i=0;i<vals.length;i++) if (String(vals[i][0]) === String(key)) return;
  }
  sh.appendRow([key,String(value),String(description||'')]);
}

function syncDevicesFromPropertiesV7_(sh) {
  const devices = getRegisteredDevices_();
  const last = sh.getLastRow();
  const existing = {};
  if (last >= 2) sh.getRange(2,1,last-1,1).getValues().forEach((r,i)=>{ if (String(r[0]||'')) existing[String(r[0])] = i+2; });
  devices.forEach(d => {
    if (!d || !d.deviceId || existing[d.deviceId]) return;
    sh.appendRow([d.deviceId,'',d.deviceId,true,d.registeredAt ? new Date(d.registeredAt) : new Date(),new Date(),'']);
  });
}

function cacheJsonV7_(key, ttlSeconds, producer) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(String(key));
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  const value = producer();
  try { cache.put(String(key), JSON.stringify(value), Math.max(1, Number(ttlSeconds)||30)); } catch (e) {}
  return value;
}
function cacheRemoveV7_(keys) {
  const cache = CacheService.getScriptCache();
  (Array.isArray(keys)?keys:[keys]).filter(Boolean).forEach(k=>{ try { cache.remove(String(k)); } catch(e) {} });
}
function masterCacheKeysV7_(){return ['V7_BRANCHES_0','V7_BRANCHES_1','V7_DEPTS_0','V7_DEPTS_1','V7_SHIFTS_0','V7_SHIFTS_1'];}

function activeMasterRowsV7_(sheetName, columns) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) return [];
  return sh.getRange(2,1,last-1,columns).getValues();
}

function getBranchesV7_(includeInactive) {
  const key='V7_BRANCHES_'+(includeInactive?'1':'0');
  return cacheJsonV7_(key,180,()=>activeMasterRowsV7_(BRANCHES_SHEET,11).filter(r=>includeInactive || r[3] !== false).map(r=>({code:String(r[0]||''),name:String(r[1]||''),shortName:String(r[2]||''),active:r[3]!==false,sort:Number(r[4])||999,address:String(r[5]||''),phone:String(r[6]||''),timezone:String(r[7]||TZ),note:String(r[10]||'')})).filter(x=>x.code).sort((a,b)=>a.sort-b.sort||a.name.localeCompare(b.name,'th')));
}
function getDepartmentsV7_(includeInactive) {
  const key='V7_DEPTS_'+(includeInactive?'1':'0');
  return cacheJsonV7_(key,180,()=>activeMasterRowsV7_(DEPARTMENTS_SHEET,9).filter(r=>includeInactive || r[3] !== false).map(r=>({code:String(r[0]||''),name:String(r[1]||''),shortName:String(r[2]||''),active:r[3]!==false,sort:Number(r[4])||999,note:String(r[7]||''),color:String(r[8]||'')})).filter(x=>x.code).sort((a,b)=>a.sort-b.sort||a.name.localeCompare(b.name,'th')));
}
function getShiftsV7_(includeInactive) {
  const key='V7_SHIFTS_'+(includeInactive?'1':'0');
  return cacheJsonV7_(key,180,()=>activeMasterRowsV7_(SHIFTS_SHEET,14).filter(r=>includeInactive || r[10] !== false).map(r=>({code:String(r[0]||''),name:String(r[1]||''),startTime:String(r[2]||''),endTime:String(r[3]||''),crossMidnight:Boolean(r[4]),standardHours:Number(r[5])||12,nightAllowance:Number(r[6])||0,minStaffing:Number(r[7])||0,lateGraceMinutes:Number(r[8])||5,lateDeduction:Number(r[9])||0,active:r[10]!==false,sort:Number(r[11])||999,color:String(r[12]||''),note:String(r[13]||'')})).filter(x=>x.code).sort((a,b)=>a.sort-b.sort||a.name.localeCompare(b.name,'th')));
}
function getShiftV7_(code) { return getShiftsV7_(true).find(x=>x.code===String(code||'')) || null; }
function validateBranchV7_(code, allowBlank) { const c=String(code||'').trim(); if (!c && allowBlank) return ''; const x=getBranchesV7_(false).find(b=>b.code===c); if(!x)throw new Error('สาขาไม่ถูกต้อง'); return c; }
function validateDepartmentV7_(code, allowBlank) { const c=String(code||'').trim(); if (!c && allowBlank) return ''; const x=getDepartmentsV7_(false).find(b=>b.code===c); if(!x)throw new Error('แผนกไม่ถูกต้อง'); return c; }
function validateShiftV7_(code, allowBlank) { const c=String(code||'').trim(); if (!c && allowBlank) return ''; const x=getShiftsV7_(false).find(b=>b.code===c); if(!x)throw new Error('กะไม่ถูกต้อง'); return c; }

function orgBootstrapV7_() {
  return {branches:getBranchesV7_(false),departments:getDepartmentsV7_(false),shifts:getShiftsV7_(false),serverEpochMs:Date.now()};
}

function employeeRecordV7_(employeeId) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);
  const last = sh ? sh.getLastRow() : 0;
  if (!sh || last < 2) return null;
  const rows = sh.getRange(2,1,last-1,Math.max(33,sh.getLastColumn())).getValues();
  for (let i=0;i<rows.length;i++) {
    const r=rows[i]; if (String(r[0]||'') !== String(employeeId||'')) continue;
    const explicitRole=String(r[32]||'').toUpperCase();
    const role=explicitRole || (String(r[13]||'').toUpperCase()==='MANAGER' ? 'MANAGER' : 'EMPLOYEE');
    return {row:i+2,id:String(r[0]),name:String(r[1]||''),active:r[2]!==false,sort:Number(r[3])||999,pinHash:String(r[6]||''),nickname:String(r[7]||''),phone:String(r[8]||''),startDate:r[9]||'',branch:String(r[10]||''),firstName:String(r[11]||''),lastName:String(r[12]||''),position:String(r[13]||''),wageType:String(r[14]||''),wageAmount:Number(r[15])||0,birthDate:r[16]||'',resignationDate:r[17]||'',registeredAddress:String(r[18]||''),currentAddress:String(r[19]||''),emergencyName:String(r[20]||''),emergencyPhone:String(r[21]||''),emergencyRelationship:String(r[22]||''),photoUrl:String(r[23]||''),employmentStatus:String(r[24]||''),adminNote:String(r[25]||''),dailyWage:Number(r[26])||0,bankName:String(r[27]||''),bankAccountNo:String(r[28]||''),bankAccountName:String(r[29]||''),bankCode:String(r[30]||''),department:String(r[31]||''),accessRole:role};
  }
  return null;
}

function isManagerRoleV7_(role){return ['SUPERVISOR','MANAGER','ADMIN'].indexOf(String(role||'').toUpperCase())>=0}
function portalLoginV7_(payload) {
  const employeeId=String(payload.employeeId||'').trim(),pin=String(payload.employeePin||'');
  const check=validateEmployeePin(employeeId,pin); if(!check.ok)throw new Error(check.message||'เข้าสู่ระบบไม่สำเร็จ');
  const emp=employeeRecordV7_(employeeId); if(!emp||!emp.active||String(emp.employmentStatus||'ACTIVE').toUpperCase()==='RESIGNED')throw new Error('บัญชีพนักงานถูกปิดใช้งาน');
  const token=Utilities.getUuid();
  CacheService.getScriptCache().put(PORTAL_TOKEN_PREFIX_+token,JSON.stringify({employeeId:emp.id}),PORTAL_TOKEN_TTL_SECONDS_);
  auditLogV7_('EMPLOYEE',emp.id,'PORTAL_LOGIN','EMPLOYEE',emp.id,'','', '', String(payload.requestId||''));
  return {ok:true,token:token,expiresIn:PORTAL_TOKEN_TTL_SECONDS_,employee:portalEmployeeSafeV7_(emp),scopes:isManagerRoleV7_(emp.accessRole)?managerScopesForEmployeeV7_(emp.id):[],serverEpochMs:Date.now()};
}
function portalLogoutV7_(payload) { const t=String(payload.portalToken||''); if(t)CacheService.getScriptCache().remove(PORTAL_TOKEN_PREFIX_+t); return {ok:true}; }
function requirePortalV7_(token, roles) {
  const t=String(token||'').trim(); if(!t)throw new Error('กรุณาเข้าสู่ระบบพนักงาน');
  const raw=CacheService.getScriptCache().get(PORTAL_TOKEN_PREFIX_+t); if(!raw)throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  let data={}; try{data=JSON.parse(raw)}catch(e){}
  const emp=employeeRecordV7_(data.employeeId); if(!emp||!emp.active||String(emp.employmentStatus||'ACTIVE').toUpperCase()==='RESIGNED')throw new Error('บัญชีพนักงานถูกปิดใช้งาน');
  const allowed=roles&&roles.length?roles:null; if(allowed&&allowed.indexOf(emp.accessRole)<0)throw new Error('ไม่มีสิทธิ์ใช้งานเมนูนี้');
  CacheService.getScriptCache().put(PORTAL_TOKEN_PREFIX_+t,JSON.stringify({employeeId:emp.id}),PORTAL_TOKEN_TTL_SECONDS_);
  return emp;
}
function portalEmployeeSafeV7_(e) { return {id:e.id,name:e.name,nickname:e.nickname,phone:e.phone,branch:e.branch,department:e.department,position:e.position,accessRole:e.accessRole,startDate:formatDateInputForClient_(e.startDate),employmentStatus:e.employmentStatus,bankName:e.bankName,bankAccountMasked:maskBankAccountV7_(e.bankAccountNo),bankAccountName:e.bankAccountName}; }
function maskBankAccountV7_(v){const s=String(v||'').replace(/\D/g,'');if(s.length<=4)return s?('••••'+s):'';return '••••••'+s.slice(-4)}
function portalBootstrapV7_(payload){const e=requirePortalV7_(payload.portalToken);return {employee:portalEmployeeSafeV7_(e),branches:getBranchesV7_(false),departments:getDepartmentsV7_(false),shifts:getShiftsV7_(false),scopes:isManagerRoleV7_(e.accessRole)?managerScopesForEmployeeV7_(e.id):[],notifications:unreadNotificationCountV7_(e.id),serverEpochMs:Date.now()}}
function portalGetProfileV7_(payload){const e=requirePortalV7_(payload.portalToken);return {employee:Object.assign(portalEmployeeSafeV7_(e),{birthDate:formatDateInputForClient_(e.birthDate),registeredAddress:e.registeredAddress,currentAddress:e.currentAddress,emergencyName:e.emergencyName,emergencyPhone:e.emergencyPhone,emergencyRelationship:e.emergencyRelationship}),documents:employeeDocumentsMetaV7_(e.id),serverEpochMs:Date.now()}}

function managerScopesForEmployeeV7_(employeeId) {
  const id=String(employeeId||'');
  return cacheJsonV7_('V7_SCOPES_'+id,60,()=>{
    const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MANAGER_SCOPES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];
    const vals=sh.getRange(2,1,last-1,11).getValues(),seen={},out=[];
    for(let i=vals.length-1;i>=0;i--){
      const r=vals[i];if(String(r[1])!==id||r[7]===false)continue;
      const key=String(r[2]||'*')+'|'+String(r[3]||'*');if(seen[key])continue;seen[key]=1;
      out.unshift({scopeId:String(r[0]),employeeId:String(r[1]),branchCode:String(r[2]),departmentCode:String(r[3]),canApproveLeave:r[4]!==false,canManageSchedule:r[5]!==false,canViewAttendance:r[6]!==false,active:r[7]!==false,note:String(r[10]||'')});
    }
    return out;
  });
}
function requireManagerScopeV7_(portalToken, branchCode, departmentCode, permission) {
  const emp=requirePortalV7_(portalToken,['SUPERVISOR','MANAGER','ADMIN']);
  const scopes=managerScopesForEmployeeV7_(emp.id);
  const hit=scopes.find(s=>(s.branchCode==='*'||s.branchCode===String(branchCode||''))&&(s.departmentCode==='*'||s.departmentCode===String(departmentCode||''))&&(!permission||s[permission]!==false));
  if(!hit)throw new Error('ไม่มีสิทธิ์ดูแลสาขา/แผนกนี้');
  return {employee:emp,scope:hit};
}

function auditLogV7_(actorType,actorId,action,entityType,entityId,beforeObj,afterObj,reason,requestId){
  try{const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(AUDIT_LOG_SHEET)||ensureSheetV7_(ss,AUDIT_LOG_SHEET,['Audit ID','Timestamp','Actor Type','Actor ID','Action','Entity Type','Entity ID','Before JSON','After JSON','Reason','Request ID']);
  sh.appendRow(['AUD-'+Utilities.getUuid().slice(0,10).toUpperCase(),new Date(),String(actorType||''),String(actorId||''),String(action||''),String(entityType||''),String(entityId||''),jsonCellV7_(beforeObj),jsonCellV7_(afterObj),String(reason||'').slice(0,1000),String(requestId||'')]);}catch(e){}
}
function jsonCellV7_(v){if(v===null||v===undefined||v==='')return'';let s='';try{s=typeof v==='string'?v:JSON.stringify(v)}catch(e){s=String(v)}return s.length>45000?s.slice(0,45000):s}

function addNotificationV7_(recipientType,recipientId,title,message,severity,referenceType,referenceId){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(NOTIFICATIONS_SHEET)||ensureSheetV7_(ss,NOTIFICATIONS_SHEET,['Notification ID','Recipient Type','Recipient ID','Title','Message','Severity','Reference Type','Reference ID','Status','Created At','Read At','Channel Status']);
  const id='NOT-'+Utilities.getUuid().slice(0,10).toUpperCase();
  sh.appendRow([id,String(recipientType||''),String(recipientId||''),String(title||''),String(message||''),String(severity||'INFO'),String(referenceType||''),String(referenceId||''),'UNREAD',new Date(),'','PENDING']);
  if(String(recipientType)==='EMPLOYEE')pushLineMessageIfConfiguredV7_(String(recipientId),String(title||'')+'\n'+String(message||''));
  return id;
}
function notifyManagersForScopeV7_(branchCode,departmentCode,title,message,severity,referenceType,referenceId){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MANAGER_SCOPES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return;
  const seen={};sh.getRange(2,1,last-1,11).getValues().forEach(r=>{if(r[7]===false)return;const b=String(r[2]||''),d=String(r[3]||'');if((b==='*'||b===branchCode)&&(d==='*'||d===departmentCode)){const id=String(r[1]||'');if(id&&!seen[id]){seen[id]=1;addNotificationV7_('EMPLOYEE',id,title,message,severity,referenceType,referenceId)}}});
  addNotificationV7_('ROLE','ADMIN',title,message,severity,referenceType,referenceId);
}
function unreadNotificationCountV7_(employeeId){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NOTIFICATIONS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return 0;return sh.getRange(2,1,last-1,12).getValues().filter(r=>String(r[1])==='EMPLOYEE'&&String(r[2])===String(employeeId)&&String(r[8])==='UNREAD').length}
function pushLineMessageIfConfiguredV7_(employeeId,message){
  const token=String(PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN')||'');if(!token)return false;
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NOTIFICATION_CHANNELS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return false;
  const row=sh.getRange(2,1,last-1,8).getValues().find(r=>String(r[1])===String(employeeId)&&String(r[2])==='LINE_USER_ID'&&r[4]!==false);if(!row)return false;
  try{const resp=UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({to:String(row[3]),messages:[{type:'text',text:String(message||'').slice(0,4500)}]}),muteHttpExceptions:true});return resp.getResponseCode()>=200&&resp.getResponseCode()<300}catch(e){return false}
}
function portalGetNotificationsV7_(payload){const e=requirePortalV7_(payload.portalToken);const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NOTIFICATIONS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(Math.max(2,last-199),1,last-Math.max(2,last-199)+1,12).getValues().reverse().filter(r=>(String(r[1])==='EMPLOYEE'&&String(r[2])===e.id)||(String(r[1])==='ROLE'&&String(r[2])==='ALL_EMPLOYEES')).map(r=>({notificationId:String(r[0]),title:String(r[3]),message:String(r[4]),severity:String(r[5]),referenceType:String(r[6]),referenceId:String(r[7]),status:String(r[8]),createdAt:formatDateTimeForClient_(r[9]),readAt:formatDateTimeForClient_(r[10])}));return{rows:rows,serverEpochMs:Date.now()}}
function portalMarkNotificationReadV7_(payload){const e=requirePortalV7_(payload.portalToken),id=String(payload.notificationId||'');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NOTIFICATIONS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)throw new Error('ไม่พบการแจ้งเตือน');const vals=sh.getRange(2,1,last-1,3).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===id&&String(vals[i][1])==='EMPLOYEE'&&String(vals[i][2])===e.id){sh.getRange(i+2,9).setValue('READ');sh.getRange(i+2,11).setValue(new Date());return{ok:true}}throw new Error('ไม่พบการแจ้งเตือน')}

function portalGetAttendanceV7_(payload){const e=requirePortalV7_(payload.portalToken);const start=String(payload.startDate||''),end=String(payload.endDate||'');return employeeAttendanceRangeNoAdminV7_(e.id,start,end)}
function employeeAttendanceRangeNoAdminV7_(employeeId,startDate,endDate){
  const start=parseIsoDate_(startDate),end=parseIsoDate_(endDate);if(!start||!end||end<start)throw new Error('ช่วงวันที่ไม่ถูกต้อง');if(Math.floor((end-start)/86400000)+1>62)throw new Error('ดูย้อนหลังได้สูงสุด 62 วันต่อครั้ง');
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),startKey=Utilities.formatDate(start,TZ,'yyyy-MM-dd'),endKey=Utilities.formatDate(end,TZ,'yyyy-MM-dd'),events=attendanceEventsForPayroll_(ss,employeeId,startKey,endKey);
  return {employeeId:employeeId,startDate:startKey,endDate:endKey,rows:events.map(e=>({transactionId:e.transactionId,date:Utilities.formatDate(e.timestamp,TZ,'yyyy-MM-dd'),time:Utilities.formatDate(e.timestamp,TZ,'HH:mm:ss'),action:e.action,status:e.status,note:e.note,deviceId:e.deviceId})),serverEpochMs:Date.now()};
}

function weekStartKeyV7_(value){const d=parseIsoDate_(value);if(!d)throw new Error('วันที่สัปดาห์ไม่ถูกต้อง');const x=new Date(d);const day=x.getDay();const diff=day===0?-6:1-day;x.setDate(x.getDate()+diff);return Utilities.formatDate(x,TZ,'yyyy-MM-dd')}
function scheduleVersionRowsV7_(){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SCHEDULE_VERSIONS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];return sh.getRange(2,1,last-1,11).getValues().map((r,i)=>({row:i+2,versionId:String(r[0]),weekStart:attendanceDateKey_(r[1])||String(r[1]||''),branchCode:String(r[2]||''),departmentCode:String(r[3]||''),versionNo:Number(r[4])||0,status:String(r[5]||''),publishedAt:r[6],publishedBy:String(r[7]||''),createdAt:r[8],updatedAt:r[9],note:String(r[10]||'')}))}
function latestScheduleVersionV7_(weekStart,branchCode,departmentCode,statuses){const rows=scheduleVersionRowsV7_().filter(x=>x.weekStart===weekStart&&x.branchCode===branchCode&&x.departmentCode===departmentCode&&(!statuses||statuses.indexOf(x.status)>=0));rows.sort((a,b)=>b.versionNo-a.versionNo);return rows[0]||null}
function scheduleItemsForVersionV7_(versionId){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(WORK_SCHEDULES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];return sh.getRange(2,1,last-1,17).getValues().map((r,i)=>({row:i+2,scheduleId:String(r[0]),versionId:String(r[1]),weekStart:attendanceDateKey_(r[2])||String(r[2]||''),date:attendanceDateKey_(r[3])||String(r[3]||''),employeeId:String(r[4]),employeeName:String(r[5]||''),branchCode:String(r[6]||''),departmentCode:String(r[7]||''),shiftCode:String(r[8]||''),workStatus:String(r[9]||''),startTime:String(r[10]||''),endTime:String(r[11]||''),source:String(r[12]||''),note:String(r[13]||''),createdAt:r[14],updatedAt:r[15],updatedBy:String(r[16]||'')})).filter(x=>x.versionId===String(versionId||''))}
function latestPublishedScheduleItemV7_(employeeId,dateKey){const week=weekStartKeyV7_(dateKey),versions=scheduleVersionRowsV7_().filter(v=>v.weekStart===week&&v.status==='PUBLISHED').sort((a,b)=>b.versionNo-a.versionNo);for(let i=0;i<versions.length;i++){const items=scheduleItemsForVersionV7_(versions[i].versionId);const hit=items.find(x=>x.employeeId===String(employeeId)&&x.date===dateKey);if(hit)return Object.assign({scheduleVersion:versions[i]},hit)}return null}
function latestPlanningScheduleItemsV7_(branchCode,departmentCode,dateKey,shiftCode){const week=weekStartKeyV7_(dateKey),v=latestScheduleVersionV7_(week,branchCode,departmentCode,['DRAFT'])||latestScheduleVersionV7_(week,branchCode,departmentCode,['PUBLISHED']);if(!v)return[];return scheduleItemsForVersionV7_(v.versionId).filter(x=>x.date===dateKey&&(!shiftCode||x.shiftCode===shiftCode))}
function shiftWindowV7_(dateKey,shiftCode){const s=getShiftV7_(shiftCode);if(!s)throw new Error('ไม่พบข้อมูลกะ '+shiftCode);const a=String(s.startTime||'08:00').split(':').map(Number),b=String(s.endTime||'20:00').split(':').map(Number);const start=dateAtTime_(dateKey,a[0]||0,a[1]||0,0),end=dateAtTime_(dateKey,b[0]||0,b[1]||0,s.crossMidnight?1:0);return {shift:s,start:start,end:end}}

function getOrCreateDraftVersionV7_(weekStart,branchCode,departmentCode,actorId){
  let draft=latestScheduleVersionV7_(weekStart,branchCode,departmentCode,['DRAFT']);if(draft)return draft;
  const published=latestScheduleVersionV7_(weekStart,branchCode,departmentCode,['PUBLISHED']);
  const versionNo=(published?published.versionNo:0)+1,id='SCHV-'+Utilities.getUuid().slice(0,10).toUpperCase(),ss=SpreadsheetApp.openById(SPREADSHEET_ID),vsh=ss.getSheetByName(SCHEDULE_VERSIONS_SHEET),now=new Date();
  vsh.appendRow([id,parseIsoDate_(weekStart),branchCode,departmentCode,versionNo,'DRAFT','','',now,now,published?'สร้างจาก Version '+published.versionNo:'']);
  if(published){const items=scheduleItemsForVersionV7_(published.versionId),sh=ss.getSheetByName(WORK_SCHEDULES_SHEET);items.forEach(x=>sh.appendRow(['SCH-'+Utilities.getUuid().slice(0,10).toUpperCase(),id,parseIsoDate_(weekStart),parseIsoDate_(x.date),x.employeeId,x.employeeName,x.branchCode,x.departmentCode,x.shiftCode,x.workStatus,x.startTime,x.endTime,'COPIED',x.note,now,now,actorId]));}
  return latestScheduleVersionV7_(weekStart,branchCode,departmentCode,['DRAFT']);
}
function scheduleLeaveLockV7_(employeeId,dateKey){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return null;
  const vals=sh.getRange(2,1,last-1,Math.min(26,sh.getLastColumn())).getValues();
  for(let i=0;i<vals.length;i++){const r=vals[i],status=String(r[2]||''),type=String(r[6]||''),s=attendanceDateKey_(r[7]),e=attendanceDateKey_(r[8]);if(String(r[3])!==String(employeeId)||!s||!e||dateKey<s||dateKey>e)continue;if(status==='APPROVED'||(status==='PENDING'&&isQuotaOffTypeV7_(type)))return {leaveId:String(r[0]),status:status,leaveType:type};}
  return null;
}
function upsertScheduleItemV7_(version,item,actorId){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(WORK_SCHEDULES_SHEET),emp=employeeRecordV7_(item.employeeId);if(!emp)throw new Error('ไม่พบพนักงาน '+item.employeeId);
  const dateKey=Utilities.formatDate(parseIsoDate_(item.date),TZ,'yyyy-MM-dd');if(dateKey<version.weekStart){throw new Error('วันที่อยู่นอกสัปดาห์')};const weekEnd=new Date(parseIsoDate_(version.weekStart));weekEnd.setDate(weekEnd.getDate()+6);if(parseIsoDate_(dateKey)>weekEnd)throw new Error('วันที่อยู่นอกสัปดาห์');
  const status=String(item.workStatus||'WORK').toUpperCase(),shiftCode=status==='WORK'?validateShiftV7_(item.shiftCode,false):String(item.shiftCode||'');
  if(status==='WORK'){const lock=scheduleLeaveLockV7_(emp.id,dateKey);if(lock)throw new Error(emp.name+' วันที่ '+dateKey+' มีคำขอหยุด/ลาที่ล็อกตารางแล้ว ('+lock.status+')');}
  const win=status==='WORK'?shiftWindowV7_(dateKey,shiftCode):null,now=new Date(),items=scheduleItemsForVersionV7_(version.versionId),old=items.find(x=>x.employeeId===emp.id&&x.date===dateKey);
  const rowValues=[old?old.scheduleId:'SCH-'+Utilities.getUuid().slice(0,10).toUpperCase(),version.versionId,parseIsoDate_(version.weekStart),parseIsoDate_(dateKey),emp.id,emp.name,version.branchCode,version.departmentCode,shiftCode,status,win?win.shift.startTime:'',win?win.shift.endTime:'',String(item.source||'MANAGER'),String(item.note||''),old?old.createdAt||now:now,now,actorId];
  if(old)sh.getRange(old.row,1,1,17).setValues([rowValues]);else sh.appendRow(rowValues);
  return rowValues[0];
}
function managerSaveScheduleV7_(payload){const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false),auth=requireManagerScopeV7_(payload.portalToken,branch,dept,'canManageSchedule'),week=weekStartKeyV7_(payload.weekStart),items=Array.isArray(payload.items)?payload.items:[];if(!items.length)throw new Error('ไม่มีรายการตารางงาน');const v=getOrCreateDraftVersionV7_(week,branch,dept,auth.employee.id);const ids=[];items.forEach(x=>ids.push(upsertScheduleItemV7_(v,x,auth.employee.id)));auditLogV7_('MANAGER',auth.employee.id,'SAVE_SCHEDULE','SCHEDULE_VERSION',v.versionId,'',{count:ids.length},'',String(payload.requestId||''));return{ok:true,version:v,scheduleIds:ids,serverEpochMs:Date.now()}}
function managerGetScheduleV7_(payload){const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false),auth=requireManagerScopeV7_(payload.portalToken,branch,dept,'canManageSchedule'),week=weekStartKeyV7_(payload.weekStart),draft=latestScheduleVersionV7_(week,branch,dept,['DRAFT']),published=latestScheduleVersionV7_(week,branch,dept,['PUBLISHED']),v=draft||published;return{version:v,items:v?scheduleItemsForVersionV7_(v.versionId):[],publishedVersion:published,serverEpochMs:Date.now()}}
function managerPublishScheduleV7_(payload){const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false),auth=requireManagerScopeV7_(payload.portalToken,branch,dept,'canManageSchedule');return publishScheduleVersionV7_(String(payload.versionId||''),'MANAGER',auth.employee.id,Boolean(payload.allowOverride),String(payload.overrideReason||''),String(payload.requestId||''))}
function adminPublishScheduleV7_(payload){requireAdmin_(String(payload.adminToken||''));return publishScheduleVersionV7_(String(payload.versionId||''),'ADMIN','ADMIN',Boolean(payload.override),String(payload.overrideReason||''),String(payload.requestId||''))}
function adminGetScheduleV7_(payload){requireAdmin_(String(payload.adminToken||''));const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false),week=weekStartKeyV7_(payload.weekStart),draft=latestScheduleVersionV7_(week,branch,dept,['DRAFT']),published=latestScheduleVersionV7_(week,branch,dept,['PUBLISHED']),v=draft||published;return{version:v,items:v?scheduleItemsForVersionV7_(v.versionId):[],publishedVersion:published,serverEpochMs:Date.now()}}
function adminSaveScheduleV7_(payload){requireAdmin_(String(payload.adminToken||''));const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false),week=weekStartKeyV7_(payload.weekStart),items=Array.isArray(payload.items)?payload.items:[];if(!items.length)throw new Error('ไม่มีรายการตารางงาน');const v=getOrCreateDraftVersionV7_(week,branch,dept,'ADMIN'),ids=[];items.forEach(x=>ids.push(upsertScheduleItemV7_(v,x,'ADMIN')));auditLogV7_('ADMIN','ADMIN','SAVE_SCHEDULE','SCHEDULE_VERSION',v.versionId,'',{count:ids.length},'',String(payload.requestId||''));return{ok:true,version:v,scheduleIds:ids,serverEpochMs:Date.now()}}
function adminScheduleBundleV7_(payload){requireAdmin_(String(payload.adminToken||''));const branches=getBranchesV7_(false),departments=getDepartmentsV7_(false),shifts=getShiftsV7_(false);let branch=String(payload.branchCode||''),dept=String(payload.departmentCode||'');if(!branch&&branches.length)branch=branches[0].code;if(!dept&&departments.length)dept=departments[0].code;const week=weekStartKeyV7_(payload.weekStart||Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd')),out={branches:branches,departments:departments,shifts:shifts,branchCode:branch,departmentCode:dept,team:[],schedule:{version:null,items:[],publishedVersion:null},leaves:[],serverEpochMs:Date.now()};if(branch&&dept){validateBranchV7_(branch,false);validateDepartmentV7_(dept,false);const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET),last=sh?sh.getLastRow():0;if(sh&&last>=2)out.team=sh.getRange(2,1,last-1,33).getValues().filter(r=>r[2]!==false&&String(r[10])===branch&&String(r[31])===dept).map(r=>({id:String(r[0]),name:String(r[1]),nickname:String(r[7]||''),position:String(r[13]||''),branch:String(r[10]),department:String(r[31]||'')}));out.schedule=adminGetScheduleV7_({adminToken:payload.adminToken,branchCode:branch,departmentCode:dept,weekStart:week});out.leaves=leaveRowsV7_({status:'ALL'}).rows.filter(x=>['PENDING','APPROVED'].indexOf(x.status)>=0&&x.branchCode===branch&&x.departmentCode===dept)}return out}

function publishScheduleVersionV7_(versionId,actorType,actorId,allowOverride,overrideReason,requestId){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),vsh=ss.getSheetByName(SCHEDULE_VERSIONS_SHEET),versions=scheduleVersionRowsV7_(),v=versions.find(x=>x.versionId===versionId);if(!v)throw new Error('ไม่พบ Version ตารางงาน');if(v.status!=='DRAFT')throw new Error('Version นี้ไม่ใช่ Draft');
  const items=scheduleItemsForVersionV7_(versionId);if(!items.length)throw new Error('ตารางงานยังไม่มีข้อมูล');const problems=[];
  items.filter(x=>x.workStatus==='WORK').forEach(x=>{const lock=scheduleLeaveLockV7_(x.employeeId,x.date);if(lock)problems.push({type:'LEAVE_LOCK',employeeId:x.employeeId,date:x.date,message:'มีวันหยุด/ลาที่ล็อกอยู่'});});
  const keys={};items.filter(x=>x.workStatus==='WORK').forEach(x=>{const k=x.date+'|'+x.shiftCode;keys[k]=(keys[k]||0)+1});
  Object.keys(keys).forEach(k=>{const p=k.split('|'),date=p[0],shift=p[1],q=matchingLeaveQuotaRuleV7_(v.branchCode,v.departmentCode,shift,date),def=getShiftV7_(shift),min=Math.max(Number(def&&def.minStaffing)||0,Number(q&&q.minStaffing)||0);if(min&&keys[k]<min)problems.push({type:'MIN_STAFFING',date:date,shiftCode:shift,count:keys[k],minimum:min,message:'กำลังคนต่ำกว่าขั้นต่ำ'});});
  if(problems.length&&!allowOverride)throw new Error('ตารางยัง Publish ไม่ได้: '+problems.map(x=>x.date+' '+(x.shiftCode||'')+' '+x.message).slice(0,5).join(' / '));
  if(problems.length&&allowOverride&&!String(overrideReason||'').trim())throw new Error('กรุณาระบุเหตุผล Override');
  const now=new Date();versions.filter(x=>x.weekStart===v.weekStart&&x.branchCode===v.branchCode&&x.departmentCode===v.departmentCode&&x.status==='PUBLISHED').forEach(x=>vsh.getRange(x.row,6).setValue('SUPERSEDED'));
  vsh.getRange(v.row,6).setValue('PUBLISHED');vsh.getRange(v.row,7).setValue(now);vsh.getRange(v.row,8).setValue(actorId);vsh.getRange(v.row,10).setValue(now);if(problems.length)vsh.getRange(v.row,11).setValue('OVERRIDE: '+overrideReason);
  const employeeIds={};items.forEach(x=>{if(x.employeeId)employeeIds[x.employeeId]=1});Object.keys(employeeIds).forEach(id=>addNotificationV7_('EMPLOYEE',id,'ตารางงานสัปดาห์ใหม่','ตารางงานสัปดาห์ '+v.weekStart+' ถูกประกาศแล้ว','INFO','SCHEDULE_VERSION',v.versionId));
  auditLogV7_(actorType,actorId,'PUBLISH_SCHEDULE','SCHEDULE_VERSION',v.versionId,'',{problems:problems},overrideReason,requestId);return{ok:true,versionId:v.versionId,problems:problems,serverEpochMs:Date.now()};
}
function portalGetScheduleV7_(payload){
  const e=requirePortalV7_(payload.portalToken),start=parseIsoDate_(payload.startDate),end=parseIsoDate_(payload.endDate);if(!start||!end||end<start)throw new Error('ช่วงวันที่ไม่ถูกต้อง');
  const startKey=Utilities.formatDate(start,TZ,'yyyy-MM-dd'),endKey=Utilities.formatDate(end,TZ,'yyyy-MM-dd');
  const versions=scheduleVersionRowsV7_().filter(v=>v.status==='PUBLISHED'),vmap={};versions.forEach(v=>vmap[v.versionId]=v);
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(WORK_SCHEDULES_SHEET),last=sh?sh.getLastRow():0,rows=[];
  const locks={};const lsh=ss.getSheetByName(LEAVE_SHEET),llast=lsh?lsh.getLastRow():0;if(lsh&&llast>=2){lsh.getRange(2,1,llast-1,Math.min(26,lsh.getLastColumn())).getValues().forEach(r=>{if(String(r[3])!==e.id||String(r[2])!=='APPROVED')return;const a=attendanceDateKey_(r[7]),b=attendanceDateKey_(r[8]);if(!a||!b||b<startKey||a>endKey)return;for(let d=parseIsoDate_(a);d<=parseIsoDate_(b);d.setDate(d.getDate()+1))locks[Utilities.formatDate(d,TZ,'yyyy-MM-dd')]={leaveId:String(r[0]),status:'APPROVED',leaveType:String(r[6])};});}
  if(sh&&last>=2){sh.getRange(2,1,last-1,17).getValues().forEach(r=>{const vid=String(r[1]),v=vmap[vid];if(!v||String(r[4])!==e.id)return;const date=attendanceDateKey_(r[3])||String(r[3]||'');if(!date||date<startKey||date>endKey)return;const lock=locks[date]||null;rows.push({row:0,scheduleId:String(r[0]),versionId:vid,weekStart:attendanceDateKey_(r[2])||String(r[2]||''),date:date,employeeId:e.id,employeeName:String(r[5]||''),branchCode:String(r[6]||''),departmentCode:String(r[7]||''),shiftCode:String(r[8]||''),workStatus:String(r[9]||''),startTime:String(r[10]||''),endTime:String(r[11]||''),source:String(r[12]||''),note:String(r[13]||''),updatedBy:String(r[16]||''),effectiveWorkStatus:lock?'LEAVE':String(r[9]||''),leave:lock,versionNo:v.versionNo,publishedAt:formatDateTimeForClient_(v.publishedAt)});});}
  rows.sort((a,b)=>a.date.localeCompare(b.date));return{rows:rows,serverEpochMs:Date.now()};
}
function portalAcknowledgeScheduleV7_(payload){const e=requirePortalV7_(payload.portalToken),versionId=String(payload.versionId||'');const v=scheduleVersionRowsV7_().find(x=>x.versionId===versionId&&x.status==='PUBLISHED');if(!v)throw new Error('ไม่พบตารางที่ประกาศแล้ว');const items=scheduleItemsForVersionV7_(versionId);if(!items.some(x=>x.employeeId===e.id))throw new Error('ตารางนี้ไม่มีข้อมูลของคุณ');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SCHEDULE_ACK_SHEET),last=sh.getLastRow();if(last>=2){const vals=sh.getRange(2,1,last-1,5).getValues();const old=vals.find(r=>String(r[1])===versionId&&String(r[2])===e.id);if(old)return{ok:true,already:true}}sh.appendRow(['ACK-'+Utilities.getUuid().slice(0,10).toUpperCase(),versionId,e.id,new Date(),String(payload.device||''),String(payload.note||'')]);return{ok:true}}

function employeeHomeScopeV7_(employeeId,dateKey){const schedule=dateKey?latestPublishedScheduleItemV7_(employeeId,dateKey):null;if(schedule)return{branchCode:schedule.branchCode,departmentCode:schedule.departmentCode,shiftCode:schedule.shiftCode};const e=employeeRecordV7_(employeeId);return{branchCode:e?e.branch:'',departmentCode:e?e.department:'',shiftCode:''}}
function matchingLeaveQuotaRuleV7_(branchCode,departmentCode,shiftCode,dateKey){
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_QUOTA_RULES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return null;
  const rows=sh.getRange(2,1,last-1,14).getValues().map((r,i)=>({row:i+2,ruleId:String(r[0]),branchCode:String(r[1]||'*'),departmentCode:String(r[2]||'*'),shiftCode:String(r[3]||'*'),maxOff:Number(r[4]),minStaffing:Number(r[5])||0,minLeadDays:Number(r[6])||0,blackout:Boolean(r[7]),effectiveStart:attendanceDateKey_(r[8]),effectiveEnd:attendanceDateKey_(r[9]),active:r[10]!==false,priority:Number(r[11])||0,note:String(r[12]||'')})).filter(x=>x.active&&(x.branchCode==='*'||x.branchCode===branchCode)&&(x.departmentCode==='*'||x.departmentCode===departmentCode)&&(x.shiftCode==='*'||x.shiftCode===shiftCode)&&(!x.effectiveStart||x.effectiveStart<=dateKey)&&(!x.effectiveEnd||x.effectiveEnd>=dateKey));
  rows.sort((a,b)=>b.priority-a.priority||specificityQuotaV7_(b)-specificityQuotaV7_(a));return rows[0]||null;
}
function specificityQuotaV7_(x){return (x.branchCode==='*'?0:1)+(x.departmentCode==='*'?0:1)+(x.shiftCode==='*'?0:1)}
function isQuotaOffTypeV7_(type){return ['REQUEST_OFF','WEEKLY_OFF'].indexOf(String(type||'').toUpperCase())>=0}
function requestOffCountV7_(dateKey,branchCode,departmentCode,shiftCode,excludeLeaveId){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return 0;const vals=sh.getRange(2,1,last-1,Math.min(26,sh.getLastColumn())).getValues();let n=0;vals.forEach(r=>{if(String(r[0])===String(excludeLeaveId||''))return;if(!isQuotaOffTypeV7_(r[6])||['PENDING','APPROVED'].indexOf(String(r[2]))<0)return;const s=attendanceDateKey_(r[7]),e=attendanceDateKey_(r[8]);if(!s||!e||dateKey<s||dateKey>e)return;if(String(r[14]||'')===branchCode&&String(r[15]||'')===departmentCode&&String(r[16]||'')===shiftCode)n++});return n}
function leaveAvailabilityForEmployeeV7_(employeeId,dateKey,shiftCode,excludeLeaveId){
  const schedule=latestPublishedScheduleItemV7_(employeeId,dateKey),scope=schedule?{branchCode:schedule.branchCode,departmentCode:schedule.departmentCode,shiftCode:schedule.shiftCode}:employeeHomeScopeV7_(employeeId,dateKey),shift=String(shiftCode||scope.shiftCode||'');if(!shift)throw new Error('กรุณาเลือกกะสำหรับวันที่ขอหยุด');validateShiftV7_(shift,false);const branch=validateBranchV7_(scope.branchCode,false),dept=validateDepartmentV7_(scope.departmentCode,false),rule=matchingLeaveQuotaRuleV7_(branch,dept,shift,dateKey),reserved=requestOffCountV7_(dateKey,branch,dept,shift,excludeLeaveId),maxOff=rule&&isFinite(rule.maxOff)?rule.maxOff:999,minLead=rule?rule.minLeadDays:0,blackout=rule?rule.blackout:false;
  const todayKey=Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'),today=parseIsoDate_(todayKey),target=parseIsoDate_(dateKey),lead=Math.floor((target-today)/86400000);
  const planned=latestPlanningScheduleItemsV7_(branch,dept,dateKey,shift).filter(x=>x.workStatus==='WORK').length,def=getShiftV7_(shift),minimum=Math.max(Number(def&&def.minStaffing)||0,Number(rule&&rule.minStaffing)||0),afterCount=planned?Math.max(0,planned-(reserved+1)):null;
  let available=true,reason='';if(blackout){available=false;reason='วันนี้กำหนดงดขอหยุด'}else if(lead<minLead){available=false;reason='ต้องขอล่วงหน้าอย่างน้อย '+minLead+' วัน'}else if(reserved>=maxOff){available=false;reason='วันหยุดเต็มแล้ว ('+reserved+'/'+maxOff+')'}else if(planned&&minimum&&afterCount<minimum){available=false;reason='หากหยุดจะเหลือกำลังคน '+afterCount+' คน ต่ำกว่าขั้นต่ำ '+minimum+' คน'};
  return{available:available,reason:reason,date:dateKey,branchCode:branch,departmentCode:dept,shiftCode:shift,reserved:reserved,maxOff:maxOff,remaining:Math.max(0,maxOff-reserved),plannedCount:planned,minimumStaffing:minimum,projectedAfterRequest:afterCount,blackout:blackout,minLeadDays:minLead,ruleId:rule?rule.ruleId:''};
}
function portalGetLeaveAvailabilityV7_(payload){const e=requirePortalV7_(payload.portalToken),dates=Array.isArray(payload.dates)?payload.dates:[String(payload.date||'')],out=[];dates.forEach(d=>{const key=Utilities.formatDate(parseIsoDate_(d),TZ,'yyyy-MM-dd');out.push(leaveAvailabilityForEmployeeV7_(e.id,key,String(payload.shiftCode||''),''))});return{rows:out,serverEpochMs:Date.now()}}
function submitLeaveRequestV7_(leave,actor){
  leave=leave||{};let emp=null,actorRole='EMPLOYEE';if(actor&&actor.employee){emp=actor.employee;actorRole=actorRole||emp.accessRole||'EMPLOYEE'}else{const id=String(leave.employeeId||'').trim(),check=validateEmployeePin(id,String(leave.employeePin||''));if(!check.ok)throw new Error(check.message||'ข้อมูลพนักงานไม่ถูกต้อง');emp=employeeRecordV7_(id)}if(!emp)throw new Error('ไม่พบพนักงาน');
  const type=String(leave.leaveType||'').toUpperCase();if(['REQUEST_OFF','WEEKLY_OFF','SICK','PERSONAL','VACATION','OTHER'].indexOf(type)<0)throw new Error('กรุณาเลือกประเภทการลา/วันหยุด');const start=parseIsoDate_(leave.startDate),end=parseIsoDate_(leave.endDate);if(!start||!end||end<start)throw new Error('ช่วงวันที่ไม่ถูกต้อง');const days=Math.floor((end-start)/86400000)+1;if(days>31)throw new Error('คำขอหนึ่งรายการเลือกได้สูงสุด 31 วัน');let duration=String(leave.duration||'FULL_DAY');if(['FULL_DAY','HALF_AM','HALF_PM'].indexOf(duration)<0)throw new Error('ช่วงเวลาไม่ถูกต้อง');if(isQuotaOffTypeV7_(type)&&duration!=='FULL_DAY')throw new Error('การขอวันหยุดต้องเลือกเต็มวัน');
  const lock=LockService.getScriptLock();lock.waitLock(15000);try{
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(LEAVE_SHEET),last=sh.getLastRow();if(last>=2){const vals=sh.getRange(2,1,last-1,14).getValues();for(let i=0;i<vals.length;i++){const r=vals[i],s=attendanceDateKey_(r[7]),e=attendanceDateKey_(r[8]);if(String(r[3])===emp.id&&['PENDING','APPROVED'].indexOf(String(r[2]))>=0&&s&&e&&!(Utilities.formatDate(end,TZ,'yyyy-MM-dd')<s||Utilities.formatDate(start,TZ,'yyyy-MM-dd')>e))throw new Error('มีคำขอที่รอดำเนินการหรืออนุมัติแล้วซ้อนกับช่วงวันที่นี้');}}
    let branch=emp.branch,dept=emp.department,shift=String(leave.shiftCode||''),quotaStatus='N/A',scheduleConflict='';
    if(isQuotaOffTypeV7_(type)){
      const checks=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const key=Utilities.formatDate(d,TZ,'yyyy-MM-dd'),a=leaveAvailabilityForEmployeeV7_(emp.id,key,shift,'');if(!a.available)throw new Error(key+' '+a.reason);checks.push(a);if(!branch)branch=a.branchCode;if(!dept)dept=a.departmentCode;if(!shift)shift=a.shiftCode;const sched=latestPublishedScheduleItemV7_(emp.id,key);if(sched&&sched.workStatus==='WORK')scheduleConflict=scheduleConflict?String(scheduleConflict)+','+key:key;}quotaStatus='RESERVED';
    } else {const scope=employeeHomeScopeV7_(emp.id,Utilities.formatDate(start,TZ,'yyyy-MM-dd'));branch=scope.branchCode||branch;dept=scope.departmentCode||dept;shift=shift||scope.shiftCode;}
    const now=new Date(),leaveId='LEV-'+Utilities.formatDate(now,TZ,'yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().slice(0,6).toUpperCase(),reason=String(leave.reason||'').trim().slice(0,1000);
    const base=[leaveId,now,'PENDING',emp.id,emp.name,emp.nickname||'',type,start,end,duration,reason,'','',''];const extra=[branch,dept,shift,quotaStatus,scheduleConflict,false,'',actorRole,'','',now,actor&&actor.source?actor.source:'PORTAL'];sh.appendRow(base.concat(extra));
    bumpLeaveRev_();addNotificationV7_('EMPLOYEE',emp.id,'ส่งคำขอเรียบร้อย',(isQuotaOffTypeV7_(type)?leaveTypeLabelV7_(type):'คำขอลา')+' '+Utilities.formatDate(start,TZ,'dd/MM/yyyy')+' อยู่ระหว่างตรวจสอบ','INFO','LEAVE',leaveId);notifyManagersForScopeV7_(branch,dept,'มีคำขอใหม่',emp.name+' ส่ง '+leaveTypeLabelV7_(type)+' '+Utilities.formatDate(start,TZ,'dd/MM/yyyy'),'INFO','LEAVE',leaveId);auditLogV7_(actorRole,emp.id,'SUBMIT_LEAVE','LEAVE',leaveId,'',{type:type,start:Utilities.formatDate(start,TZ,'yyyy-MM-dd'),end:Utilities.formatDate(end,TZ,'yyyy-MM-dd'),branch:branch,department:dept,shift:shift},'',actor&&actor.requestId||'');return{ok:true,leaveId:leaveId};
  }finally{try{lock.releaseLock()}catch(e){}}
}
function leaveTypeLabelV7_(v){return({REQUEST_OFF:'ขอวันหยุด',WEEKLY_OFF:'ขอหยุดประจำสัปดาห์',SICK:'ลาป่วย',PERSONAL:'ลากิจ',VACATION:'ลาพักร้อน',OTHER:'ลาอื่น ๆ'})[String(v||'')]||String(v||'')}
function portalSubmitLeaveV7_(payload){const e=requirePortalV7_(payload.portalToken);const leave=Object.assign({},payload.leave||{},{employeeId:e.id});return submitLeaveRequestV7_(leave,{employee:e,source:'EMPLOYEE_PORTAL',requestId:String(payload.requestId||'')})}
function portalGetLeaveRequestsV7_(payload){const e=requirePortalV7_(payload.portalToken);return leaveRowsV7_({employeeId:e.id,status:String(payload.status||'ALL')})}
function leaveRowsV7_(filter){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const cols=Math.min(26,sh.getLastColumn()),vals=sh.getRange(2,1,last-1,cols).getValues().reverse(),status=String(filter.status||'ALL').toUpperCase();const rows=vals.filter(r=>(!filter.employeeId||String(r[3])===String(filter.employeeId))&&(status==='ALL'||String(r[2]).toUpperCase()===status)&&(!filter.branchCode||String(r[14]||'')===filter.branchCode)&&(!filter.departmentCode||String(r[15]||'')===filter.departmentCode)).map(r=>({leaveId:String(r[0]),submittedAt:formatDateTimeForClient_(r[1]),status:String(r[2]),employeeId:String(r[3]),employeeName:String(r[4]),nickname:String(r[5]),leaveType:String(r[6]),leaveTypeLabel:leaveTypeLabelV7_(r[6]),startDate:formatDateInputForClient_(r[7]),endDate:formatDateInputForClient_(r[8]),duration:String(r[9]),durationLabel:leaveDurationLabel_(r[9]),reason:String(r[10]||''),adminNote:String(r[11]||''),reviewedAt:formatDateTimeForClient_(r[12]),reviewedBy:String(r[13]||''),branchCode:String(r[14]||''),departmentCode:String(r[15]||''),shiftCode:String(r[16]||''),quotaStatus:String(r[17]||''),scheduleConflict:String(r[18]||''),override:Boolean(r[19]),overrideReason:String(r[20]||'')}));return{rows:rows,serverEpochMs:Date.now()}}
function managerGetLeaveRequestsV7_(payload){const e=requirePortalV7_(payload.portalToken,['SUPERVISOR','MANAGER','ADMIN']),scopes=managerScopesForEmployeeV7_(e.id).filter(s=>s.canApproveLeave!==false),all=leaveRowsV7_({status:String(payload.status||'PENDING')}).rows,rows=all.filter(r=>scopes.some(s=>(s.branchCode==='*'||s.branchCode===r.branchCode)&&(s.departmentCode==='*'||s.departmentCode===r.departmentCode)));return{rows:rows,serverEpochMs:Date.now()}}
function reviewLeaveV7_(leaveId,decision,note,actorType,actorId,allowOverride,overrideReason,confirmScheduleChange,requestId){
  const dec=String(decision||'').toUpperCase();if(['APPROVED','REJECTED'].indexOf(dec)<0)throw new Error('สถานะอนุมัติไม่ถูกต้อง');const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=ss.getSheetByName(LEAVE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)throw new Error('ไม่พบคำขอ');const vals=sh.getRange(2,1,last-1,Math.min(26,sh.getLastColumn())).getValues();let row=0,r=null;for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(leaveId)){row=i+2;r=vals[i];break}if(!row)throw new Error('ไม่พบคำขอ');if(String(r[2])!=='PENDING')throw new Error('คำขอนี้ถูกดำเนินการแล้ว');if(actorType==='MANAGER'&&String(r[3])===String(actorId))throw new Error('ผู้จัดการไม่สามารถอนุมัติคำขอของตัวเองได้');
  const type=String(r[6]),start=attendanceDateKey_(r[7]),end=attendanceDateKey_(r[8]),branch=String(r[14]||''),dept=String(r[15]||''),shift=String(r[16]||'');if(dec==='APPROVED'&&isQuotaOffTypeV7_(type)){
    for(let d=parseIsoDate_(start);d<=parseIsoDate_(end);d.setDate(d.getDate()+1)){const key=Utilities.formatDate(d,TZ,'yyyy-MM-dd'),a=leaveAvailabilityForEmployeeV7_(String(r[3]),key,shift,leaveId);if(!a.available&&!allowOverride)throw new Error(key+' '+a.reason);}
    const conflict=String(r[18]||'');if(conflict&&!confirmScheduleChange&&!allowOverride)throw new Error('คำขอนี้ชนกับตารางงาน '+conflict+' กรุณายืนยันการปรับตารางก่อนอนุมัติ');
  }
  sh.getRange(row,3).setValue(dec);sh.getRange(row,12).setValue(String(note||''));sh.getRange(row,13).setValue(new Date());sh.getRange(row,14).setValue(actorType==='ADMIN'?'ADMIN':actorId);if(sh.getLastColumn()>=26){sh.getRange(row,18).setValue(dec==='APPROVED'?'APPROVED':'RELEASED');sh.getRange(row,20).setValue(Boolean(allowOverride));sh.getRange(row,21).setValue(String(overrideReason||''));sh.getRange(row,25).setValue(new Date());}
  if(dec==='APPROVED'&&isQuotaOffTypeV7_(type)&&String(r[18]||''))applyApprovedLeaveToDraftScheduleV7_(String(r[3]),start,end,branch,dept,String(r[0]),actorId);
  bumpLeaveRev_();addNotificationV7_('EMPLOYEE',String(r[3]),dec==='APPROVED'?'คำขอได้รับอนุมัติ':'คำขอไม่ได้รับอนุมัติ',leaveTypeLabelV7_(type)+' '+start+(note?' • '+note:''),dec==='APPROVED'?'SUCCESS':'WARNING','LEAVE',leaveId);auditLogV7_(actorType,actorId,'REVIEW_LEAVE','LEAVE',leaveId,{status:'PENDING'},{status:dec,override:allowOverride},overrideReason||note,requestId);return{ok:true,leaveId:leaveId,status:dec};
}
function applyApprovedLeaveToDraftScheduleV7_(employeeId,startKey,endKey,branch,dept,leaveId,actorId){const start=parseIsoDate_(startKey),end=parseIsoDate_(endKey);for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const key=Utilities.formatDate(d,TZ,'yyyy-MM-dd'),sched=latestPublishedScheduleItemV7_(employeeId,key);if(!sched||sched.workStatus!=='WORK')continue;const v=getOrCreateDraftVersionV7_(sched.weekStart,sched.branchCode,sched.departmentCode,actorId);upsertScheduleItemV7_(v,{date:key,employeeId:employeeId,shiftCode:sched.shiftCode,workStatus:'REQUEST_OFF',source:'LEAVE_APPROVAL',note:'Leave '+leaveId},actorId)}}
function managerReviewLeaveV7_(payload){const id=String(payload.leaveId||''),rows=leaveRowsV7_({status:'ALL'}).rows,leave=rows.find(x=>x.leaveId===id);if(!leave)throw new Error('ไม่พบคำขอ');const auth=requireManagerScopeV7_(payload.portalToken,leave.branchCode,leave.departmentCode,'canApproveLeave');return reviewLeaveV7_(id,payload.decision,payload.note,'MANAGER',auth.employee.id,false,'',Boolean(payload.confirmScheduleChange),String(payload.requestId||''))}
function adminReviewLeaveV7_(payload){requireAdmin_(String(payload.adminToken||''));return reviewLeaveV7_(String(payload.leaveId||''),payload.decision,payload.note,'ADMIN','ADMIN',Boolean(payload.override),String(payload.overrideReason||''),Boolean(payload.confirmScheduleChange)||Boolean(payload.override),String(payload.requestId||''))}

function portalSubmitChangeRequestV7_(payload){const e=requirePortalV7_(payload.portalToken),field=String(payload.fieldName||'').trim(),allowed=['PHONE','CURRENT_ADDRESS','REGISTERED_ADDRESS','EMERGENCY_NAME','EMERGENCY_PHONE','EMERGENCY_RELATIONSHIP','BANK_NAME','BANK_ACCOUNT_NO','BANK_ACCOUNT_NAME','BANK_CODE','FIRST_NAME','LAST_NAME','NICKNAME','DOCUMENT'];if(allowed.indexOf(field)<0)throw new Error('ข้อมูลนี้ไม่รองรับการขอแก้ไข');const old=profileFieldValueV7_(e,field),value=String(payload.newValue||'').trim();if(field!=='DOCUMENT'&&!value)throw new Error('กรุณาระบุข้อมูลใหม่');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_CHANGE_REQUESTS_SHEET),id='CHG-'+Utilities.getUuid().slice(0,10).toUpperCase();sh.appendRow([id,e.id,field,String(old||''),value,String(payload.reason||''),'PENDING',new Date(),'','','',String(payload.attachmentFileId||'')]);addNotificationV7_('ROLE','ADMIN','คำขอแก้ไขข้อมูลพนักงาน',e.name+' ขอแก้ไข '+field,'INFO','CHANGE_REQUEST',id);return{ok:true,requestId:id}}
function profileFieldValueV7_(e,field){const m={PHONE:e.phone,CURRENT_ADDRESS:e.currentAddress,REGISTERED_ADDRESS:e.registeredAddress,EMERGENCY_NAME:e.emergencyName,EMERGENCY_PHONE:e.emergencyPhone,EMERGENCY_RELATIONSHIP:e.emergencyRelationship,BANK_NAME:e.bankName,BANK_ACCOUNT_NO:e.bankAccountNo,BANK_ACCOUNT_NAME:e.bankAccountName,BANK_CODE:e.bankCode,FIRST_NAME:e.firstName,LAST_NAME:e.lastName,NICKNAME:e.nickname};return m[field]||''}
function portalGetChangeRequestsV7_(payload){const e=requirePortalV7_(payload.portalToken);return changeRequestsRowsV7_(e.id)}
function changeRequestsRowsV7_(employeeId){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_CHANGE_REQUESTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(2,1,last-1,12).getValues().reverse().filter(r=>!employeeId||String(r[1])===String(employeeId)).map(r=>({requestId:String(r[0]),employeeId:String(r[1]),fieldName:String(r[2]),oldValue:String(r[3]||''),newValue:String(r[4]||''),reason:String(r[5]||''),status:String(r[6]),submittedAt:formatDateTimeForClient_(r[7]),reviewedAt:formatDateTimeForClient_(r[8]),reviewedBy:String(r[9]||''),adminNote:String(r[10]||''),attachmentFileId:String(r[11]||'')}));return{rows:rows}}
function adminGetChangeRequestsV7_(payload){requireAdmin_(String(payload.adminToken||''));return changeRequestsRowsV7_(String(payload.employeeId||''))}
function applyEmployeeChangeV7_(employeeId,field,value){const e=employeeRecordV7_(employeeId);if(!e)throw new Error('ไม่พบพนักงาน');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET),map={PHONE:9,CURRENT_ADDRESS:20,REGISTERED_ADDRESS:19,EMERGENCY_NAME:21,EMERGENCY_PHONE:22,EMERGENCY_RELATIONSHIP:23,BANK_NAME:28,BANK_ACCOUNT_NO:29,BANK_ACCOUNT_NAME:30,BANK_CODE:31,FIRST_NAME:12,LAST_NAME:13,NICKNAME:8},col=map[field];if(!col)return;if([9,22,28,29,30,31].indexOf(col)>=0)sh.getRange(e.row,col).setNumberFormat('@');sh.getRange(e.row,col).setValue(String(value||''));if(field==='FIRST_NAME'||field==='LAST_NAME'){const first=field==='FIRST_NAME'?String(value):e.firstName,last=field==='LAST_NAME'?String(value):e.lastName;sh.getRange(e.row,2).setValue((first+' '+last).trim())}sh.getRange(e.row,6).setValue(new Date())}
function adminReviewChangeRequestV7_(payload){requireAdmin_(String(payload.adminToken||''));const id=String(payload.requestId||''),dec=String(payload.decision||'').toUpperCase();if(['APPROVED','REJECTED'].indexOf(dec)<0)throw new Error('สถานะไม่ถูกต้อง');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_CHANGE_REQUESTS_SHEET),last=sh?sh.getLastRow():0,vals=last>=2?sh.getRange(2,1,last-1,12).getValues():[];for(let i=0;i<vals.length;i++){const r=vals[i];if(String(r[0])!==id)continue;if(String(r[6])!=='PENDING')throw new Error('รายการนี้ถูกดำเนินการแล้ว');if(dec==='APPROVED')applyEmployeeChangeV7_(String(r[1]),String(r[2]),String(r[4]));sh.getRange(i+2,7).setValue(dec);sh.getRange(i+2,9).setValue(new Date());sh.getRange(i+2,10).setValue('ADMIN');sh.getRange(i+2,11).setValue(String(payload.note||''));addNotificationV7_('EMPLOYEE',String(r[1]),dec==='APPROVED'?'แก้ไขข้อมูลแล้ว':'คำขอแก้ไขข้อมูลไม่อนุมัติ',String(r[2])+(payload.note?' • '+payload.note:''),dec==='APPROVED'?'SUCCESS':'WARNING','CHANGE_REQUEST',id);auditLogV7_('ADMIN','ADMIN','REVIEW_CHANGE_REQUEST','CHANGE_REQUEST',id,{status:'PENDING'},{status:dec},String(payload.note||''),String(payload.requestIdTrace||''));return{ok:true,status:dec}}throw new Error('ไม่พบคำขอ')}

function portalSubmitAttendanceCorrectionV7_(payload){const e=requirePortalV7_(payload.portalToken),dateKey=Utilities.formatDate(parseIsoDate_(payload.date),TZ,'yyyy-MM-dd'),type=String(payload.correctionType||'').toUpperCase();if(['ADD_IN','ADD_OUT','REPLACE_IN','REPLACE_OUT','ADD_BOTH','REPLACE_BOTH'].indexOf(type)<0)throw new Error('ประเภทการแก้เวลาไม่ถูกต้อง');const scope=employeeHomeScopeV7_(e.id,dateKey),id='COR-'+Utilities.getUuid().slice(0,10).toUpperCase(),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_CORRECTIONS_SHEET);sh.appendRow([id,e.id,parseIsoDate_(dateKey),type,String(payload.requestedIn||''),String(payload.requestedOut||''),String(payload.reason||''),'PENDING',new Date(),'','','','', '',scope.branchCode,scope.departmentCode]);notifyManagersForScopeV7_(scope.branchCode,scope.departmentCode,'คำขอแก้ไขเวลา',e.name+' ขอแก้เวลา '+dateKey,'WARNING','ATTENDANCE_CORRECTION',id);return{ok:true,correctionId:id}}
function correctionRowsV7_(employeeId,status){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_CORRECTIONS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const st=String(status||'ALL').toUpperCase();const rows=sh.getRange(2,1,last-1,16).getValues().reverse().filter(r=>(!employeeId||String(r[1])===String(employeeId))&&(st==='ALL'||String(r[7])===st)).map(r=>({correctionId:String(r[0]),employeeId:String(r[1]),date:formatDateInputForClient_(r[2]),correctionType:String(r[3]),requestedIn:String(r[4]||''),requestedOut:String(r[5]||''),reason:String(r[6]||''),status:String(r[7]),submittedAt:formatDateTimeForClient_(r[8]),reviewedAt:formatDateTimeForClient_(r[9]),reviewedBy:String(r[10]||''),managerNote:String(r[11]||''),branchCode:String(r[14]||''),departmentCode:String(r[15]||'')}));return{rows:rows}}
function portalGetAttendanceCorrectionsV7_(payload){const e=requirePortalV7_(payload.portalToken);return correctionRowsV7_(e.id,String(payload.status||'ALL'))}
function managerGetAttendanceCorrectionsV7_(payload){const e=requirePortalV7_(payload.portalToken,['SUPERVISOR','MANAGER','ADMIN']),scopes=managerScopesForEmployeeV7_(e.id).filter(s=>s.canViewAttendance!==false),rows=correctionRowsV7_('',String(payload.status||'PENDING')).rows.filter(r=>scopes.some(s=>(s.branchCode==='*'||s.branchCode===r.branchCode)&&(s.departmentCode==='*'||s.departmentCode===r.departmentCode)));return{rows:rows}}
function applyAttendanceCorrectionV7_(correction,reviewerId){const ss=SpreadsheetApp.openById(SPREADSHEET_ID),att=ss.getSheetByName(ATTENDANCE_SHEET),emp=employeeRecordV7_(correction.employeeId),dateKey=correction.date,ids=[];if(!emp)throw new Error('ไม่พบพนักงาน');const events=attendanceEventsForPayroll_(ss,emp.id,dateKey,dateKey);function voidKind(kind){const targets=events.filter(x=>actionKindServer_(x.action)===kind);if(!targets.length)return;if(kind==='IN')targets.sort((a,b)=>a.timestamp-b.timestamp);else targets.sort((a,b)=>b.timestamp-a.timestamp);const id=targets[0].transactionId,last=att.getLastRow(),vals=att.getRange(2,1,last-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===id){att.getRange(i+2,12).setValue('VOID_CORRECTION');att.getRange(i+2,15).setValue('แทนที่ด้วยคำขอแก้เวลา '+correction.correctionId);break}}
  function add(kind,timeText){if(!timeText)return;const m=String(timeText).match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);if(!m)throw new Error('เวลาแก้ไขไม่ถูกต้อง');const p=dateKey.split('-').map(Number),dt=new Date(p[0],p[1]-1,p[2],Number(m[1]),Number(m[2]),Number(m[3]||0)),tx='CORATT-'+Utilities.getUuid().slice(0,10).toUpperCase(),label=kind==='IN'?'เข้างาน':'เลิกงาน';att.appendRow([tx,dt,Utilities.formatDate(dt,TZ,'dd/MM/yyyy'),Utilities.formatDate(dt,TZ,'HH:mm:ss'),emp.id,emp.name,label,'','','','CORRECTION','APPROVED_CORRECTION','',new Date(),'Correction '+correction.correctionId,emp.nickname||'',correction.branchCode||emp.branch,emp.department,'CORRECTION']);ids.push(tx)}
  const t=correction.correctionType;if(t.indexOf('REPLACE_IN')>=0||t==='REPLACE_BOTH')voidKind('IN');if(t.indexOf('REPLACE_OUT')>=0||t==='REPLACE_BOTH')voidKind('OUT');if(t==='ADD_IN'||t==='REPLACE_IN'||t==='ADD_BOTH'||t==='REPLACE_BOTH')add('IN',correction.requestedIn);if(t==='ADD_OUT'||t==='REPLACE_OUT'||t==='ADD_BOTH'||t==='REPLACE_BOTH')add('OUT',correction.requestedOut);return ids}
function managerReviewAttendanceCorrectionV7_(payload){const id=String(payload.correctionId||''),all=correctionRowsV7_('', 'ALL').rows,c=all.find(x=>x.correctionId===id);if(!c)throw new Error('ไม่พบคำขอ');const auth=requireManagerScopeV7_(payload.portalToken,c.branchCode,c.departmentCode,'canViewAttendance'),dec=String(payload.decision||'').toUpperCase();if(['APPROVED','REJECTED'].indexOf(dec)<0)throw new Error('สถานะไม่ถูกต้อง');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_CORRECTIONS_SHEET),vals=sh.getRange(2,1,sh.getLastRow()-1,16).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===id){if(String(vals[i][7])!=='PENDING')throw new Error('รายการนี้ถูกดำเนินการแล้ว');let tx=[];if(dec==='APPROVED')tx=applyAttendanceCorrectionV7_(c,auth.employee.id);sh.getRange(i+2,8).setValue(dec);sh.getRange(i+2,10).setValue(new Date());sh.getRange(i+2,11).setValue(auth.employee.id);sh.getRange(i+2,12).setValue(String(payload.note||''));sh.getRange(i+2,14).setValue(tx.join(','));addNotificationV7_('EMPLOYEE',c.employeeId,dec==='APPROVED'?'แก้ไขเวลาแล้ว':'คำขอแก้เวลาไม่อนุมัติ',c.date+(payload.note?' • '+payload.note:''),dec==='APPROVED'?'SUCCESS':'WARNING','ATTENDANCE_CORRECTION',id);auditLogV7_('MANAGER',auth.employee.id,'REVIEW_ATTENDANCE_CORRECTION','ATTENDANCE_CORRECTION',id,{status:'PENDING'},{status:dec,transactions:tx},String(payload.note||''),String(payload.requestId||''));return{ok:true,status:dec,transactions:tx}}throw new Error('ไม่พบคำขอ')}

function payrollSnapshotRowsV7_(employeeId,periodKey){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_SNAPSHOTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];return sh.getRange(2,1,last-1,19).getValues().filter(r=>(!employeeId||String(r[2])===String(employeeId))&&(!periodKey||String(r[1])===String(periodKey))).map((r,i)=>({row:i+2,snapshotId:String(r[0]),periodKey:String(r[1]),employeeId:String(r[2]),startDate:formatDateInputForClient_(r[3]),endDate:formatDateInputForClient_(r[4]),payDate:formatDateInputForClient_(r[5]),status:String(r[6]),gross:Number(r[7])||0,deductions:Number(r[8])||0,net:Number(r[9])||0,detailJson:String(r[10]||''),createdAt:formatDateTimeForClient_(r[11]),createdBy:String(r[12]||''),finalizedAt:formatDateTimeForClient_(r[13]),paidAt:formatDateTimeForClient_(r[14]),paidReference:String(r[15]||''),employeeResponse:String(r[16]||''),employeeResponseAt:formatDateTimeForClient_(r[17]),updatedAt:formatDateTimeForClient_(r[18])}))}
function adminCreatePayrollReviewV7_(payload){const token=String(payload.adminToken||'');requireAdmin_(token);const preview=adminGetPayrollPreview_(token,String(payload.employeeId||''),String(payload.startDate||''),String(payload.endDate||''),String(payload.payDate||'')),existing=payrollSnapshotRowsV7_(preview.employee.id,preview.periodKey).find(x=>['REVIEW','HOLD','FINAL','PAID'].indexOf(x.status)>=0);if(existing&&['FINAL','PAID'].indexOf(existing.status)>=0)throw new Error('รอบนี้ถูก Final แล้ว');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_SNAPSHOTS_SHEET),now=new Date(),id=existing?existing.snapshotId:'PAY-'+Utilities.getUuid().slice(0,10).toUpperCase(),values=[id,preview.periodKey,preview.employee.id,parseIsoDate_(preview.startDate),parseIsoDate_(preview.endDate),preview.payDate?parseIsoDate_(preview.payDate):'','REVIEW',preview.totals.gross,preview.totals.totalDeductions,preview.totals.net,jsonCellV7_(preview),existing?parseClientDateTimeV7_(existing.createdAt)||now:now,'ADMIN','','','', '', '',now];if(existing){const row=findRowByIdV7_(sh,id);sh.getRange(row,1,1,19).setValues([values])}else sh.appendRow(values);addNotificationV7_('EMPLOYEE',preview.employee.id,'ยอดค่าแรงพร้อมตรวจ','รอบ '+preview.startDate+' ถึง '+preview.endDate+' ยอดสุทธิ '+preview.totals.net+' บาท','INFO','PAYROLL',id);auditLogV7_('ADMIN','ADMIN','CREATE_PAYROLL_REVIEW','PAYROLL_SNAPSHOT',id,'',{net:preview.totals.net},'',String(payload.requestId||''));return{ok:true,snapshotId:id,preview:preview}}
function parseClientDateTimeV7_(v){return''}
function portalGetPayrollV7_(payload){const e=requirePortalV7_(payload.portalToken),rows=payrollSnapshotRowsV7_(e.id,String(payload.periodKey||''));rows.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return{rows:rows.map(x=>{let detail={};try{detail=JSON.parse(x.detailJson||'{}')}catch(e2){}return Object.assign({},x,{detail:detail,detailJson:undefined})}),serverEpochMs:Date.now()}}
function portalRespondPayrollV7_(payload){const e=requirePortalV7_(payload.portalToken),id=String(payload.snapshotId||''),resp=String(payload.response||'').toUpperCase();if(['ACCEPT','DISPUTE'].indexOf(resp)<0)throw new Error('คำตอบไม่ถูกต้อง');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_SNAPSHOTS_SHEET),row=findRowByIdV7_(sh,id);if(!row)throw new Error('ไม่พบรอบค่าแรง');const r=sh.getRange(row,1,1,19).getValues()[0];if(String(r[2])!==e.id)throw new Error('ไม่มีสิทธิ์');if(['FINAL','PAID'].indexOf(String(r[6]))>=0&&resp==='DISPUTE')throw new Error('รอบนี้ถูกยืนยันแล้ว กรุณาติดต่อ Admin');sh.getRange(row,17).setValue(resp);sh.getRange(row,18).setValue(new Date());sh.getRange(row,19).setValue(new Date());if(resp==='DISPUTE'){const dsh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_DISPUTES_SHEET),did='DSP-'+Utilities.getUuid().slice(0,10).toUpperCase();dsh.appendRow([did,id,String(r[1]),e.id,String(payload.category||'OTHER'),String(payload.message||''),'OPEN',new Date(),'','','']);sh.getRange(row,7).setValue('HOLD');addNotificationV7_('ROLE','ADMIN','พนักงานแจ้งปัญหาค่าแรง',e.name+' แจ้งปัญหารอบ '+String(r[1]),'WARNING','PAYROLL_DISPUTE',did);return{ok:true,disputeId:did}}return{ok:true}}
function payrollDisputeRowsV7_(employeeId,status){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_DISPUTES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];const st=String(status||'ALL').toUpperCase();return sh.getRange(2,1,last-1,11).getValues().reverse().filter(r=>(!employeeId||String(r[3])===String(employeeId))&&(st==='ALL'||String(r[6])===st)).map(r=>({disputeId:String(r[0]),snapshotId:String(r[1]),periodKey:String(r[2]),employeeId:String(r[3]),category:String(r[4]),message:String(r[5]),status:String(r[6]),submittedAt:formatDateTimeForClient_(r[7]),reviewedAt:formatDateTimeForClient_(r[8]),reviewedBy:String(r[9]||''),resolutionNote:String(r[10]||'')}))}
function portalGetPayrollDisputesV7_(payload){const e=requirePortalV7_(payload.portalToken);return{rows:payrollDisputeRowsV7_(e.id,String(payload.status||'ALL'))}}

// V7.4 performance: load the entire payroll dashboard in one backend call.
// This avoids N separate adminGetPayrollPreview requests and reads each Sheet only once.
function adminDashboardPayrollBundleV7_(payload){
  const started=Date.now(),token=String(payload.adminToken||'');requireAdmin_(token);
  const startDate=String(payload.startDate||''),endDate=String(payload.endDate||''),payDate=String(payload.payDate||'');
  const start=parseIsoDate_(startDate),end=parseIsoDate_(endDate);
  if(!start||!end||end<start)throw new Error('ช่วงวันที่ไม่ถูกต้อง');
  const days=Math.floor((end-start)/86400000)+1;if(days>31)throw new Error('เลือกช่วงได้สูงสุด 31 วัน');
  const today=new Date();today.setHours(0,0,0,0);if(end>=today)throw new Error('รอบคิดเงินจริงต้องสิ้นสุดก่อนวันปัจจุบัน');
  const startKey=Utilities.formatDate(start,TZ,'yyyy-MM-dd'),endKey=Utilities.formatDate(end,TZ,'yyyy-MM-dd'),periodKey=payrollPeriodKey_(startDate,endDate,payDate);
  const cache=CacheService.getScriptCache(),cacheKey='KF_PAYROLL_DASH_'+startKey+'_'+endKey+'_'+String(payDate||'').replace(/-/g,'');
  try{
    const raw=cache.get(cacheKey);
    if(raw){const hit=JSON.parse(raw);hit.fromCache=true;hit.durationMs=Date.now()-started;return hit}
  }catch(e){}

  const summary=adminGetFastSummary_(token,false),employees=(summary.employees||[]).filter(e=>e.active!==false&&String(e.employmentStatus||'ACTIVE')!=='RESIGNED');
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const input=payrollBundleReadDataV7_(ss,startKey,endKey,periodKey);
  const payroll=[];
  employees.forEach(emp=>{
    try{
      const preview=payrollBundleCalcEmployeeV7_(emp,start,end,startKey,endKey,payDate,periodKey,input);
      payroll.push({employeeId:String(emp.id),ok:true,preview:preview});
    }catch(err){payroll.push({employeeId:String(emp.id),ok:false,error:err&&err.message?err.message:String(err)})}
  });
  const snapshots=input.snapshots.filter(x=>x.startDate===startKey&&x.endDate===endKey&&(!payDate||x.payDate===payDate));
  const result={summary:summary,employees:employees,payroll:payroll,snapshots:snapshots,startDate:startKey,endDate:endKey,payDate:payDate,periodKey:periodKey,fromCache:false,durationMs:Date.now()-started,serverEpochMs:Date.now()};
  try{cache.put(cacheKey,JSON.stringify(result),30)}catch(e){}
  return result;
}

function payrollBundleReadDataV7_(ss,startKey,endKey,periodKey){
  const eventsByEmployee={},leavesByEmployee={},itemsByEmployee={},adjustmentsByEmployee={},snapshots=[];

  // Attendance: scan the date column once, then read only the relevant contiguous block once.
  const att=ss.getSheetByName(ATTENDANCE_SHEET),attLast=att?att.getLastRow():0;
  if(att&&attLast>=2){
    const start=parseIsoDate_(startKey),end=parseIsoDate_(endKey),scanStart=new Date(start),scanEnd=new Date(end);
    scanStart.setDate(scanStart.getDate()-1);scanEnd.setDate(scanEnd.getDate()+1);
    const scanStartKey=Utilities.formatDate(scanStart,TZ,'yyyy-MM-dd'),scanEndKey=Utilities.formatDate(scanEnd,TZ,'yyyy-MM-dd');
    const dates=att.getRange(2,3,attLast-1,1).getValues();let first=0,lastRow=0;
    for(let i=0;i<dates.length;i++){
      const k=attendanceDateKey_(dates[i][0]);if(!k)continue;
      if(!first&&k>=scanStartKey&&k<=scanEndKey)first=i+2;
      if(k>=scanStartKey&&k<=scanEndKey)lastRow=i+2;
      if(first&&k>scanEndKey)break;
    }
    if(first&&lastRow){
      const vals=att.getRange(first,1,lastRow-first+1,Math.min(19,att.getLastColumn())).getValues();
      vals.forEach(r=>{
        const employeeId=String(r[4]||'');if(!employeeId||String(r[11]||'').indexOf('VOID')===0)return;
        const timestamp=r[1] instanceof Date?r[1]:null;if(!timestamp)return;
        const ev={transactionId:toClientText_(r[0]),timestamp:timestamp,date:attendanceDateKey_(r[2]),time:formatTimeForClient_(r[3]),action:toClientText_(r[6]),deviceId:toClientText_(r[10]),status:toClientText_(r[11]),note:toClientText_(r[14])};
        (eventsByEmployee[employeeId]||(eventsByEmployee[employeeId]=[])).push(ev);
      });
      Object.keys(eventsByEmployee).forEach(id=>eventsByEmployee[id].sort((a,b)=>a.timestamp-b.timestamp));
    }
  }

  // Approved leave: one full read, then group in memory.
  const leave=ss.getSheetByName(LEAVE_SHEET),leaveLast=leave?leave.getLastRow():0;
  if(leave&&leaveLast>=2){
    leave.getRange(2,1,leaveLast-1,14).getValues().forEach(r=>{
      if(String(r[2]||'')!=='APPROVED')return;
      const employeeId=String(r[3]||''),a=attendanceDateKey_(r[7]),b=attendanceDateKey_(r[8]);
      if(!employeeId||!a||!b||b<startKey||a>endKey)return;
      const x={leaveId:toClientText_(r[0]),leaveType:toClientText_(r[6]),leaveTypeLabel:leaveTypeLabel_(r[6]),startDate:a,endDate:b,duration:toClientText_(r[9]),durationLabel:leaveDurationLabel_(r[9]),reason:toClientText_(r[10])};
      (leavesByEmployee[employeeId]||(leavesByEmployee[employeeId]=[])).push(x);
    });
  }

  // Recurring pay items: one read.
  const pay=ss.getSheetByName(EMPLOYEE_PAY_ITEMS_SHEET),payLast=pay?pay.getLastRow():0;
  if(pay&&payLast>=2){
    pay.getRange(2,1,payLast-1,13).getValues().forEach(r=>{
      const employeeId=String(r[1]||'');if(!employeeId||r[8]===false)return;
      const x={itemId:String(r[0]),type:String(r[2]),name:String(r[3]),method:String(r[4]),amount:Number(r[5])||0,effectiveStart:attendanceDateKey_(r[6]),effectiveEnd:attendanceDateKey_(r[7]),active:r[8]!==false,note:String(r[12]||'')};
      if((x.effectiveStart&&x.effectiveStart>endKey)||(x.effectiveEnd&&x.effectiveEnd<startKey))return;
      (itemsByEmployee[employeeId]||(itemsByEmployee[employeeId]=[])).push(x);
    });
  }

  // Period adjustments: one read, filtered to the requested period.
  const adj=ss.getSheetByName(PAYROLL_ADJUSTMENTS_SHEET),adjLast=adj?adj.getLastRow():0;
  if(adj&&adjLast>=2){
    adj.getRange(2,1,adjLast-1,13).getValues().forEach(r=>{
      if(String(r[1])!==String(periodKey)||String(r[7]||'ACTIVE')==='DELETED')return;
      const employeeId=String(r[2]||'');if(!employeeId)return;
      const x={adjustmentId:String(r[0]),type:String(r[3]),name:String(r[4]),amount:Number(r[5])||0,effectiveDate:attendanceDateKey_(r[6]),note:String(r[10]||''),locked:Boolean(r[12])};
      (adjustmentsByEmployee[employeeId]||(adjustmentsByEmployee[employeeId]=[])).push(x);
    });
  }

  // Payroll snapshots: one read for workflow status.
  const snap=ss.getSheetByName(PAYROLL_SNAPSHOTS_SHEET),snapLast=snap?snap.getLastRow():0;
  if(snap&&snapLast>=2){
    snap.getRange(2,1,snapLast-1,19).getValues().forEach((r,i)=>snapshots.push({row:i+2,snapshotId:String(r[0]),periodKey:String(r[1]),employeeId:String(r[2]),startDate:formatDateInputForClient_(r[3]),endDate:formatDateInputForClient_(r[4]),payDate:formatDateInputForClient_(r[5]),status:String(r[6]),gross:Number(r[7])||0,deductions:Number(r[8])||0,net:Number(r[9])||0,detailJson:String(r[10]||''),createdAt:formatDateTimeForClient_(r[11]),createdBy:String(r[12]||''),finalizedAt:formatDateTimeForClient_(r[13]),paidAt:formatDateTimeForClient_(r[14]),paidReference:String(r[15]||''),employeeResponse:String(r[16]||''),employeeResponseAt:formatDateTimeForClient_(r[17]),updatedAt:formatDateTimeForClient_(r[18])}));
  }
  return{eventsByEmployee:eventsByEmployee,leavesByEmployee:leavesByEmployee,itemsByEmployee:itemsByEmployee,adjustmentsByEmployee:adjustmentsByEmployee,snapshots:snapshots};
}

function payrollBundleCalcEmployeeV7_(emp,start,end,startKey,endKey,payDate,periodKey,input){
  const id=String(emp.id),events=(input.eventsByEmployee[id]||[]),sessions=pairPayrollSessions_(events),leaves=input.leavesByEmployee[id]||[],byDay={},notesByDay={};
  events.forEach(ev=>{const k=Utilities.formatDate(ev.timestamp,TZ,'yyyy-MM-dd');(notesByDay[k]||(notesByDay[k]=[])).push(String(ev.note||''))});
  sessions.forEach(s=>{
    if(s.inEvent){
      const cls=classifyPayrollShift_(s.inEvent.timestamp,s.outEvent&&s.outEvent.timestamp),key=cls.workDate||Utilities.formatDate(s.inEvent.timestamp,TZ,'yyyy-MM-dd');
      if(key<startKey||key>endKey)return;const cur=byDay[key]||{sessions:[],outOnly:[]};cur.sessions.push({inEvent:s.inEvent,outEvent:s.outEvent,shift:cls.shift});byDay[key]=cur;
    }else if(s.outEvent){const key=Utilities.formatDate(s.outEvent.timestamp,TZ,'yyyy-MM-dd');if(key<startKey||key>endKey)return;const cur=byDay[key]||{sessions:[],outOnly:[]};cur.outOnly.push(s.outEvent);byDay[key]=cur}
  });

  const dailyWage=Number(emp.dailyWage)||0,rows=[];let totalBase=0,totalLateDeduction=0,totalNight=0,totalOtPay=0,totalOtHours=0,workedDays=0,nightShifts=0;
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const key=Utilities.formatDate(d,TZ,'yyyy-MM-dd'),bucket=byDay[key]||{sessions:[],outOnly:[]},leave=leaves.find(x=>x.startDate<=key&&x.endDate>=key)||null;
    let inEv=null,outEv=null,shift='UNKNOWN';
    if(bucket.sessions.length){bucket.sessions.sort((a,b)=>a.inEvent.timestamp-b.inEvent.timestamp);inEv=bucket.sessions[0].inEvent;shift=bucket.sessions[0].shift;const outs=bucket.sessions.filter(x=>x.outEvent).map(x=>x.outEvent).sort((a,b)=>a.timestamp-b.timestamp);outEv=outs.length?outs[outs.length-1]:null}
    else if(bucket.outOnly.length){bucket.outOnly.sort((a,b)=>a.timestamp-b.timestamp);outEv=bucket.outOnly[bucket.outOnly.length-1]}
    const dayNoteText=(notesByDay[key]||[]).join(' '),forcedDayOff=/ขาดงาน|สลับกะ/.test(dayNoteText),worked=!forcedDayOff&&Boolean(inEv||outEv);
    let base=worked?dailyWage:0,lateMin=0,lateDed=0,night=0,beforeMin=0,afterMin=0,otHours=0,otPay=0,note=[];
    if(forcedDayOff)note.push(/ขาดงาน/.test(dayNoteText)?'ขาดงาน':'สลับกะ');if(worked)workedDays++;if(inEv&&shift==='NIGHT'){night=65;nightShifts++}
    if(inEv&&shift!=='UNKNOWN'){const scheduleStart=shift==='DAY'?dateAtTime_(key,8,0,0):dateAtTime_(key,20,0,0),lateThreshold=new Date(scheduleStart.getTime()+6*60000);if(inEv.timestamp>=lateThreshold){lateMin=Math.floor((inEv.timestamp-scheduleStart)/60000);lateDed=100}}
    if(inEv&&outEv&&shift!=='UNKNOWN'){
      const scheduleStart=shift==='DAY'?dateAtTime_(key,8,0,0):dateAtTime_(key,20,0,0),scheduleEnd=shift==='DAY'?dateAtTime_(key,20,0,0):dateAtTime_(key,8,0,1);
      beforeMin=inEv.timestamp<scheduleStart?wholeMinutesBetween_(inEv.timestamp,scheduleStart):0;afterMin=outEv.timestamp>scheduleEnd?wholeMinutesBetween_(scheduleEnd,outEv.timestamp):0;otHours=Math.floor(beforeMin/60)+Math.floor(afterMin/60);otPay=dailyWage>0?roundMoney_(otHours*((dailyWage/12)*1.5)):0;
    }else if(worked){if(!inEv)note.push('ไม่มีเวลาเข้า');if(!outEv)note.push('ไม่มีเวลาออก');note.push('ไม่คำนวณ OT')}
    if(inEv&&shift==='UNKNOWN')note.push('กะไม่ชัดเจน');if(leave)note.push('ลา: '+leave.leaveTypeLabel+' '+leave.durationLabel);if(worked&&dailyWage<=0)note.push('ยังไม่ได้กำหนดค่าแรงรายวัน');
    const dayNet=roundMoney_(base-lateDed+night+otPay);totalBase+=base;totalLateDeduction+=lateDed;totalNight+=night;totalOtPay+=otPay;totalOtHours+=otHours;
    rows.push({date:key,dayName:Utilities.formatDate(d,TZ,'EEEE'),shift:shift,inTime:inEv?Utilities.formatDate(inEv.timestamp,TZ,'HH:mm:ss'):'',outTime:outEv?Utilities.formatDate(outEv.timestamp,TZ,'HH:mm:ss'):'',baseWage:roundMoney_(base),lateMinutes:lateMin,lateDeduction:lateDed,nightAllowance:night,otBeforeMinutes:beforeMin,otAfterMinutes:afterMin,otPaidHours:otHours,otPay:roundMoney_(otPay),dayNet:dayNet,worked:worked,leave:leave,note:note.join(' • ')});
  }
  const itemResults=[],items=input.itemsByEmployee[id]||[];let recurringEarn=0,recurringDed=0;
  items.forEach(it=>{let qty=1;if(it.method==='PER_WORKDAY')qty=workedDays;else if(it.method==='PER_NIGHT_SHIFT')qty=nightShifts;const amount=roundMoney_(it.amount*qty);itemResults.push(Object.assign({},it,{quantity:qty,total:amount}));if(it.type==='DEDUCTION')recurringDed+=amount;else recurringEarn+=amount});
  const adjustments=input.adjustmentsByEmployee[id]||[];let adjEarn=0,adjDed=0;adjustments.forEach(a=>{if(a.type==='DEDUCTION')adjDed+=a.amount;else adjEarn+=a.amount});
  totalBase=roundMoney_(totalBase);totalLateDeduction=roundMoney_(totalLateDeduction);totalNight=roundMoney_(totalNight);totalOtPay=roundMoney_(totalOtPay);recurringEarn=roundMoney_(recurringEarn);recurringDed=roundMoney_(recurringDed);adjEarn=roundMoney_(adjEarn);adjDed=roundMoney_(adjDed);
  const gross=roundMoney_(totalBase+totalNight+totalOtPay+recurringEarn+adjEarn),deductions=roundMoney_(totalLateDeduction+recurringDed+adjDed),net=roundMoney_(gross-deductions);
  return{employee:{id:id,name:String(emp.name||''),nickname:String(emp.nickname||''),wageType:String(emp.wageType||''),wageAmount:Number(emp.wageAmount)||0,dailyWage:dailyWage},periodKey:periodKey,startDate:startKey,endDate:endKey,payDate:String(payDate||''),rows:rows,recurringItems:itemResults,adjustments:adjustments,totals:{baseWage:totalBase,lateDeduction:totalLateDeduction,nightAllowance:totalNight,otHours:totalOtHours,otPay:totalOtPay,recurringEarnings:recurringEarn,recurringDeductions:recurringDed,adjustmentEarnings:adjEarn,adjustmentDeductions:adjDed,gross:gross,totalDeductions:deductions,net:net,workedDays:workedDays,nightShifts:nightShifts},serverEpochMs:Date.now()};
}

function adminGetPayrollSnapshotsV7_(payload){
  requireAdmin_(String(payload.adminToken||''));
  const employeeId=String(payload.employeeId||''),periodKey=String(payload.periodKey||''),startDate=String(payload.startDate||''),endDate=String(payload.endDate||''),payDate=String(payload.payDate||'');
  let rows=payrollSnapshotRowsV7_(employeeId,periodKey);
  if(startDate) rows=rows.filter(x=>String(x.startDate||'')===startDate);
  if(endDate) rows=rows.filter(x=>String(x.endDate||'')===endDate);
  if(payDate) rows=rows.filter(x=>String(x.payDate||'')===payDate);
  rows.sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));
  return{rows:rows,serverEpochMs:Date.now()}
}
function adminGetPayrollDisputesV7_(payload){requireAdmin_(String(payload.adminToken||''));return{rows:payrollDisputeRowsV7_(String(payload.employeeId||''),String(payload.status||'ALL'))}}
function adminReviewPayrollDisputeV7_(payload){requireAdmin_(String(payload.adminToken||''));const id=String(payload.disputeId||''),dec=String(payload.status||'RESOLVED').toUpperCase();if(['RESOLVED','REJECTED'].indexOf(dec)<0)throw new Error('สถานะไม่ถูกต้อง');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_DISPUTES_SHEET),row=findRowByIdV7_(sh,id);if(!row)throw new Error('ไม่พบข้อโต้แย้ง');const r=sh.getRange(row,1,1,11).getValues()[0];sh.getRange(row,7).setValue(dec);sh.getRange(row,9).setValue(new Date());sh.getRange(row,10).setValue('ADMIN');sh.getRange(row,11).setValue(String(payload.note||''));addNotificationV7_('EMPLOYEE',String(r[3]),'ผลตรวจสอบค่าแรง',String(payload.note||dec),'INFO','PAYROLL_DISPUTE',id);auditLogV7_('ADMIN','ADMIN','REVIEW_PAYROLL_DISPUTE','PAYROLL_DISPUTE',id,{status:String(r[6])},{status:dec},String(payload.note||''),String(payload.requestId||''));return{ok:true}}

function adminCreatePayrollReviewBatchV7_(payload){
  const token=String(payload.adminToken||'');requireAdmin_(token);
  const items=Array.isArray(payload.items)?payload.items:[];
  if(!items.length)throw new Error('ไม่พบรายการพนักงานที่เลือก');
  const startDate=String(payload.startDate||''),endDate=String(payload.endDate||''),payDate=String(payload.payDate||'');
  if(!startDate||!endDate)throw new Error('ไม่พบช่วงรอบเงินเดือน');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const rows=[],errors=[];
    items.forEach((item,i)=>{
      const employeeId=String(item&&item.employeeId||'').trim();
      if(!employeeId){errors.push({index:i,error:'ไม่พบรหัสพนักงาน'});return}
      try{
        const r=adminCreatePayrollReviewV7_({adminToken:token,employeeId:employeeId,startDate:startDate,endDate:endDate,payDate:payDate,requestId:String(payload.requestId||'')+'-'+i});
        const snap=payrollSnapshotRowsV7_(employeeId,r.preview&&r.preview.periodKey||'').find(x=>x.snapshotId===r.snapshotId)||null;
        rows.push(snap||{snapshotId:r.snapshotId,employeeId:employeeId,status:'REVIEW'});
      }catch(err){errors.push({employeeId:employeeId,error:err&&err.message?err.message:String(err)})}
    });
    if(!rows.length&&errors.length)throw new Error(errors.map(x=>(x.employeeId||'#'+x.index)+': '+x.error).join(' | '));
    return{ok:true,createdOrUpdated:rows.length,failed:errors.length,rows:rows,errors:errors,serverEpochMs:Date.now()}
  }finally{try{lock.releaseLock()}catch(e){}}
}

function adminFinalizePayrollV7_(payload){
  requireAdmin_(String(payload.adminToken||''));
  const id=String(payload.snapshotId||''),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_SNAPSHOTS_SHEET),row=findRowByIdV7_(sh,id);
  if(!row)throw new Error('ไม่พบ Snapshot');
  const r=sh.getRange(row,1,1,19).getValues()[0],status=String(r[6]||''),response=String(r[16]||'').toUpperCase();
  if(status!=='REVIEW')throw new Error('ยืนยัน FINAL ได้เฉพาะรายการสถานะ REVIEW');
  if(response!=='ACCEPT')throw new Error('พนักงานยังไม่ได้กดข้อมูลถูกต้อง');
  const open=payrollDisputeRowsV7_(String(r[2]),'OPEN').some(x=>x.snapshotId===id);if(open)throw new Error('ยังมีข้อโต้แย้งค่าแรงที่ยังไม่ปิด');
  const now=new Date();sh.getRange(row,7).setValue('FINAL');sh.getRange(row,14).setValue(now);sh.getRange(row,19).setValue(now);
  lockPayrollAdjustmentsV7_(String(r[1]),String(r[2]));
  addNotificationV7_('EMPLOYEE',String(r[2]),'ยอดค่าแรงยืนยันแล้ว','ยอดสุทธิ '+Number(r[9]||0)+' บาท','SUCCESS','PAYROLL',id);
  auditLogV7_('ADMIN','ADMIN','FINALIZE_PAYROLL','PAYROLL_SNAPSHOT',id,{status:status,employeeResponse:response},{status:'FINAL'},'',String(payload.requestId||''));
  return{ok:true,snapshotId:id,status:'FINAL'}
}

function adminFinalizePayrollBatchV7_(payload){
  const token=String(payload.adminToken||'');requireAdmin_(token);
  const ids=(Array.isArray(payload.snapshotIds)?payload.snapshotIds:[]).map(String).filter(Boolean);
  if(!ids.length)throw new Error('ไม่พบรายการที่เลือกสำหรับ FINAL');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const done=[],errors=[];
    ids.forEach((id,i)=>{try{adminFinalizePayrollV7_({adminToken:token,snapshotId:id,requestId:String(payload.requestId||'')+'-'+i});done.push(id)}catch(err){errors.push({snapshotId:id,error:err&&err.message?err.message:String(err)})}});
    if(!done.length&&errors.length)throw new Error(errors.map(x=>x.snapshotId+': '+x.error).join(' | '));
    return{ok:true,finalized:done.length,failed:errors.length,snapshotIds:done,errors:errors,serverEpochMs:Date.now()}
  }finally{try{lock.releaseLock()}catch(e){}}
}

function adminMarkPayrollPaidV7_(payload){
  requireAdmin_(String(payload.adminToken||''));
  const id=String(payload.snapshotId||''),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_SNAPSHOTS_SHEET),row=findRowByIdV7_(sh,id);
  if(!row)throw new Error('ไม่พบ Snapshot');
  const r=sh.getRange(row,1,1,19).getValues()[0];if(String(r[6])!=='FINAL')throw new Error('ต้อง Final ยอดก่อนจ่าย');
  const ref=String(payload.reference||payload.paidReference||''),now=new Date();
  sh.getRange(row,7).setValue('PAID');sh.getRange(row,15).setValue(now);sh.getRange(row,16).setValue(ref);sh.getRange(row,19).setValue(now);
  addNotificationV7_('EMPLOYEE',String(r[2]),'จ่ายค่าแรงแล้ว','ยอด '+Number(r[9]||0)+' บาท'+(ref?' • '+ref:''),'SUCCESS','PAYROLL',id);
  auditLogV7_('ADMIN','ADMIN','MARK_PAYROLL_PAID','PAYROLL_SNAPSHOT',id,{status:'FINAL'},{status:'PAID',reference:ref},'',String(payload.requestId||''));
  return{ok:true,snapshotId:id,status:'PAID'}
}

function adminMarkPayrollPaidBatchV7_(payload){
  const token=String(payload.adminToken||'');requireAdmin_(token);
  const ids=(Array.isArray(payload.snapshotIds)?payload.snapshotIds:[]).map(String).filter(Boolean),ref=String(payload.paidReference||payload.reference||'');
  if(!ids.length)throw new Error('ไม่พบรายการที่เลือกสำหรับบันทึกจ่ายแล้ว');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const done=[],errors=[];
    ids.forEach((id,i)=>{try{adminMarkPayrollPaidV7_({adminToken:token,snapshotId:id,reference:ref,requestId:String(payload.requestId||'')+'-'+i});done.push(id)}catch(err){errors.push({snapshotId:id,error:err&&err.message?err.message:String(err)})}});
    if(!done.length&&errors.length)throw new Error(errors.map(x=>x.snapshotId+': '+x.error).join(' | '));
    return{ok:true,paid:done.length,failed:errors.length,snapshotIds:done,errors:errors,serverEpochMs:Date.now()}
  }finally{try{lock.releaseLock()}catch(e){}}
}

function lockPayrollAdjustmentsV7_(periodKey,employeeId){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PAYROLL_ADJUSTMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return;const vals=sh.getRange(2,1,last-1,13).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][1])===periodKey&&String(vals[i][2])===employeeId)sh.getRange(i+2,13).setValue(true)}
function findRowByIdV7_(sh,id){if(!sh||sh.getLastRow()<2)return 0;const vals=sh.getRange(2,1,sh.getLastRow()-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(id))return i+2;return 0}

function portalRequestShiftSwapV7_(payload){const e=requirePortalV7_(payload.portalToken),dateKey=Utilities.formatDate(parseIsoDate_(payload.date),TZ,'yyyy-MM-dd'),target=employeeRecordV7_(String(payload.targetEmployeeId||''));if(!target||target.id===e.id)throw new Error('พนักงานปลายทางไม่ถูกต้อง');const a=latestPublishedScheduleItemV7_(e.id,dateKey),b=latestPublishedScheduleItemV7_(target.id,dateKey);if(!a||!b)throw new Error('ทั้งสองคนต้องมีตารางที่ประกาศแล้วในวันดังกล่าว');if(a.branchCode!==b.branchCode||a.departmentCode!==b.departmentCode)throw new Error('สลับกะได้เฉพาะสาขา/แผนกเดียวกัน');const id='SWP-'+Utilities.getUuid().slice(0,10).toUpperCase(),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_SWAP_REQUESTS_SHEET);sh.appendRow([id,e.id,target.id,parseIsoDate_(dateKey),a.shiftCode,b.shiftCode,'PENDING_PEER',String(payload.reason||''),new Date(),'','','','',a.branchCode,a.departmentCode]);addNotificationV7_('EMPLOYEE',target.id,'มีคำขอสลับกะ',e.name+' ขอแลกกะวันที่ '+dateKey,'INFO','SHIFT_SWAP',id);return{ok:true,swapId:id}}
function swapRowsV7_(employeeId,status){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_SWAP_REQUESTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];const st=String(status||'ALL').toUpperCase();return sh.getRange(2,1,last-1,15).getValues().reverse().filter(r=>(!employeeId||String(r[1])===employeeId||String(r[2])===employeeId)&&(st==='ALL'||String(r[6])===st)).map(r=>({swapId:String(r[0]),requesterId:String(r[1]),targetEmployeeId:String(r[2]),date:formatDateInputForClient_(r[3]),requesterShift:String(r[4]),targetShift:String(r[5]),status:String(r[6]),reason:String(r[7]||''),submittedAt:formatDateTimeForClient_(r[8]),branchCode:String(r[13]||''),departmentCode:String(r[14]||'')}))}
function portalGetShiftSwapRequestsV7_(payload){const e=requirePortalV7_(payload.portalToken);return{rows:swapRowsV7_(e.id,String(payload.status||'ALL'))}}
function portalRespondShiftSwapV7_(payload){const e=requirePortalV7_(payload.portalToken),id=String(payload.swapId||''),accept=Boolean(payload.accept),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_SWAP_REQUESTS_SHEET),row=findRowByIdV7_(sh,id);if(!row)throw new Error('ไม่พบคำขอ');const r=sh.getRange(row,1,1,15).getValues()[0];if(String(r[2])!==e.id)throw new Error('ไม่มีสิทธิ์ตอบคำขอนี้');if(String(r[6])!=='PENDING_PEER')throw new Error('คำขอนี้ถูกตอบแล้ว');sh.getRange(row,7).setValue(accept?'PENDING_MANAGER':'PEER_REJECTED');sh.getRange(row,10).setValue(new Date());if(accept)notifyManagersForScopeV7_(String(r[13]),String(r[14]),'คำขอสลับกะรออนุมัติ','วันที่ '+formatDateInputForClient_(r[3]),'INFO','SHIFT_SWAP',id);return{ok:true,status:accept?'PENDING_MANAGER':'PEER_REJECTED'}}
function managerGetShiftSwapRequestsV7_(payload){const e=requirePortalV7_(payload.portalToken,['SUPERVISOR','MANAGER','ADMIN']),scopes=managerScopesForEmployeeV7_(e.id).filter(s=>s.canManageSchedule!==false),rows=swapRowsV7_('',String(payload.status||'PENDING_MANAGER')).filter(r=>scopes.some(s=>(s.branchCode==='*'||s.branchCode===r.branchCode)&&(s.departmentCode==='*'||s.departmentCode===r.departmentCode)));return{rows:rows}}
function managerReviewShiftSwapV7_(payload){const id=String(payload.swapId||''),rows=swapRowsV7_('', 'ALL'),s=rows.find(x=>x.swapId===id);if(!s)throw new Error('ไม่พบคำขอ');const auth=requireManagerScopeV7_(payload.portalToken,s.branchCode,s.departmentCode,'canManageSchedule'),dec=String(payload.decision||'').toUpperCase();if(['APPROVED','REJECTED'].indexOf(dec)<0)throw new Error('สถานะไม่ถูกต้อง');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_SWAP_REQUESTS_SHEET),row=findRowByIdV7_(sh,id),r=sh.getRange(row,1,1,15).getValues()[0];if(String(r[6])!=='PENDING_MANAGER')throw new Error('คำขอยังไม่พร้อมให้ผู้จัดการอนุมัติ');if(dec==='APPROVED'){const week=weekStartKeyV7_(s.date),v=getOrCreateDraftVersionV7_(week,s.branchCode,s.departmentCode,auth.employee.id);upsertScheduleItemV7_(v,{date:s.date,employeeId:s.requesterId,shiftCode:s.targetShift,workStatus:'WORK',source:'SHIFT_SWAP',note:id},auth.employee.id);upsertScheduleItemV7_(v,{date:s.date,employeeId:s.targetEmployeeId,shiftCode:s.requesterShift,workStatus:'WORK',source:'SHIFT_SWAP',note:id},auth.employee.id);}sh.getRange(row,7).setValue(dec);sh.getRange(row,11).setValue(new Date());sh.getRange(row,12).setValue(auth.employee.id);sh.getRange(row,13).setValue(String(payload.note||''));[s.requesterId,s.targetEmployeeId].forEach(x=>addNotificationV7_('EMPLOYEE',x,dec==='APPROVED'?'อนุมัติสลับกะแล้ว':'ไม่อนุมัติสลับกะ',s.date,'INFO','SHIFT_SWAP',id));return{ok:true,status:dec}}

function managerGetStandbyV7_(payload){const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false);requireManagerScopeV7_(payload.portalToken,branch,dept,'canManageSchedule');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(STANDBY_ASSIGNMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(2,1,last-1,11).getValues().filter(r=>String(r[3])===branch&&String(r[4])===dept).map(r=>({standbyId:String(r[0]),date:formatDateInputForClient_(r[1]),employeeId:String(r[2]),branchCode:String(r[3]),departmentCode:String(r[4]),shiftCode:String(r[5]),status:String(r[6]),note:String(r[7]||'')}));return{rows:rows}}
function managerSaveStandbyV7_(payload){const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false),auth=requireManagerScopeV7_(payload.portalToken,branch,dept,'canManageSchedule'),emp=employeeRecordV7_(String(payload.employeeId||''));if(!emp)throw new Error('ไม่พบพนักงาน');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(STANDBY_ASSIGNMENTS_SHEET),id=String(payload.standbyId||'')||'STD-'+Utilities.getUuid().slice(0,10).toUpperCase(),row=findRowByIdV7_(sh,id),values=[id,parseIsoDate_(payload.date),emp.id,branch,dept,validateShiftV7_(payload.shiftCode,false),String(payload.status||'AVAILABLE'),String(payload.note||''),row?sh.getRange(row,9).getValue()||new Date():new Date(),auth.employee.id,new Date()];if(row)sh.getRange(row,1,1,11).setValues([values]);else sh.appendRow(values);return{ok:true,standbyId:id}}

function portalGetLeaveBalancesV7_(payload){const e=requirePortalV7_(payload.portalToken);return{rows:leaveBalanceRowsV7_(e.id,Number(payload.year)||new Date().getFullYear())}}
function leaveBalanceRowsV7_(employeeId,year){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_BALANCES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];return sh.getRange(2,1,last-1,10).getValues().filter(r=>String(r[1])===String(employeeId)&&Number(r[3])===Number(year)).map(r=>({balanceId:String(r[0]),employeeId:String(r[1]),leaveType:String(r[2]),year:Number(r[3]),entitledDays:Number(r[4])||0,usedDays:Number(r[5])||0,reservedDays:Number(r[6])||0,remainingDays:Number(r[7])||0,updatedAt:formatDateTimeForClient_(r[8]),note:String(r[9]||'')}))}
function adminSetLeaveBalanceV7_(payload){requireAdmin_(String(payload.adminToken||''));const emp=employeeRecordV7_(String(payload.employeeId||''));if(!emp)throw new Error('ไม่พบพนักงาน');const year=Number(payload.year)||new Date().getFullYear(),type=String(payload.leaveType||''),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_BALANCES_SHEET),last=sh.getLastRow(),vals=last>=2?sh.getRange(2,1,last-1,10).getValues():[],found=vals.findIndex(r=>String(r[1])===emp.id&&String(r[2])===type&&Number(r[3])===year),ent=Number(payload.entitledDays)||0,used=Number(payload.usedDays)||0,res=Number(payload.reservedDays)||0,remaining=ent-used-res,id=found>=0?String(vals[found][0]):'BAL-'+Utilities.getUuid().slice(0,10).toUpperCase(),row=[id,emp.id,type,year,ent,used,res,remaining,new Date(),String(payload.note||'')];if(found>=0)sh.getRange(found+2,1,1,10).setValues([row]);else sh.appendRow(row);return{ok:true,balanceId:id}}
function adminGetLeaveBalancesV7_(payload){requireAdmin_(String(payload.adminToken||''));return{rows:leaveBalanceRowsV7_(String(payload.employeeId||''),Number(payload.year)||new Date().getFullYear())}}

function adminGetOrgMastersV7_(payload){requireAdmin_(String(payload.adminToken||''));return{branches:getBranchesV7_(true),departments:getDepartmentsV7_(true),shifts:getShiftsV7_(true),devices:deviceRowsV7_(),serverEpochMs:Date.now()}}
function upsertMasterV7_(sheetName,idCol,id,values){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName),last=sh.getLastRow();let row=0;if(last>=2){const vals=sh.getRange(2,idCol,last-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(id)){row=i+2;break}}if(row)sh.getRange(row,1,1,values.length).setValues([values]);else sh.appendRow(values);return row||sh.getLastRow()}
function codeV7_(v,label){const s=String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'_').slice(0,30);if(!s)throw new Error('กรุณาระบุรหัส'+label);return s}
function adminSaveBranchV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.branch||{},code=codeV7_(x.code,'สาขา'),old=getBranchesV7_(true).find(b=>b.code===code)||null,now=new Date();upsertMasterV7_(BRANCHES_SHEET,1,code,[code,String(x.name||'').trim(),String(x.shortName||x.name||'').trim(),x.active!==false,Number(x.sort)||999,String(x.address||''),String(x.phone||''),String(x.timezone||TZ),old?old.createdAt||now:now,now,String(x.note||'')]);cacheRemoveV7_(masterCacheKeysV7_());auditLogV7_('ADMIN','ADMIN','SAVE_BRANCH','BRANCH',code,old,x,String(x.note||''),String(payload.requestId||''));return{ok:true,code:code}}
function adminSaveDepartmentV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.department||{},code=codeV7_(x.code,'แผนก'),now=new Date();upsertMasterV7_(DEPARTMENTS_SHEET,1,code,[code,String(x.name||'').trim(),String(x.shortName||x.name||'').trim(),x.active!==false,Number(x.sort)||999,now,now,String(x.note||''),String(x.color||'')]);cacheRemoveV7_(masterCacheKeysV7_());auditLogV7_('ADMIN','ADMIN','SAVE_DEPARTMENT','DEPARTMENT',code,'',x,String(x.note||''),String(payload.requestId||''));return{ok:true,code:code}}
function adminSaveShiftV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.shift||{},code=codeV7_(x.code,'กะ');if(!/^\d{2}:\d{2}$/.test(String(x.startTime||''))||!/^\d{2}:\d{2}$/.test(String(x.endTime||'')))throw new Error('เวลาเริ่ม/จบกะต้องเป็น HH:mm');upsertMasterV7_(SHIFTS_SHEET,1,code,[code,String(x.name||'').trim(),String(x.startTime),String(x.endTime),Boolean(x.crossMidnight),Number(x.standardHours)||12,Number(x.nightAllowance)||0,Number(x.minStaffing)||0,Number(x.lateGraceMinutes)||5,Number(x.lateDeduction)||0,x.active!==false,Number(x.sort)||999,String(x.color||''),String(x.note||'')]);cacheRemoveV7_(masterCacheKeysV7_());auditLogV7_('ADMIN','ADMIN','SAVE_SHIFT','SHIFT',code,'',x,String(x.note||''),String(payload.requestId||''));return{ok:true,code:code}}
function adminGetPermissionUsersV7_(payload){
  requireAdmin_(String(payload.adminToken||''));
  const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET),last=sh?sh.getLastRow():0;
  if(!sh||last<2)return{rows:[]};
  const rows=sh.getRange(2,1,last-1,Math.max(33,sh.getLastColumn())).getValues()
    .filter(r=>String(r[0]||'').trim())
    .map(r=>({
      id:String(r[0]||''),name:String(r[1]||''),active:r[2]!==false,sort:Number(r[3])||999,
      nickname:String(r[7]||''),branch:String(r[10]||''),position:String(r[13]||''),
      employmentStatus:String(r[24]||'ACTIVE'),department:String(r[31]||''),
      accessRole:String(r[32]||'').toUpperCase()||(String(r[13]||'').toUpperCase()==='MANAGER'?'MANAGER':'EMPLOYEE')
    }))
    .sort((a,b)=>a.sort-b.sort||String(a.name).localeCompare(String(b.name),'th'));
  return{rows:rows,serverEpochMs:Date.now()};
}
function adminSetEmployeeAccessRoleV7_(payload){requireAdmin_(String(payload.adminToken||''));const e=employeeRecordV7_(String(payload.employeeId||'')),role=String(payload.accessRole||'EMPLOYEE').toUpperCase();if(!e)throw new Error('ไม่พบพนักงาน');if(['EMPLOYEE','SUPERVISOR','MANAGER','ADMIN'].indexOf(role)<0)throw new Error('Role ไม่ถูกต้อง');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);sh.getRange(e.row,33).setValue(role);sh.getRange(e.row,6).setValue(new Date());auditLogV7_('ADMIN','ADMIN','SET_ACCESS_ROLE','EMPLOYEE',e.id,{accessRole:e.accessRole},{accessRole:role},String(payload.note||''),String(payload.requestId||''));invalidateAdminSummary_();return{ok:true}}
function adminGetManagerScopesV7_(payload){requireAdmin_(String(payload.adminToken||''));const employeeId=String(payload.employeeId||'').trim();if(employeeId)return{rows:managerScopesForEmployeeV7_(employeeId)};const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MANAGER_SCOPES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(2,1,last-1,11).getValues().map(r=>({scopeId:String(r[0]),employeeId:String(r[1]),branchCode:String(r[2]),departmentCode:String(r[3]),canApproveLeave:r[4]!==false,canManageSchedule:r[5]!==false,canViewAttendance:r[6]!==false,active:r[7]!==false,note:String(r[10]||'')}));return{rows:rows}}
function adminSaveManagerScopeV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.scope||{},emp=employeeRecordV7_(String(x.employeeId||''));if(!emp)throw new Error('ไม่พบพนักงาน');const branch=String(x.branchCode||'*');if(branch!=='*')validateBranchV7_(branch,false);const dept=String(x.departmentCode||'*');if(dept!=='*')validateDepartmentV7_(dept,false);const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MANAGER_SCOPES_SHEET),now=new Date();let id=String(x.scopeId||''),row=id?findRowByIdV7_(sh,id):0;if(!row){const last=sh?sh.getLastRow():0;if(last>=2){const rows=sh.getRange(2,1,last-1,11).getValues();for(let i=rows.length-1;i>=0;i--){if(String(rows[i][1])===emp.id&&String(rows[i][2]||'*')===branch&&String(rows[i][3]||'*')===dept&&rows[i][7]!==false){row=i+2;id=String(rows[i][0]||'');break}}}}if(!id)id='SCP-'+Utilities.getUuid().slice(0,10).toUpperCase();const vals=[id,emp.id,branch,dept,x.canApproveLeave!==false,x.canManageSchedule!==false,x.canViewAttendance!==false,x.active!==false,row?sh.getRange(row,9).getValue()||now:now,now,String(x.note||'')];if(row)sh.getRange(row,1,1,11).setValues([vals]);else sh.appendRow(vals);const last2=sh.getLastRow();if(last2>=2){const rows2=sh.getRange(2,1,last2-1,11).getValues();for(let i=0;i<rows2.length;i++){const rr=i+2;if(rr===row)continue;if(String(rows2[i][1])===emp.id&&String(rows2[i][2]||'*')===branch&&String(rows2[i][3]||'*')===dept&&rows2[i][7]!==false){sh.getRange(rr,8).setValue(false);sh.getRange(rr,10).setValue(now)}}}const requestedRole=String(x.accessRole||emp.accessRole||'MANAGER').toUpperCase(),savedRole=isManagerRoleV7_(requestedRole)?requestedRole:'MANAGER';const esh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET);esh.getRange(emp.row,33).setValue(savedRole);cacheRemoveV7_(['V7_SCOPES_'+emp.id]);invalidateAdminSummary_();auditLogV7_('ADMIN','ADMIN','SAVE_MANAGER_SCOPE','MANAGER_SCOPE',id,'',x,String(x.note||''),String(payload.requestId||''));return{ok:true,scopeId:id}}
function adminDeleteManagerScopeV7_(payload){requireAdmin_(String(payload.adminToken||''));const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MANAGER_SCOPES_SHEET),row=findRowByIdV7_(sh,String(payload.scopeId||''));if(!row)throw new Error('ไม่พบ Scope');const eid=String(sh.getRange(row,2).getValue()||'');sh.getRange(row,8).setValue(false);sh.getRange(row,10).setValue(new Date());cacheRemoveV7_(['V7_SCOPES_'+eid]);return{ok:true}}
function adminGetLeaveQuotaRulesV7_(payload){requireAdmin_(String(payload.adminToken||''));const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_QUOTA_RULES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(2,1,last-1,14).getValues().map(r=>({ruleId:String(r[0]),branchCode:String(r[1]),departmentCode:String(r[2]),shiftCode:String(r[3]),maxOff:Number(r[4]),minStaffing:Number(r[5])||0,minLeadDays:Number(r[6])||0,blackout:Boolean(r[7]),effectiveStart:formatDateInputForClient_(r[8]),effectiveEnd:formatDateInputForClient_(r[9]),active:r[10]!==false,priority:Number(r[11])||0,note:String(r[12]||'')}));return{rows:rows}}
function adminSaveLeaveQuotaRuleV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.rule||{},branch=String(x.branchCode||'*'),dept=String(x.departmentCode||'*'),shift=String(x.shiftCode||'*');if(branch!=='*')validateBranchV7_(branch,false);if(dept!=='*')validateDepartmentV7_(dept,false);if(shift!=='*')validateShiftV7_(shift,false);const id=String(x.ruleId||'')||'QTA-'+Utilities.getUuid().slice(0,10).toUpperCase(),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEAVE_QUOTA_RULES_SHEET),row=findRowByIdV7_(sh,id),vals=[id,branch,dept,shift,Number(x.maxOff),Number(x.minStaffing)||0,Number(x.minLeadDays)||0,Boolean(x.blackout),x.effectiveStart?parseIsoDate_(x.effectiveStart):'',x.effectiveEnd?parseIsoDate_(x.effectiveEnd):'',x.active!==false,Number(x.priority)||0,String(x.note||''),new Date()];if(row)sh.getRange(row,1,1,14).setValues([vals]);else sh.appendRow(vals);auditLogV7_('ADMIN','ADMIN','SAVE_LEAVE_QUOTA','LEAVE_QUOTA',id,'',x,String(x.note||''),String(payload.requestId||''));return{ok:true,ruleId:id}}

function portalHomeBootstrapV7_(payload){
  const e=requirePortalV7_(payload.portalToken),todayKey=Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'),end=new Date(parseIsoDate_(todayKey));end.setDate(end.getDate()+6);const endKey=Utilities.formatDate(end,TZ,'yyyy-MM-dd');
  const bootstrap={employee:portalEmployeeSafeV7_(e),branches:getBranchesV7_(false),departments:getDepartmentsV7_(false),shifts:getShiftsV7_(false),scopes:e.accessRole==='MANAGER'?managerScopesForEmployeeV7_(e.id):[],notifications:unreadNotificationCountV7_(e.id),serverEpochMs:Date.now()};
  const schedule=portalGetScheduleV7_({portalToken:payload.portalToken,startDate:todayKey,endDate:endKey});
  let attendance={rows:[]};try{attendance=portalGetAttendanceV7_({portalToken:payload.portalToken,startDate:todayKey,endDate:todayKey})}catch(err){}
  return {bootstrap:bootstrap,schedule:schedule.rows||[],attendance:attendance.rows||[],serverEpochMs:Date.now()};
}
function managerDashboardBundleV7_(payload){
  const summary=managerSummaryV7_(payload),scopes=summary.scopes||[];let branch=String(payload.branchCode||''),dept=String(payload.departmentCode||'');
  if(!branch){const s=scopes.find(x=>x.branchCode!=='*')||scopes[0];branch=s?s.branchCode:''}if(!dept){const s=scopes.find(x=>(x.branchCode==='*'||x.branchCode===branch)&&x.departmentCode!=='*')||scopes.find(x=>x.departmentCode!=='*')||scopes[0];dept=s?s.departmentCode:''}
  const data={summary:summary,branchCode:branch,departmentCode:dept,team:[],leave:[],corrections:[],swaps:[],daily:[]};if(branch&&dept){data.team=managerGetTeamV7_({portalToken:payload.portalToken,branchCode:branch,departmentCode:dept}).rows||[];data.leave=managerGetLeaveRequestsV7_({portalToken:payload.portalToken,status:'PENDING'}).rows||[];data.corrections=managerGetAttendanceCorrectionsV7_({portalToken:payload.portalToken,status:'PENDING'}).rows||[];data.swaps=managerGetShiftSwapRequestsV7_({portalToken:payload.portalToken,status:'PENDING_MANAGER'}).rows||[];data.daily=managerGetDailyChecksV7_({portalToken:payload.portalToken}).rows||[]}return data;
}
function managerScheduleBundleV7_(payload){
  const e=requirePortalV7_(payload.portalToken,['SUPERVISOR','MANAGER','ADMIN']),scopes=managerScopesForEmployeeV7_(e.id);let branch=String(payload.branchCode||''),dept=String(payload.departmentCode||'');if(!branch){const s=scopes.find(x=>x.branchCode!=='*')||scopes[0];branch=s?s.branchCode:''}if(!dept){const s=scopes.find(x=>(x.branchCode==='*'||x.branchCode===branch)&&x.departmentCode!=='*')||scopes.find(x=>x.departmentCode!=='*')||scopes[0];dept=s?s.departmentCode:''}const week=weekStartKeyV7_(payload.weekStart||Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'));
  const out={employee:portalEmployeeSafeV7_(e),scopes:scopes,shifts:getShiftsV7_(false),branchCode:branch,departmentCode:dept,team:[],schedule:{version:null,items:[],publishedVersion:null},leaves:[]};if(branch&&dept){out.team=managerGetTeamV7_({portalToken:payload.portalToken,branchCode:branch,departmentCode:dept}).rows||[];out.schedule=managerGetScheduleV7_({portalToken:payload.portalToken,branchCode:branch,departmentCode:dept,weekStart:week});const all=leaveRowsV7_({status:'ALL'}).rows;out.leaves=all.filter(x=>['PENDING','APPROVED'].indexOf(x.status)>=0&&x.branchCode===branch&&x.departmentCode===dept)}return out;
}

function managerSummaryV7_(payload){const e=requirePortalV7_(payload.portalToken,['SUPERVISOR','MANAGER','ADMIN']),scopes=managerScopesForEmployeeV7_(e.id),pendingLeave=managerGetLeaveRequestsV7_({portalToken:payload.portalToken,status:'PENDING'}).rows.length,pendingCorrections=managerGetAttendanceCorrectionsV7_({portalToken:payload.portalToken,status:'PENDING'}).rows.length,pendingSwaps=managerGetShiftSwapRequestsV7_({portalToken:payload.portalToken,status:'PENDING_MANAGER'}).rows.length;return{employee:portalEmployeeSafeV7_(e),scopes:scopes,pendingLeave:pendingLeave,pendingCorrections:pendingCorrections,pendingSwaps:pendingSwaps,serverEpochMs:Date.now()}}
function managerGetTeamV7_(payload){const branch=validateBranchV7_(payload.branchCode,false),dept=validateDepartmentV7_(payload.departmentCode,false);requireManagerScopeV7_(payload.portalToken,branch,dept,'canViewAttendance');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(2,1,last-1,33).getValues().filter(r=>r[2]!==false&&String(r[10])===branch&&String(r[31])===dept).map(r=>({id:String(r[0]),name:String(r[1]),nickname:String(r[7]||''),position:String(r[13]||''),branch:String(r[10]),department:String(r[31]||'')}));return{rows:rows}}

function deviceRowsV7_(){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DEVICES_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];return sh.getRange(2,1,last-1,7).getValues().map(r=>({deviceId:String(r[0]),branchCode:String(r[1]||''),label:String(r[2]||''),active:r[3]!==false,registeredAt:formatDateTimeForClient_(r[4]),updatedAt:formatDateTimeForClient_(r[5]),note:String(r[6]||'')}))}
function deviceBranchV7_(deviceId){const x=deviceRowsV7_().find(d=>d.deviceId===String(deviceId||'')&&d.active);return x?x.branchCode:''}
function adminGetDevicesV7_(payload){requireAdmin_(String(payload.adminToken||''));return{rows:deviceRowsV7_()}}
function adminSaveDeviceV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.device||{},id=String(x.deviceId||'').trim();if(!id)throw new Error('ไม่พบ Device ID');const branch=String(x.branchCode||'');if(branch)validateBranchV7_(branch,false);const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(DEVICES_SHEET),row=findRowByIdV7_(sh,id),now=new Date(),vals=[id,branch,String(x.label||id),x.active!==false,row?sh.getRange(row,5).getValue()||now:now,now,String(x.note||'')];if(row)sh.getRange(row,1,1,7).setValues([vals]);else sh.appendRow(vals);return{ok:true}}

function runShiftMonitoring_(){
  setupWorkforceSystem_();const now=new Date(),dateKeys=[Utilities.formatDate(now,TZ,'yyyy-MM-dd')],y=new Date(now);y.setDate(y.getDate()-1);dateKeys.push(Utilities.formatDate(y,TZ,'yyyy-MM-dd'));const target=Number(getSetting_('SHIFT_CHECK_TARGET_MINUTES'))||25,endDelay=Number(getSetting_('END_SHIFT_CHECK_DELAY_MINUTES'))||30;
  dateKeys.forEach(dateKey=>{const versions=scheduleVersionRowsV7_().filter(v=>v.status==='PUBLISHED'&&v.weekStart===weekStartKeyV7_(dateKey));versions.forEach(v=>{const items=scheduleItemsForVersionV7_(v.versionId).filter(x=>x.date===dateKey&&x.workStatus==='WORK'),byShift={};items.forEach(x=>{if(!byShift[x.shiftCode])byShift[x.shiftCode]=[];byShift[x.shiftCode].push(x)});Object.keys(byShift).forEach(code=>{const win=shiftWindowV7_(dateKey,code),minsFromStart=(now-win.start)/60000,minsFromEnd=(now-win.end)/60000;if(minsFromStart>=target&&minsFromStart<target+15)createShiftCheckIfMissingV7_('START',dateKey,v,code,byShift[code],now);if(minsFromEnd>=endDelay&&minsFromEnd<endDelay+15)createShiftCheckIfMissingV7_('END',dateKey,v,code,byShift[code],now)})})});
}
function createShiftCheckIfMissingV7_(type,dateKey,version,shiftCode,items,now){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_DAILY_CHECKS_SHEET),last=sh?sh.getLastRow():0;if(last>=2){const vals=sh.getRange(2,1,last-1,7).getValues();if(vals.some(r=>String(r[1])===type&&attendanceDateKey_(r[2])===dateKey&&String(r[3])===version.branchCode&&String(r[4])===version.departmentCode&&String(r[5])===shiftCode&&String(r[6])===version.versionId))return}
  const win=shiftWindowV7_(dateKey,shiftCode),leaveCount=items.filter(x=>{const l=scheduleLeaveLockV7_(x.employeeId,dateKey);return l&&l.status==='APPROVED'}).length,expected=items.length,required=Math.max(0,expected-leaveCount),present=[],late=[],missing=[],expectedIds={};items.forEach(x=>expectedIds[x.employeeId]=x);
  const att=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ATTENDANCE_SHEET),attLast=att?att.getLastRow():0,unplanned=[];if(att&&attLast>=2){const vals=att.getRange(2,1,attLast-1,Math.min(19,att.getLastColumn())).getValues();vals.forEach(r=>{if(actionKindServer_(r[6])!=='IN'||String(r[11]).indexOf('VOID')===0)return;const ts=r[1] instanceof Date?r[1]:null;if(!ts)return;if(ts<new Date(win.start.getTime()-4*3600000)||ts>new Date(win.end.getTime()+2*3600000))return;const id=String(r[4]||'');if(expectedIds[id]){if(!present.some(x=>x.employeeId===id)){const min=Math.floor((ts-win.start)/60000),grace=win.shift.lateGraceMinutes||5,p={employeeId:id,name:String(r[5]||''),time:Utilities.formatDate(ts,TZ,'HH:mm:ss'),lateMinutes:Math.max(0,min),actualBranch:String(r[16]||'')};present.push(p);if(min>grace)late.push(p)}}else{const e=employeeRecordV7_(id),actualBranch=String(r[16]||'')||e&&e.branch||'';if(e&&e.department===version.departmentCode&&(actualBranch===version.branchCode||e.branch===version.branchCode)&&!unplanned.some(x=>x.employeeId===id))unplanned.push({employeeId:id,name:e.name,time:Utilities.formatDate(ts,TZ,'HH:mm:ss')})}})}
  items.forEach(x=>{const leave=scheduleLeaveLockV7_(x.employeeId,dateKey);if(leave&&leave.status==='APPROVED')return;if(!present.some(p=>p.employeeId===x.employeeId))missing.push({employeeId:x.employeeId,name:x.employeeName})});const rule=matchingLeaveQuotaRuleV7_(version.branchCode,version.departmentCode,shiftCode,dateKey),minimum=Math.max(Number(win.shift.minStaffing)||0,Number(rule&&rule.minStaffing)||0),status=present.length<minimum||missing.length?'ACTION_REQUIRED':'OK',detail={expected:items.map(x=>({employeeId:x.employeeId,name:x.employeeName})),present:present,late:late,missing:missing,unplanned:unplanned};const id='CHK-'+Utilities.getUuid().slice(0,10).toUpperCase();sh.appendRow([id,type,parseIsoDate_(dateKey),version.branchCode,version.departmentCode,shiftCode,version.versionId,expected,leaveCount,required,present.length,late.length,missing.length,unplanned.length,minimum,status,jsonCellV7_(detail),now,'','','']);const title=(type==='START'?'สรุปหลังกะเริ่ม':'สรุปหลังจบกะ')+' '+shiftCode,message='ตามตาราง '+expected+' • ควรมา '+required+' • มาแล้ว '+present.length+' • ยังไม่พบเวลาเข้า '+missing.length+(present.length<minimum?' • ต่ำกว่า Minimum '+minimum:'');notifyManagersForScopeV7_(version.branchCode,version.departmentCode,title,message,status==='OK'?'INFO':'CRITICAL','SHIFT_CHECK',id)}
function managerGetDailyChecksV7_(payload){const e=requirePortalV7_(payload.portalToken,['SUPERVISOR','MANAGER','ADMIN']),scopes=managerScopesForEmployeeV7_(e.id),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_DAILY_CHECKS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const rows=sh.getRange(Math.max(2,last-199),1,last-Math.max(2,last-199)+1,21).getValues().reverse().filter(r=>scopes.some(s=>(s.branchCode==='*'||s.branchCode===String(r[3]))&&(s.departmentCode==='*'||s.departmentCode===String(r[4])))).map(r=>({checkId:String(r[0]),checkType:String(r[1]),date:formatDateInputForClient_(r[2]),branchCode:String(r[3]),departmentCode:String(r[4]),shiftCode:String(r[5]),expectedCount:Number(r[7])||0,leaveCount:Number(r[8])||0,requiredCount:Number(r[9])||0,presentCount:Number(r[10])||0,lateCount:Number(r[11])||0,missingCount:Number(r[12])||0,unplannedCount:Number(r[13])||0,minimumStaffing:Number(r[14])||0,status:String(r[15]),detail:parseJsonV7_(r[16]),createdAt:formatDateTimeForClient_(r[17]),resolvedAt:formatDateTimeForClient_(r[18]),resolvedBy:String(r[19]||''),resolutionNote:String(r[20]||'')}));return{rows:rows}}
function managerResolveDailyCheckV7_(payload){const id=String(payload.checkId||''),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHIFT_DAILY_CHECKS_SHEET),row=findRowByIdV7_(sh,id);if(!row)throw new Error('ไม่พบรายงาน');const r=sh.getRange(row,1,1,21).getValues()[0],auth=requireManagerScopeV7_(payload.portalToken,String(r[3]),String(r[4]),'canViewAttendance');sh.getRange(row,16).setValue('RESOLVED');sh.getRange(row,19).setValue(new Date());sh.getRange(row,20).setValue(auth.employee.id);sh.getRange(row,21).setValue(String(payload.note||''));auditLogV7_('MANAGER',auth.employee.id,'RESOLVE_SHIFT_CHECK','SHIFT_CHECK',id,{status:String(r[15])},{status:'RESOLVED'},String(payload.note||''),String(payload.requestId||''));return{ok:true}}
function parseJsonV7_(v){try{return JSON.parse(String(v||'{}'))}catch(e){return{}}}

function employeeDocumentsMetaV7_(employeeId){const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_DOCUMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return[];const cols=Math.min(16,sh.getLastColumn());return sh.getRange(2,1,last-1,cols).getValues().filter(r=>String(r[2])===String(employeeId)&&String(r[10]||'ACTIVE')!=='DELETED').map(r=>({documentId:String(r[0]),type:String(r[3]),label:String(r[4]),fileName:String(r[5]),status:String(r[10]),expiryDate:formatDateInputForClient_(r[12]),required:Boolean(r[13]),verifiedAt:formatDateTimeForClient_(r[14]),verifiedBy:String(r[15]||'')}))}
function adminUpdateDocumentMetaV7_(payload){requireAdmin_(String(payload.adminToken||''));const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_DOCUMENTS_SHEET),row=findRowByIdV7_(sh,String(payload.documentId||''));if(!row)throw new Error('ไม่พบเอกสาร');if(sh.getMaxColumns()<16)setupWorkforceSystem_();sh.getRange(row,13).setValue(payload.expiryDate?parseIsoDate_(payload.expiryDate):'');sh.getRange(row,14).setValue(Boolean(payload.required));if(payload.verified){sh.getRange(row,15).setValue(new Date());sh.getRange(row,16).setValue('ADMIN')}return{ok:true}}

function adminSaveNotificationChannelV7_(payload){requireAdmin_(String(payload.adminToken||''));const x=payload.channel||{},emp=employeeRecordV7_(String(x.employeeId||''));if(!emp)throw new Error('ไม่พบพนักงาน');const type=String(x.channelType||'LINE_USER_ID'),id=String(x.channelId||'')||'CHN-'+Utilities.getUuid().slice(0,10).toUpperCase(),sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(NOTIFICATION_CHANNELS_SHEET),row=findRowByIdV7_(sh,id),now=new Date(),vals=[id,emp.id,type,String(x.channelAddress||''),x.active!==false,row?sh.getRange(row,6).getValue()||now:now,now,String(x.note||'')];if(row)sh.getRange(row,1,1,8).setValues([vals]);else sh.appendRow(vals);return{ok:true,channelId:id}}

function adminGetAuditLogV7_(payload){requireAdmin_(String(payload.adminToken||''));const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(AUDIT_LOG_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2)return{rows:[]};const n=Math.max(1,Math.min(Number(payload.limit)||100,500)),start=Math.max(2,last-n+1);const rows=sh.getRange(start,1,last-start+1,11).getValues().reverse().map(r=>({auditId:String(r[0]),timestamp:formatDateTimeForClient_(r[1]),actorType:String(r[2]),actorId:String(r[3]),action:String(r[4]),entityType:String(r[5]),entityId:String(r[6]),before:parseJsonV7_(r[7]),after:parseJsonV7_(r[8]),reason:String(r[9]||''),requestId:String(r[10]||'')}));return{rows:rows}}

function runDailyBackup_(){setupWorkforceSystem_();const props=PropertiesService.getScriptProperties(),key='BACKUP_FOLDER_ID',name='Krua Flow Backups';let folder=null;const id=props.getProperty(key);if(id)try{folder=DriveApp.getFolderById(id)}catch(e){}if(!folder){const it=DriveApp.getFoldersByName(name);folder=it.hasNext()?it.next():DriveApp.createFolder(name);props.setProperty(key,folder.getId())}const stamp=Utilities.formatDate(new Date(),TZ,'yyyyMMdd-HHmmss'),copy=DriveApp.getFileById(SPREADSHEET_ID).makeCopy('Krua Flow Attendance Backup '+stamp,folder),log=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BACKUP_LOG_SHEET),bid='BKP-'+Utilities.getUuid().slice(0,10).toUpperCase();log.appendRow([bid,new Date(),copy.getId(),copy.getUrl(),'SUCCESS','SYSTEM','']);const keep=Number(getSetting_('BACKUP_RETENTION_DAYS'))||30,cut=new Date();cut.setDate(cut.getDate()-keep);const files=folder.getFiles();while(files.hasNext()){const f=files.next();if(f.getDateCreated()<cut)try{f.setTrashed(true)}catch(e){}}return{ok:true,backupId:bid,fileId:copy.getId(),fileUrl:copy.getUrl()}}
function runDailyMaintenance_(){setupWorkforceSystem_();notifyExpiringDocumentsV7_();}
function notifyExpiringDocumentsV7_(){const days=Number(getSetting_('DOCUMENT_EXPIRY_WARNING_DAYS'))||30,sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_DOCUMENTS_SHEET),last=sh?sh.getLastRow():0;if(!sh||last<2||sh.getLastColumn()<13)return;const now=new Date(),limit=new Date(now);limit.setDate(limit.getDate()+days);sh.getRange(2,1,last-1,Math.min(16,sh.getLastColumn())).getValues().forEach(r=>{const exp=r[12] instanceof Date?r[12]:null,eid=String(r[2]||'');if(!exp||!eid)return;if(exp>=now&&exp<=limit)addNotificationV7_('EMPLOYEE',eid,'เอกสารใกล้หมดอายุ',String(r[4]||r[3]||'เอกสาร')+' หมดอายุ '+Utilities.formatDate(exp,TZ,'dd/MM/yyyy'),'WARNING','DOCUMENT',String(r[0]))})}
function installAutomationTriggers(){const handlers=['runShiftMonitoring_','runDailyBackup_','runDailyMaintenance_'];ScriptApp.getProjectTriggers().forEach(t=>{if(handlers.indexOf(t.getHandlerFunction())>=0)ScriptApp.deleteTrigger(t)});ScriptApp.newTrigger('runShiftMonitoring_').timeBased().everyMinutes(5).create();ScriptApp.newTrigger('runDailyBackup_').timeBased().everyDays(1).atHour(2).create();ScriptApp.newTrigger('runDailyMaintenance_').timeBased().everyDays(1).atHour(7).create();return{ok:true,message:'ติดตั้ง Trigger แล้ว'}}
function adminInstallTriggersV7_(payload){requireAdmin_(String(payload.adminToken||''));return installAutomationTriggers()}
function adminBackupNowV7_(payload){requireAdmin_(String(payload.adminToken||''));const r=runDailyBackup_();auditLogV7_('ADMIN','ADMIN','BACKUP_NOW','BACKUP',r.backupId,'',r,'',String(payload.requestId||''));return r}

function adminOffboardEmployeeV7_(payload){requireAdmin_(String(payload.adminToken||''));const e=employeeRecordV7_(String(payload.employeeId||''));if(!e)throw new Error('ไม่พบพนักงาน');const sh=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(EMPLOYEE_SHEET),date=payload.lastWorkingDate?parseIsoDate_(payload.lastWorkingDate):new Date();sh.getRange(e.row,18).setValue(date).setNumberFormat('dd/mm/yyyy');sh.getRange(e.row,25).setValue('RESIGNED');sh.getRange(e.row,3).setValue(false);sh.getRange(e.row,6).setValue(new Date());auditLogV7_('ADMIN','ADMIN','OFFBOARD_EMPLOYEE','EMPLOYEE',e.id,{active:e.active,status:e.employmentStatus},{active:false,status:'RESIGNED',lastWorkingDate:formatDateInputForClient_(date)},String(payload.reason||''),String(payload.requestId||''));return{ok:true}}

// A manager can see only scoped operational information, never other employees' payroll/bank data.
function managerGetPayrollDeniedV7_(){throw new Error('Manager ไม่มีสิทธิ์ดู Payroll ของพนักงานคนอื่น')}