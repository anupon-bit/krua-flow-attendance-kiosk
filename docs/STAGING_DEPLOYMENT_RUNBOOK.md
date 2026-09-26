# STAGING deployment runbook

Production deployment ID must remain untouched and on version `@42`:

`AKfycbzb4HTzG1GUEQrHTkvuTmcUX7rhOTlNgJqeAmwWzdbSAet8rLqJdlLCfCf5KNANJLg`

STAGING deployment ID:

`AKfycbzauD9IQpCyKjdCTu-WwL92-VMCRWG0NTDEdOxTLLIG30IhoLk-KAu2MSVG536hSmc`

Sequence:

1. Run all local tests and `git diff --check`.
2. Run `clasp status` from `apps-script/` and confirm only intended script files are tracked.
3. Run `clasp push`.
4. Create a new immutable Apps Script version with a Workforce V2 description.
5. Update only the existing STAGING deployment ID to the new version.
6. Run `adminWorkforceMigrate` with `apply:false` using an Admin session against STAGING.
7. Review the plan, then apply schema without backfill.
8. Run V7 regression tests.
9. Backfill Person links only after a backup and dry-run review.
10. Enable flags one module at a time and execute the UAT matrix.
11. Run `clasp deployments` and confirm the Production deployment version is still `@42`.

The static frontend selects STAGING only when opened with `?staging=1`; the default URL remains Production for backward compatibility.
