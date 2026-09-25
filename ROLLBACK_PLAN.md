# Krua Flow V7 Rollback Plan

1. ก่อน Deploy เก็บสำเนา Apps Script เวอร์ชันที่ใช้งานจริงและเลข Deployment เดิม
2. ห้ามลบ Sheet เดิมหรือ Header เดิมระหว่าง Migration
3. หาก V7 มีปัญหา:
   - เปิด Deployments
   - ชี้ Web App กลับไปยัง Version Apps Script เดิม
   - คง URL `/exec` เดิม
   - ปิด Trigger V7: `runShiftMonitoring_`, `runDailyBackup_`, `runDailyMaintenance_`
4. หน้าเว็บ V7 เป็น additive pages; ระบบลงเวลาเดิม `index.html` ยังอยู่
5. ข้อมูลใน Sheet V7 ไม่ต้องลบเมื่อ Rollback
6. หลัง Rollback ตรวจ:
   - Kiosk ลงเวลา
   - Admin login
   - Attendance write
   - Registration
   - Leave
   - Payroll เดิม
7. บันทึกเหตุผล Rollback และเวลาที่เกิดเหตุใน Audit/Incident note
