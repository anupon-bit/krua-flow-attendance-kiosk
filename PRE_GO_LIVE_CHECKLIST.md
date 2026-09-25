# Krua Flow V7 Pre-Go-Live Checklist

## 1) Backend
- [ ] สำรอง Apps Script เดิม
- [ ] Deploy `Krua_Flow_Attendance_V7_1_Workforce_Portal.gs`
- [ ] Run `setupSystem()`
- [ ] Run `installAutomationTriggers()`
- [ ] ตรวจ Web App `/exec` URL เดิม
- [ ] ตรวจ Script Properties / Admin PIN

## 2) Master Data
- [ ] Branches ครบ
- [ ] Departments ครบ
- [ ] Shifts ครบ พร้อม Start/End, Grace, Late Deduction, Night Allowance
- [ ] Minimum Staffing ครบ
- [ ] Leave Quota Rules ครบ
- [ ] Devices ผูกสาขาครบ
- [ ] Manager Scope ครบทุกสาขา/แผนก

## 3) Employee
- [ ] Registration ใช้ Branch/Department Master
- [ ] Bank dropdown + Bank Code
- [ ] Upload ID card / house registration / education / other docs
- [ ] Employee Portal Login
- [ ] Read-only profile
- [ ] Change request
- [ ] Leave / Request Off
- [ ] Quota calendar
- [ ] Attendance correction
- [ ] Payroll review/dispute
- [ ] Notifications

## 4) Manager
- [ ] Scope guard ทำงาน
- [ ] Manager เห็นเฉพาะ Branch + Department ที่ได้รับสิทธิ์
- [ ] Approve/Reject Leave
- [ ] Approve Attendance Correction
- [ ] Approve Shift Swap
- [ ] Weekly Schedule Draft/Publish/Version
- [ ] Leave lock บน Schedule
- [ ] Minimum Staffing validation
- [ ] Daily Shift Check +25 นาที
- [ ] Action Required / Resolution

## 5) Payroll & Governance
- [ ] DRAFT → REVIEW → FINAL → PAID
- [ ] Payroll Snapshot
- [ ] Audit Log
- [ ] Backup Trigger
- [ ] Manual Backup
- [ ] Offboarding
- [ ] Document expiry warning

## 6) Go Live
- [ ] UAT ผ่านทุก Critical Test
- [ ] ทดลองพนักงานจริง 2–3 คน
- [ ] ทดลอง Manager จริง 1 คน
- [ ] ตรวจมือถือ Android + iPhone
- [ ] ปิด TEST MODE
- [ ] Publish ตารางจริงสัปดาห์แรก
- [ ] ตรวจ Daily Shift Check รอบแรก
