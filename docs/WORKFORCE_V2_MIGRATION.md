# Workforce V2 migration map

| Old | New link / rule |
|---|---|
| `Employees` | Add `Person ID`; retain every Employee ID and all current columns |
| `Employee_Registrations` | Add `Person ID` and `Applicant ID`; do not rewrite registration status/history |
| `Employee_Documents` | Keep as `GDRIVE_LEGACY`; create metadata in `Documents` only during controlled migration |
| `Attendance` | No row migration; remains authoritative |
| `Leave_Requests` | No row migration; remains authoritative |
| Payroll sheets | No formula or historical-row migration in foundation phase |

## Safe execution

1. Open `workspace.html?staging=1` so login and child views use the STAGING deployment ID.
2. Call `adminWorkforceMigrate` with `apply:false`; archive the returned plan.
3. Verify every reported missing column and sheet.
4. Call with `apply:true, backfillLegacy:false` to create schema only.
5. Run regression checks against existing kiosk, portal, manager, leave, schedule, and payroll.
6. Call with `apply:true, backfillLegacy:true` only after reviewing a spreadsheet backup and dry-run counts.
7. Enable `WORKFORCE_V2_ENABLED`, then `RECRUITMENT_ENABLED`, on STAGING one at a time.

All steps are idempotent. A failed person reservation may leave an unused number; IDs remain unique and stable.
