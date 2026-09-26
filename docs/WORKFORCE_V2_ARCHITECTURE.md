# KruaFlow Workforce V2 architecture

## Safety boundary

- Production deployment `@42` is not changed by this branch.
- Existing V7 APIs are routed first and are not renamed or removed.
- Workforce V2 routes are additive and controlled by feature flags in `Settings`.
- Migration is dry-run by default. Apply mode only creates missing sheets/columns and never deletes, reorders, or overwrites historical rows.
- STAGING and Production share the spreadsheet. Backfill must therefore be reviewed from dry-run output before `backfillLegacy:true` is used.

## Dependency map

| Domain | Current source | V2 target / compatibility |
|---|---|---|
| Identity | `Employees`, `Employee_Registrations` | `Persons.personId`; legacy rows receive additive `Person ID` links |
| Organization | `Branches`, `Departments`, `Shifts` | Reused; `Positions` is added because no position master exists |
| Recruitment | Registration starts after hire intent | `Recruitment_Leads`, `Applicants`, `Applicant_Interviews`, `Offers` |
| Employee | `Employees` | Preserved as current-state operational record; history is in `Employee_Movements` and lifecycle events |
| Schedule | `Work_Schedules`, `Schedule_Versions` | Reused as schedule source of truth |
| Attendance | `Attendance`, corrections | Reused as attendance source of truth; no payroll-derived attendance |
| Leave | `Leave_Requests`, balances and quota rules | Reused; attachments move through V2 document metadata when enabled |
| Payroll | pay items, adjustments, snapshots | Preserved; `Payroll_Periods` adds period identity without changing formulas |
| Documents | `Employee_Documents` + Drive binary routes | Legacy remains readable; new `Documents` metadata supports `GDRIVE_LEGACY` and `GCS` |
| Notifications | `Notifications` | Preserved as information feed |
| Decisions | scattered module queues | `Work_Queue`, separate from notifications |
| Audit | `Audit_Log` | Reused by V2 critical changes |

## Request flow

`Person → Applicant → Interview → Offer → Employee_Registration (DRAFT) → Employee`

The onboarding handoff copies the existing Person/Applicant/Offer values into a draft legacy registration once. Staff only add fields that recruitment did not know. Employee creation continues through the proven registration approval path until V2 onboarding passes UAT.

## Source-of-truth rules

- Attendance records facts about presence and time.
- Schedule records expected work and staffing coverage.
- Activity records work performed and issues.
- Payroll records payable amounts and approval history.
- Performance reads configured metrics and never mutates their source records.
- KPI ratios return `N/A` when the denominator is zero.

## Feature flags

`WORKFORCE_V2_ENABLED`, `RECRUITMENT_ENABLED`, `ACTIVITY_ENABLED`, `GCS_DOCUMENTS_ENABLED`, `PERFORMANCE_ENABLED`, and `OFFBOARDING_ENABLED` default to `FALSE`.

Use `adminSetWorkforceFeatureFlag` only against the STAGING deployment after the corresponding module passes its tests.
