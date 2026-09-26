# Workforce V2 API map

All admin operations require the existing `ADMIN_` session. Portal and manager operations require the existing `PORTAL_` session. Existing V7 action names remain unchanged.

## Foundation and identity

- `adminWorkforceMigrate` — dry-run/apply additive schema and optional legacy Person backfill.
- `adminWorkforceBackfillPreview` — authenticated read-only mapping preview; returns planned Person actions, registration reuse, duplicate warnings, exact link-cell counts, and explicit zero modifications for Applicants/Attendance/Leave/Payroll.
- `workforceBootstrap`, `workforcePublicBootstrap` — environment flags and masters.
- `adminSetWorkforceFeatureFlag` — audited flag change.
- `adminWorkforceDiagnostics` — duplicate/orphan/master-reference checks.
- `adminSearchEmployees`, `adminGetEmployeeLifecycleProfile` — minimal search and lazy profile tabs.
- `adminRecordEmployeeMovement`, `adminApplyDueEmployeeMovements` — current value plus immutable history.

## Recruitment and onboarding

- `applicantSubmit`, `adminCreateRecruitmentLead`, `adminRecruitmentList`.
- `adminTransitionApplicant`, `adminGetInterviews`, `adminSaveInterview`, `adminSaveOffer`.
- `adminGetStaffingTargets`, `adminSaveStaffingTarget`.
- `adminStartOnboarding`, `adminSaveProbationReview`.
- `adminRecruitmentReport`.

## Documents

- `documentCreateUploadSession`, `documentFinalizeUpload`, `documentGetViewUrl`.
- The browser transfers binary directly to private GCS; Apps Script stores JSON metadata only.
- Existing Drive document APIs remain available during migration.

## Attendance and activity

- `adminAttendanceControl` — Schedule expectation + Attendance facts + approved Leave, without changing any source.
- `portalGetDailyActivities`, `portalAddActivityItem`, `portalUpdateActivityItem`, `portalSubmitActivityReport`.
- `adminGetActivityTemplates`, `adminSaveActivityTemplate`, `adminActivityDashboard`.
- `managerGetActivityIssues`, `managerResolveActivityIssue` with capability and scope checks.

## Performance and development

- `adminGetKpiDefinitions`, `adminSaveKpiDefinition`, `adminCalculateEmployeePerformance`.
- `adminSavePerformanceReview`.
- `adminSaveTrainingCatalog`, `adminAssignEmployeeTraining`, `adminCompleteEmployeeTraining`.
- `adminRecordEmployeeIncident`, `adminSetUserCapability`.

Raw metrics are returned even when scoring is disabled. Weighted score is returned only when applicable weights total exactly 100 and all weighted KPI data is available.

## Payroll, notification, exit and retention

- `adminGetPayrollPeriods`, `adminSavePayrollPeriod`, `adminTransitionPayrollPeriod`.
- `adminGetNotificationCenter`, `adminMarkNotificationRead`.
- `adminGetWorkQueue`, `adminCompleteWorkItem`.
- `adminCreateEmployeeExit`, `adminGetEmployeeExits`, `adminUpdateExitChecklist`, `adminSaveExitInterview`, `adminCompleteEmployeeExit`.
- `adminRetentionReport`.

Payroll calculation formulas and historical snapshots are not changed by V2 period identity.
