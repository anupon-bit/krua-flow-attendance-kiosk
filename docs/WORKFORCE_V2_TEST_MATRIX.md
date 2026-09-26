# Workforce V2 test matrix

## Automated locally

- JavaScript syntax for Apps Script and browser modules.
- Inline script syntax for changed HTML pages.
- Applicant lifecycle transition allow/deny rules.
- Phone normalization and Person ID helper behavior.
- KPI zero-denominator and score-weight validation.
- GCS object-key traversal rejection and safe filename handling.
- Route uniqueness, handler presence, legacy API preservation, and secret-pattern checks.

## STAGING manual/UAT required

- Existing: Owner/Admin, employee, manager, kiosk clock in/out, schedule, leave, payroll and V7 permissions.
- Recruitment: applicant submit, duplicate candidate queue, screening, interview/no-show, pass/reject, offer accept/decline.
- Onboarding: values carry forward once; Person and Applicant IDs remain linked; legacy approval creates the expected Employee ID.
- Documents: JPG/PNG/WEBP/PDF upload, oversize rejection, unauthorized view rejection, expired signed URL, legacy Drive view.
- Data: dry-run twice returns the same plan; apply twice creates no duplicate sheets or columns; backfill twice creates no duplicate Persons.
- Production: deployment remains version `@42` and receives no deployment update.
