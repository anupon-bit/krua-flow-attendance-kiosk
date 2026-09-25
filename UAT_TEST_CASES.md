# Krua Flow V7 UAT Test Cases

| ID | Test | Expected |
|---|---|---|
| UAT-01 | พนักงานลงทะเบียน | สร้าง Registration และเอกสารแนบครบ |
| UAT-02 | เลือกธนาคาร | ชื่อธนาคาร Dropdown และ Bank Code อัตโนมัติ |
| UAT-03 | Employee Login | Login ด้วย Employee ID + PIN ได้เฉพาะเจ้าของข้อมูล |
| UAT-04 | Employee Profile | ข้อมูลเป็น Read-only |
| UAT-05 | Change Request | ส่งคำขอแก้ข้อมูลได้ แต่ข้อมูลจริงไม่เปลี่ยนจน Admin อนุมัติ |
| UAT-06 | Request Off ว่าง | ส่งได้และ Slot เปลี่ยนเป็น RESERVED |
| UAT-07 | Request Off เต็ม | Backend ปฏิเสธและแจ้งเลือกวันอื่น |
| UAT-08 | Request Off พร้อมกัน 2 คน | Slot สุดท้ายได้เพียง 1 คน |
| UAT-09 | Manager Scope | Manager ไม่เห็นพนักงานนอก Scope |
| UAT-10 | Manager Self Leave | Manager อนุมัติคำขอของตัวเองไม่ได้ |
| UAT-11 | Approved Leave Lock | Schedule ไม่ให้กำหนด WORK ทับวันลา/หยุด |
| UAT-12 | Schedule Draft | บันทึก Draft ได้ |
| UAT-13 | Publish | Publish แล้วพนักงานเห็นเฉพาะ Published Version |
| UAT-14 | Schedule Version | แก้หลัง Publish สร้าง Version ใหม่และมี Audit |
| UAT-15 | Minimum Staffing | Publish ต่ำกว่า Minimum ถูก block/ต้อง Override พร้อมเหตุผล |
| UAT-16 | Schedule Ack | พนักงานกดรับทราบได้ |
| UAT-17 | Attendance Correction | พนักงานส่งคำขอ แก้จริงหลังอนุมัติ |
| UAT-18 | Shift Swap | Peer/Manager flow ทำงาน |
| UAT-19 | Daily Shift Check | สร้างหลังเริ่มกะประมาณ 25 นาที |
| UAT-20 | Missing Attendance | สถานะเป็น “ยังไม่พบเวลาเข้า” ไม่ใช่ขาดงานทันที |
| UAT-21 | Low Staffing | ACTION_REQUIRED เมื่อกำลังคนต่ำ Minimum |
| UAT-22 | Payroll Review | Employee เห็นยอด REVIEW ก่อนจ่าย |
| UAT-23 | Payroll Dispute | แจ้งปัญหาแล้วสถานะ HOLD |
| UAT-24 | Payroll Final | FINAL ทำ Snapshot และยอดไม่เปลี่ยนย้อนหลัง |
| UAT-25 | Paid | PAID เก็บวันที่/Reference |
| UAT-26 | Audit | การอนุมัติ/Override/แก้ข้อมูลมี Audit Log |
| UAT-27 | Backup | Manual และ Scheduled Backup ทำงาน |
| UAT-28 | Session | Admin ข้ามหน้าโดยไม่ถาม PIN ซ้ำจน Session หมดอายุ |
| UAT-29 | Offline | หน้าแสดง Offline state และไม่หลอกว่าบันทึกสำเร็จ |
| UAT-30 | Mobile | ใช้งาน Employee/Manager/Schedule บนมือถือได้ |
