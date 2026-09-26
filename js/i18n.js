(function (global) {
  'use strict';

  const STORAGE_KEY = 'kruaflow.language.v1';
  const dictionaries = {
    th: {
      'app.name': 'KruaFlow ระบบบุคลากร',
      'app.uat': 'ระบบทดสอบ',
      'environment.staging': 'ระบบทดสอบ',
      'environment.production': 'ระบบใช้งานจริง',
      'language.th': 'ไทย',
      'language.en': 'อังกฤษ',
      'language.label': 'เลือกภาษา',
      'workspace.navigation': 'เมนูระบบบุคลากร',
      'workspace.content': 'เนื้อหาระบบบุคลากร',
      'auth.title': 'เข้าสู่ระบบผู้ดูแล',
      'auth.subtitle': 'ใช้รหัสผู้ดูแลเดิมเพื่อเปิดพื้นที่ทำงาน',
      'auth.pin': 'รหัสผู้ดูแล',
      'auth.submit': 'เข้าสู่ระบบ',
      'auth.missingPin': 'กรุณากรอกรหัสผู้ดูแล',
      'auth.missingSession': 'ไม่พบสิทธิ์ผู้ดูแล กรุณาเปิดผ่านพื้นที่ทำงาน',
      'auth.failed': 'เข้าสู่ระบบไม่สำเร็จ',
      'auth.invalidPin': 'รหัสผู้ดูแลไม่ถูกต้อง',
      'workspace.openFull': 'เต็มหน้าจอ',
      'workspace.logout': 'ออกจากระบบ',
      'workspace.menu': 'เมนู',
      'workspace.current': 'หน้าปัจจุบัน',
      'nav.overview': 'ภาพรวม',
      'nav.recruitment': 'สรรหา',
      'nav.people': 'พนักงาน',
      'nav.work': 'เวลาทำงาน',
      'nav.payroll': 'ค่าแรง',
      'nav.reports': 'รายงาน',
      'nav.system': 'ระบบ',
      'nav.comingSoon': 'เร็ว ๆ นี้',
      'view.overview': 'ภาพรวมระบบ',
      'view.review': 'งานรอตรวจ',
      'view.notifications': 'แจ้งเตือน',
      'view.applicants': 'ผู้สมัครงาน',
      'view.interviews': 'นัดสัมภาษณ์',
      'view.staffing': 'แผนรับพนักงาน',
      'view.employees': 'รายชื่อพนักงาน',
      'view.employeeRegistration': 'เพิ่ม / ลงทะเบียนพนักงาน',
      'view.onboarding': 'การเริ่มงาน',
      'view.employeeDocuments': 'เอกสารพนักงาน',
      'view.offboarding': 'การสิ้นสุดงาน',
      'view.schedule': 'ตารางงาน',
      'view.attendance': 'เวลาเข้า–ออก',
      'view.leave': 'การลา / วันหยุด',
      'view.activity': 'บันทึกการทำงานประจำวัน',
      'view.shiftCheck': 'ตรวจความพร้อมประจำกะ',
      'view.payrollReview': 'ตรวจค่าแรง',
      'view.payrollPeriod': 'รอบค่าแรง',
      'view.paymentPrep': 'เตรียมจ่าย',
      'view.paymentHistory': 'ประวัติการจ่าย',
      'view.reportWorkforce': 'รายงานพนักงาน',
      'view.reportRecruitment': 'รายงานการสรรหา',
      'view.reportAttendance': 'รายงานเวลาเข้างาน',
      'view.reportLeave': 'รายงานการลา',
      'view.reportActivity': 'รายงานกิจกรรม',
      'view.reportPerformance': 'รายงานผลการปฏิบัติงาน',
      'view.reportPayroll': 'รายงานค่าแรง',
      'view.reportRetention': 'รายงานการรักษาพนักงาน',
      'view.recruitment': 'ระบบสรรหา',
      'view.performance': 'ผลการปฏิบัติงาน',
      'view.probationReview': 'ประเมินช่วงทดลองงาน',
      'view.training': 'การฝึกอบรม',
      'view.incident': 'เหตุการณ์พนักงาน',
      'view.movement': 'การย้ายตำแหน่ง',
      'view.advancedKpi': 'ตัวชี้วัดขั้นสูง',
      'view.advancedReports': 'รายงานขั้นสูง',
      'view.settings': 'ตั้งค่าระบบ',
      'view.permissions': 'สิทธิ์ผู้ใช้งาน',
      'view.devices': 'จัดการอุปกรณ์',
      'view.masterData': 'ข้อมูลหลัก',
      'view.tools': 'เครื่องมือระบบ',
      'subtitle.dashboard': 'สถานะกำลังคน งานค้าง และสัญญาณที่ต้องติดตาม',
      'subtitle.dashboardLive': 'ภาพรวมที่ต้องรู้และต้องดำเนินการวันนี้',
      'subtitle.queue': 'รวมรายการที่ต้องตรวจสอบไว้ในจุดเดียว',
      'subtitle.notifications': 'แจ้งเตือนจากกระบวนการบุคลากร',
      'subtitle.attendance': 'ค้นหาและตรวจรายการเวลาเข้าออกแบบอ่านอย่างเดียว',
      'subtitle.payrollPeriod': 'ตรวจสถานะรอบค่าแรงโดยไม่เปลี่ยนข้อมูล',
      'subtitle.preview': 'สำรวจรูปแบบการใช้งานก่อนเปิดโมดูลจริง',
      'summary.title': 'สรุป',
      'action.title': 'ดำเนินการ',
      'detail.title': 'รายละเอียด',
      'common.loading': 'กำลังโหลดข้อมูล',
      'common.retry': 'ลองใหม่',
      'common.refresh': 'รีเฟรช',
      'common.search': 'ค้นหา',
      'common.searchPlaceholder': 'ค้นหาจากชื่อ รหัส หรือคำสำคัญ',
      'common.allStatuses': 'ทุกสถานะ',
      'common.allBranches': 'ทุกสาขา',
      'common.allDepartments': 'ทุกแผนก',
      'common.filters': 'ตัวกรอง',
      'common.viewDetail': 'ดูรายละเอียด',
      'common.close': 'ปิด',
      'common.noData': 'ยังไม่มีข้อมูลที่ตรงกับตัวกรอง',
      'common.noResults': 'ไม่พบข้อมูล',
      'common.readOnly': 'อ่านอย่างเดียว',
      'common.preview': 'ตัวอย่าง',
      'common.comingSoon': 'เร็ว ๆ นี้',
      'common.total': 'ทั้งหมด',
      'common.pending': 'รอตรวจ',
      'common.completed': 'เสร็จแล้ว',
      'common.attention': 'ต้องติดตาม',
      'common.updatedAt': 'อัปเดตล่าสุด',
      'common.notAvailable': '—',
      'common.error': 'โหลดข้อมูลไม่สำเร็จ',
      'common.errorHint': 'ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง',
      'error.timeout': 'ระบบตอบสนองช้าเกินไป กรุณาลองใหม่',
      'error.invalidUrl': 'ที่อยู่ระบบไม่ถูกต้อง',
      'error.unauthorized': 'สิทธิ์ผู้ดูแลหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
      'error.stagingOnly': 'หน้านี้ใช้งานได้กับระบบทดสอบเท่านั้น กรุณาเปิดจากลิงก์ทดสอบที่กำหนด',
      'preview.label': 'เร็ว ๆ นี้ — ฟังก์ชันนี้อยู่ระหว่างพัฒนาและยังไม่เปิดใช้งานจริง',
      'preview.body': 'หน้านี้เปิดให้ตรวจรูปแบบการใช้งานเท่านั้น ปุ่มที่เขียนข้อมูลถูกปิดไว้',
      'preview.noWrite': 'ไม่มีการเขียนข้อมูลจริง',
      'preview.sampleData': 'ข้อมูลตัวอย่างสำหรับตรวจการใช้งาน',
      'preview.actionDisabled': 'เปิดใช้งานหลังผ่านการทดสอบ',
      'metric.activeEmployees': 'พนักงานที่ใช้งาน',
      'metric.pendingItems': 'รายการรอตรวจ',
      'metric.todayAttendance': 'ลงเวลาในวันนี้',
      'metric.openPositions': 'ตำแหน่งที่เปิด',
      'metric.unread': 'ยังไม่อ่าน',
      'metric.periods': 'รอบค่าแรง',
      'metric.previewRecords': 'รายการตัวอย่าง',
      'metric.scheduledToday': 'ต้องมาทำงานวันนี้',
      'metric.arrived': 'มาแล้ว',
      'metric.notArrived': 'ยังไม่เข้า',
      'metric.late': 'มาสาย',
      'metric.onLeave': 'ลา',
      'metric.noCheckout': 'ไม่มีเวลาออก',
      'metric.payrollReview': 'ค่าแรงที่ต้องตรวจ',
      'dashboard.actionToday': 'ต้องดำเนินการวันนี้',
      'dashboard.importantAlerts': 'แจ้งเตือนสำคัญ',
      'dashboard.todayAttendance': 'สถานะเวลาทำงานวันนี้',
      'dashboard.openWork': 'งานที่ยังต้องตรวจ',
      'dashboard.openModule': 'เปิดหน้าจัดการ',
      'dashboard.noAction': 'วันนี้ยังไม่มีรายการเร่งด่วน',
      'dashboard.sectionUnavailable': 'ส่วนนี้โหลดไม่สำเร็จ แต่ส่วนอื่นยังใช้งานได้',
      'table.person': 'บุคคล',
      'table.employee': 'พนักงาน',
      'table.module': 'โมดูล',
      'table.item': 'รายการ',
      'table.branch': 'สาขา',
      'table.department': 'แผนก',
      'table.position': 'ตำแหน่ง',
      'table.date': 'วันที่',
      'table.time': 'เวลา',
      'table.status': 'สถานะ',
      'table.owner': 'ผู้รับผิดชอบ',
      'table.action': 'การทำงาน',
      'table.period': 'รอบ',
      'table.amount': 'ยอดรวม',
      'table.message': 'ข้อความ',
      'drawer.title': 'รายละเอียดรายการ',
      'drawer.preview': 'รายละเอียดนี้เป็นตัวอย่างและไม่สามารถแก้ไขได้',
      'status.active': 'ใช้งาน',
      'status.inactive': 'ไม่ใช้งาน',
      'status.pending': 'รอดำเนินการ',
      'status.approved': 'อนุมัติแล้ว',
      'status.rejected': 'ไม่อนุมัติ',
      'status.submitted': 'ส่งแล้ว',
      'status.review': 'ต้องตรวจ',
      'status.completed': 'เสร็จแล้ว',
      'status.draft': 'ฉบับร่าง',
      'status.paid': 'จ่ายแล้ว',
      'status.open': 'เปิด',
      'status.closed': 'ปิด',
      'status.preview': 'ตัวอย่าง',
      'status.unread': 'ยังไม่อ่าน',
      'status.normal': 'ปกติ',
      'status.late': 'มาสาย',
      'status.noCheckout': 'ไม่มีเวลาออก',
      'status.notCheckedIn': 'ยังไม่ลงเวลาเข้า',
      'status.absent': 'ขาดงาน',
      'status.leave': 'ลา',
      'status.unplanned': 'นอกตารางงาน',
      'status.urgent': 'เร่งด่วน',
      'status.high': 'สูง',
      'status.medium': 'ปานกลาง',
      'status.low': 'ต่ำ',
      'status.probation': 'ทดลองงาน',
      'status.final': 'สรุปยอดแล้ว',
      'status.hold': 'พักการดำเนินการ',
      'status.disputed': 'มีข้อโต้แย้ง',
      'status.cancelled': 'ยกเลิก',
      'status.ready': 'พร้อมดำเนินการ',
      'status.accepted': 'ยืนยันแล้ว',
      'status.unknown': 'ไม่ระบุสถานะ',
      'sample.record1': 'รายการตัวอย่าง 01',
      'sample.record2': 'รายการตัวอย่าง 02',
      'sample.owner': 'ทีมบุคลากร',
      'environment.unknown': 'ไม่ทราบสภาพแวดล้อม',
      'schema.notReady': 'โครงสร้างระบบบุคลากรรุ่นใหม่ยังไม่พร้อม',
      'schema.disabled': 'ระบบบุคลากรรุ่นใหม่ยังไม่เปิดในสภาพแวดล้อมนี้'
    },
    en: {
      'app.name': 'KruaFlow Workforce',
      'app.uat': 'UAT environment',
      'environment.staging': 'STAGING',
      'environment.production': 'PRODUCTION',
      'language.th': 'TH',
      'language.en': 'English',
      'language.label': 'Select language',
      'workspace.navigation': 'Workforce navigation',
      'workspace.content': 'Workforce content',
      'auth.title': 'Administrator sign in',
      'auth.subtitle': 'Use the existing administrator PIN to open the Workspace',
      'auth.pin': 'Administrator PIN',
      'auth.submit': 'Sign in',
      'auth.missingPin': 'Enter the administrator PIN',
      'auth.missingSession': 'No admin session. Open this page through Workspace.',
      'auth.failed': 'Sign in failed',
      'auth.invalidPin': 'The administrator PIN is incorrect',
      'workspace.openFull': 'Full screen',
      'workspace.logout': 'Sign out',
      'workspace.menu': 'Menu',
      'workspace.current': 'Current page',
      'nav.overview': 'Overview',
      'nav.recruitment': 'Recruitment',
      'nav.people': 'Employees',
      'nav.work': 'Work',
      'nav.payroll': 'Payroll',
      'nav.reports': 'Reports',
      'nav.system': 'System',
      'nav.comingSoon': 'Coming Soon',
      'view.overview': 'System overview',
      'view.review': 'Review queue',
      'view.notifications': 'Notifications',
      'view.applicants': 'Applicants',
      'view.interviews': 'Interviews',
      'view.staffing': 'Hiring plan',
      'view.employees': 'Employee overview',
      'view.employeeRegistration': 'Add / register employee',
      'view.onboarding': 'Onboarding',
      'view.employeeDocuments': 'Employee documents',
      'view.offboarding': 'Offboarding',
      'view.schedule': 'Schedule',
      'view.attendance': 'Attendance',
      'view.leave': 'Leave / holidays',
      'view.activity': 'Daily Activity',
      'view.shiftCheck': 'Daily Shift Check',
      'view.payrollReview': 'Payroll review',
      'view.payrollPeriod': 'Payroll periods',
      'view.paymentPrep': 'Payment preparation',
      'view.paymentHistory': 'Payment history',
      'view.reportWorkforce': 'Workforce',
      'view.reportRecruitment': 'Recruitment',
      'view.reportAttendance': 'Attendance',
      'view.reportLeave': 'Leave',
      'view.reportActivity': 'Activity',
      'view.reportPerformance': 'Performance',
      'view.reportPayroll': 'Payroll',
      'view.reportRetention': 'Retention',
      'view.recruitment': 'Recruitment',
      'view.performance': 'Performance',
      'view.probationReview': 'Probation Review',
      'view.training': 'Training',
      'view.incident': 'Incident',
      'view.movement': 'Movement',
      'view.advancedKpi': 'Advanced KPI',
      'view.advancedReports': 'Advanced reports',
      'view.settings': 'System settings',
      'view.permissions': 'User permissions',
      'view.devices': 'Device management',
      'view.masterData': 'Master Data',
      'view.tools': 'System tools',
      'subtitle.dashboard': 'Workforce status, open work and signals requiring attention',
      'subtitle.dashboardLive': 'What you need to know and act on today',
      'subtitle.queue': 'Review pending workforce items in one place',
      'subtitle.notifications': 'Notifications from workforce processes',
      'subtitle.attendance': 'Search and review attendance records in read-only mode',
      'subtitle.payrollPeriod': 'Review payroll period status without changing data',
      'subtitle.preview': 'Explore the experience before this module is enabled',
      'summary.title': 'Summary',
      'action.title': 'Actions',
      'detail.title': 'Details',
      'common.loading': 'Loading data',
      'common.retry': 'Retry',
      'common.refresh': 'Refresh',
      'common.search': 'Search',
      'common.searchPlaceholder': 'Search by name, ID or keyword',
      'common.allStatuses': 'All statuses',
      'common.allBranches': 'All branches',
      'common.allDepartments': 'All departments',
      'common.filters': 'Filters',
      'common.viewDetail': 'View details',
      'common.close': 'Close',
      'common.noData': 'No data matches these filters',
      'common.noResults': 'No results',
      'common.readOnly': 'Read only',
      'common.preview': 'Preview',
      'common.comingSoon': 'Coming Soon',
      'common.total': 'Total',
      'common.pending': 'Pending',
      'common.completed': 'Completed',
      'common.attention': 'Needs attention',
      'common.updatedAt': 'Last updated',
      'common.notAvailable': '—',
      'common.error': 'Unable to load data',
      'common.errorHint': 'Check the connection and try again',
      'error.timeout': 'The system took too long to respond. Please try again.',
      'error.invalidUrl': 'The system address is invalid.',
      'error.unauthorized': 'The administrator session has expired. Please sign in again.',
      'error.stagingOnly': 'This page is available only with the staging system. Open the designated UAT link.',
      'preview.label': 'Coming Soon — This feature is under development and is not yet available for live use.',
      'preview.body': 'This screen is available for experience review only. Data-writing actions are disabled.',
      'preview.noWrite': 'No production data writes',
      'preview.sampleData': 'Sample data for UX review',
      'preview.actionDisabled': 'Available after UAT approval',
      'metric.activeEmployees': 'Active employees',
      'metric.pendingItems': 'Pending items',
      'metric.todayAttendance': 'Attendance today',
      'metric.openPositions': 'Open positions',
      'metric.unread': 'Unread',
      'metric.periods': 'Payroll periods',
      'metric.previewRecords': 'Sample records',
      'metric.scheduledToday': 'Scheduled today',
      'metric.arrived': 'Arrived',
      'metric.notArrived': 'Not checked in',
      'metric.late': 'Late',
      'metric.onLeave': 'On leave',
      'metric.noCheckout': 'No check-out',
      'metric.payrollReview': 'Payroll to review',
      'dashboard.actionToday': 'Action required today',
      'dashboard.importantAlerts': 'Important alerts',
      'dashboard.todayAttendance': 'Today’s attendance',
      'dashboard.openWork': 'Open review items',
      'dashboard.openModule': 'Open workspace',
      'dashboard.noAction': 'There are no urgent items today',
      'dashboard.sectionUnavailable': 'This section could not load; other sections remain available',
      'table.person': 'Person',
      'table.employee': 'Employee',
      'table.module': 'Module',
      'table.item': 'Item',
      'table.branch': 'Branch',
      'table.department': 'Department',
      'table.position': 'Position',
      'table.date': 'Date',
      'table.time': 'Time',
      'table.status': 'Status',
      'table.owner': 'Owner',
      'table.action': 'Action',
      'table.period': 'Period',
      'table.amount': 'Total',
      'table.message': 'Message',
      'drawer.title': 'Item details',
      'drawer.preview': 'These are sample details and cannot be edited',
      'status.active': 'Active',
      'status.inactive': 'Inactive',
      'status.pending': 'Pending',
      'status.approved': 'Approved',
      'status.rejected': 'Rejected',
      'status.submitted': 'Submitted',
      'status.review': 'Review required',
      'status.completed': 'Completed',
      'status.draft': 'Draft',
      'status.paid': 'Paid',
      'status.open': 'Open',
      'status.closed': 'Closed',
      'status.preview': 'Preview',
      'status.unread': 'Unread',
      'status.normal': 'Normal',
      'status.late': 'Late',
      'status.noCheckout': 'No check-out',
      'status.notCheckedIn': 'Not checked in',
      'status.absent': 'Absent',
      'status.leave': 'Leave',
      'status.unplanned': 'Unplanned',
      'status.urgent': 'Urgent',
      'status.high': 'High',
      'status.medium': 'Medium',
      'status.low': 'Low',
      'status.probation': 'Probation',
      'status.final': 'Final',
      'status.hold': 'On hold',
      'status.disputed': 'Disputed',
      'status.cancelled': 'Cancelled',
      'status.ready': 'Ready',
      'status.accepted': 'Accepted',
      'status.unknown': 'Unknown status',
      'sample.record1': 'Sample record 01',
      'sample.record2': 'Sample record 02',
      'sample.owner': 'Workforce team',
      'environment.unknown': 'Unknown environment',
      'schema.notReady': 'Workforce V2 schema is not ready',
      'schema.disabled': 'Workforce V2 is not enabled in this environment'
    }
  };

  function normalizeLanguage(value) {
    return value === 'en' ? 'en' : 'th';
  }

  function getLanguage() {
    try { return normalizeLanguage(localStorage.getItem(STORAGE_KEY)); } catch (_) { return 'th'; }
  }

  function interpolate(value, vars) {
    return String(value).replace(/\{(\w+)\}/g, function (_, key) {
      return vars && vars[key] !== undefined ? vars[key] : '';
    });
  }

  const missingKeys = new Set();

  function t(key, vars) {
    const language = getLanguage();
    const selected = dictionaries[language] || dictionaries.th;
    let value = Object.prototype.hasOwnProperty.call(selected, key) ? selected[key] : undefined;
    if (value === undefined && language !== 'th' && Object.prototype.hasOwnProperty.call(dictionaries.th, key)) value = dictionaries.th[key];
    if (value === undefined) {
      if (!missingKeys.has(key)) {
        missingKeys.add(key);
        if (global.console && typeof global.console.warn === 'function') global.console.warn('[KruaFlow i18n] missing key:', key, 'locale:', language);
      }
      value = '—';
    }
    return interpolate(value, vars);
  }

  function apply(root) {
    const scope = root || document;
    document.documentElement.lang = getLanguage();
    scope.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.dataset.i18n);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
      node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(function (node) {
      node.setAttribute('title', t(node.dataset.i18nTitle));
    });
    scope.querySelectorAll('[data-i18n-aria-label]').forEach(function (node) {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
    scope.querySelectorAll('[data-language]').forEach(function (node) {
      const active = node.dataset.language === getLanguage();
      node.classList.toggle('active', active);
      node.setAttribute('aria-pressed', String(active));
    });
  }

  function setLanguage(language) {
    const next = normalizeLanguage(language);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    apply(document);
    global.dispatchEvent(new CustomEvent('KruaFlowLanguageChange', { detail: { language: next } }));
    return next;
  }

  function bindLanguageSwitchers(root) {
    (root || document).querySelectorAll('[data-language]').forEach(function (node) {
      if (node.dataset.i18nBound) return;
      node.dataset.i18nBound = '1';
      node.addEventListener('click', function () { setLanguage(node.dataset.language); });
    });
    apply(root || document);
  }

  function errorText(error) {
    const raw = String(error && error.message ? error.message : error || '').trim();
    if (!raw) return t('common.errorHint');
    if (/PIN\s*Admin\s*ไม่ถูกต้อง|PIN.*incorrect|invalid.*pin/i.test(raw)) return t('auth.invalidPin');
    if (/ตอบช้า|ไม่ตอบสนอง|timeout/i.test(raw)) return t('error.timeout');
    if (/Backend URL|URL.*ไม่ถูก|invalid.*url/i.test(raw)) return t('error.invalidUrl');
    if (/Admin|Token|session|หมดอายุ|สิทธิ์/i.test(raw)) return t('error.unauthorized');
    if (getLanguage() === 'en') return raw;
    if (/[A-Za-z]{2,}/.test(raw)) {
      if (global.console && typeof global.console.warn === 'function') global.console.warn('[KruaFlow i18n] untranslated error:', raw);
      return t('common.errorHint');
    }
    return raw;
  }

  global.KruaFlowI18n = Object.freeze({
    apply: apply,
    bindLanguageSwitchers: bindLanguageSwitchers,
    dictionaries: dictionaries,
    errorText: errorText,
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    t: t
  });
})(window);
