# STAGING deployment runbook

Production Apps Script project and deployment must remain untouched on version `@42`:

`AKfycbzb4HTzG1GUEQrHTkvuTmcUX7rhOTlNgJqeAmwWzdbSAet8rLqJdlLCfCf5KNANJLg`

Production Script ID:

`1eM39zi8GKiFf0zpkua8qFaCWE9DEdmEN_sbx3-hutSbL1m6ou0FYNvWf`

Production Spreadsheet ID:

`13Nsy0aSkAm-Qg7vCHj_vtEOArwtghFp-XhlYihyQTgU`

STAGING Script ID:

`1zhBcE_dikcfySP8L4RoN6LphYy2yPgQqtcCN7uSJaPGmiZEKyqAAh7d9`

STAGING Spreadsheet ID:

`1k6FV6wgkiSIry_Kr45pRDkc-knrX4MBShikdr--g4Bw`

STAGING deployment ID:

`AKfycbzG77xQnZFyyT8zMs6x4_0FHAqR3-YfYZIdN5IIxpWLx-ZVq3pp8hk_H0GC9sWcOTcA`

Sequence:

1. Run all local tests and `git diff --check`.
2. Run `clasp status` from `apps-script/` and confirm only intended script files are tracked.
3. From `apps-script/`, run `clasp -P /absolute/path/to/apps-script/.clasp.staging.json push`. Never use the Production `.clasp.json` for STAGING work.
4. Set the STAGING project's Script Properties (`ENVIRONMENT`, `BACKEND_SPREADSHEET_ID`, all six feature flags, and a STAGING-only `ADMIN_PIN`) in Project Settings. Never copy Production secrets into STAGING.
5. Create a new immutable Apps Script version in the STAGING project and deploy only that project.
6. Run `adminWorkforceMigrate` with `apply:false` using an Admin session against STAGING.
7. Review the plan, then apply schema without backfill.
8. Run V7 regression tests.
9. Backfill Person links only after a backup and dry-run review.
10. Enable flags one module at a time and execute the UAT matrix.
11. Run `clasp deployments` against both project files and confirm the Production deployment version is still `@42`.

The frontend may use `?staging=1` only to select the STAGING URL. Backend environment authority is exclusively `ScriptApp.getScriptId()`; request query, headers, and body are ignored.
