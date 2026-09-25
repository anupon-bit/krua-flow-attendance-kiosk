# Krua Flow V7.3 — Payroll Batch Backend Patch

Purpose: support the one-page Dashboard payroll workflow:

DRAFT/Preview -> REVIEW (employee checks) -> FINAL (locked) -> PAID.

Frontend commit expecting these operations:
- adminGetPayrollSnapshots
- adminCreatePayrollReviewBatch
- adminFinalizePayrollBatch
- adminMarkPayrollPaidBatch

Existing employee APIs already used by portal.html:
- portalGetPayroll
- portalRespondPayroll

## Sheets used

### Payroll_Snapshots
Columns:
1. Snapshot ID
2. Period Key
3. Employee ID
4. Start Date
5. End Date
6. Pay Date
7. Status
8. Gross
9. Deductions
10. Net
11. Detail JSON
12. Created At
13. Created By
14. Finalized At
15. Paid At
16. Paid Reference
17. Employee Response
18. Employee Response At
19. Updated At

### Payroll_Disputes
Keep using existing flow from portalRespondPayroll.

### Notifications
Create employee notification when REVIEW is created.

### Audit_Log
Write audit entries for REVIEW / FINAL / PAID.

---

## Required behavior

### 1. adminGetPayrollSnapshots

Input:
```js
{
  op: 'adminGetPayrollSnapshots',
  adminToken,
  startDate,
  endDate,
  payDate
}
```

Rules:
- validate Admin session
- return snapshots matching startDate + endDate
- payDate may be used as an additional filter when supplied

Output:
```js
{
  rows: [
    {
      snapshotId,
      periodKey,
      employeeId,
      startDate,
      endDate,
      payDate,
      status,
      gross,
      deductions,
      net,
      employeeResponse,
      employeeResponseAt,
      finalizedAt,
      paidAt,
      paidReference,
      updatedAt
    }
  ]
}
```

### 2. adminCreatePayrollReviewBatch

Input:
```js
{
  op: 'adminCreatePayrollReviewBatch',
  adminToken,
  startDate,
  endDate,
  payDate,
  items: [
    {
      employeeId,
      periodKey,
      gross,
      deductions,
      net,
      detail
    }
  ]
}
```

Rules:
- validate Admin session
- reject items with missing employeeId
- upsert by Period Key + Employee ID
- if an existing snapshot is FINAL or PAID, do not overwrite it
- status = REVIEW
- Employee Response = blank
- save Detail JSON as JSON.stringify(item.detail)
- Created By = ADMIN
- Updated At = now
- create notification for each employee:
  - title: "มีรายการค่าแรงให้ตรวจ"
  - message: "กรุณาตรวจสอบยอดค่าแรงรอบ <periodKey>"
  - severity: INFO
  - referenceType: PAYROLL
  - referenceId: snapshotId
  - status: UNREAD
- append Audit_Log action: PAYROLL_SEND_REVIEW

Output:
```js
{ ok: true, created: n, updated: n, rows: [...] }
```

### 3. adminFinalizePayrollBatch

Input:
```js
{
  op: 'adminFinalizePayrollBatch',
  adminToken,
  snapshotIds: [...]
}
```

Rules:
- validate Admin session
- every target must currently be REVIEW
- every target must have Employee Response = ACCEPT
- must not have an unresolved Payroll_Disputes row
- set Status = FINAL
- set Finalized At = now
- set Updated At = now
- after FINAL, payroll values and Detail JSON must be immutable
- append Audit_Log action: PAYROLL_FINALIZE

Output:
```js
{ ok: true, finalized: n }
```

### 4. adminMarkPayrollPaidBatch

Input:
```js
{
  op: 'adminMarkPayrollPaidBatch',
  adminToken,
  snapshotIds: [...],
  paidReference: '',
  payDate: 'YYYY-MM-DD'
}
```

Rules:
- validate Admin session
- target must be FINAL only
- set Status = PAID
- set Paid At = now
- set Paid Reference = payload value
- set Updated At = now
- append Audit_Log action: PAYROLL_MARK_PAID
- optional employee notification:
  - title: "บันทึกจ่ายค่าแรงแล้ว"
  - referenceType: PAYROLL

Output:
```js
{ ok: true, paid: n }
```

---

## Router

Add these operation names to the existing API dispatcher without changing the /exec URL:

```js
case 'adminGetPayrollSnapshots':
  return adminGetPayrollSnapshots_(payload);

case 'adminCreatePayrollReviewBatch':
  return adminCreatePayrollReviewBatch_(payload);

case 'adminFinalizePayrollBatch':
  return adminFinalizePayrollBatch_(payload);

case 'adminMarkPayrollPaidBatch':
  return adminMarkPayrollPaidBatch_(payload);
```

Use the SAME Admin authentication helper, spreadsheet helper, date formatting helper,
notification helper, and audit helper already used by the current V7.3 backend.
Do not add a second authentication mechanism.

## Important transaction rules

1. Use LockService.getScriptLock() for REVIEW / FINAL / PAID writes.
2. Re-read the snapshot row after acquiring the lock.
3. FINAL and PAID are irreversible through normal UI.
4. Never recalculate a FINAL snapshot when Dashboard refreshes.
5. Employee Portal must read Payroll_Snapshots, not recalculate live values.
6. Dashboard may show live Preview for rows without a snapshot, but once REVIEW exists,
   status and finalized values must come from the snapshot.

## Deploy

After adding the code:
1. Apps Script -> Deploy -> Manage deployments
2. Edit current Web App deployment
3. Select New version
4. Deploy
5. Keep the same /exec URL in config.js
6. Do not create a new public URL unless necessary

## UAT

1. Dashboard -> select TEST002.
2. Send for employee review.
3. Employee Portal -> ค่าแรง -> verify REVIEW appears.
4. Employee clicks "ข้อมูลถูกต้อง".
5. Dashboard refresh -> status becomes "พนักงานยืนยันแล้ว".
6. Select row -> FINAL.
7. Verify Payroll_Snapshots row is locked/final.
8. Select FINAL row -> mark PAID.
9. Employee Portal shows final paid status.
10. Audit_Log contains REVIEW / FINAL / PAID actions.

