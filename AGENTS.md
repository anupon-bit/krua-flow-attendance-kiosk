# Krua Flow Attendance Kiosk - Codex Working Rules

## 1. Project structure

Frontend:
- admin.html
- dashboard.html
- index.html
- manager.html
- portal.html
- manifest.json
- sw.js
- css/
- js/

Google Apps Script backend:
- apps-script/appsscript.json
- apps-script/Index.html
- apps-script/รหัส.js
- apps-script/.clasp.json

GitHub repository:
- anupon-bit/krua-flow-attendance-kiosk

The Google Apps Script project is connected through:
- apps-script/.clasp.json

---

## 2. Core rule

Do not make destructive changes.

Preserve existing functionality unless the user explicitly asks to remove or replace it.

Before modifying code:
1. Inspect the related frontend and backend files.
2. Identify existing API names and data structures.
3. Check whether the requested change affects other pages.
4. Reuse existing functions where practical.

---

## 3. API compatibility

Do not rename, remove, or change existing API actions without explicit approval.

Examples include:
- adminLogin
- adminDashboard
- adminGetEmployee
- attendance APIs
- leave APIs
- payroll APIs
- employee registration APIs

If an API contract must change:
- explain the impact first;
- identify all frontend callers;
- update both frontend and backend together.

---

## 4. Google Apps Script rules

Backend changes belong in:

`apps-script/`

Do not modify `.clasp.json` unless specifically required.

Do not run:

`clasp push`

without explicit user approval.

You may run read-only checks such as:
- clasp status
- clasp pull

only when needed and when they will not overwrite uncommitted work.

Before any clasp pull:
- check `git status`;
- do not pull over uncommitted local changes.

---

## 5. Git rules

Do not run automatically:
- git push
- git reset --hard
- git clean
- force push
- destructive branch operations

without explicit user approval.

Before editing:
- check git status.

After editing:
- show changed files;
- summarize what changed;
- report any risks.

The user decides when to commit and push unless explicitly instructed otherwise.

---

## 6. Performance requirements

This system must remain fast on mobile devices.

When changing code:
- minimize unnecessary Google Apps Script calls;
- avoid repeated Spreadsheet reads inside loops;
- batch reads and writes where possible;
- reduce duplicate API requests;
- avoid loading the full employee dataset when only one record is needed;
- cache static or slow-changing data where appropriate;
- avoid blocking page initialization unnecessarily.

For performance problems:
1. identify the slow operation;
2. distinguish frontend delay from backend delay;
3. reduce API round trips;
4. optimize backend data access;
5. preserve existing behavior.

---

## 7. UI and status requirements

Statuses must be visually clear.

Examples:
- approved
- pending
- rejected
- requires review
- submitted
- paid

Use consistent visual treatment across all pages.

Do not rely only on text when status color or badge improves readability.

Mobile layout must remain usable.

---

## 8. Payroll and attendance safety

Payroll, attendance, leave, and employee records are sensitive business logic.

When modifying them:
- do not silently change formulas;
- preserve historical data;
- preserve approval states;
- preserve auditability;
- identify any change affecting calculated wages;
- do not overwrite approved payroll records without explicit instruction.

When changing calculation logic, explain:
- old calculation;
- new calculation;
- affected fields;
- expected effect.

---

## 9. Error handling

Do not hide errors.

Frontend should:
- show useful error messages;
- avoid endless loading states;
- stop duplicate submissions;
- restore buttons after failed requests.

Backend should:
- return structured error responses where practical;
- validate required parameters;
- avoid exposing secrets.

---

## 10. Security

Do not expose:
- credentials;
- access tokens;
- private keys;
- passwords;
- secret API keys.

Do not hardcode new secrets into GitHub-tracked files.

Preserve existing PIN and authentication logic unless specifically asked to change it.

---

## 11. Before making a substantial change

Provide a short implementation plan covering:
- files to modify;
- functions affected;
- expected result;
- possible regression risks.

For small obvious fixes, direct implementation is acceptable.

---

## 12. After making changes

Always report:

1. Files changed
2. What was changed
3. Why it was changed
4. What should be tested
5. Whether Apps Script deployment is required
6. Whether Git commit/push is required

Do not claim a deployment succeeded unless it was actually executed and verified.

---

## 13. Preferred workflow

Recommended development sequence:

1. `git status`
2. inspect relevant files
3. modify code
4. review diff
5. test locally where possible
6. user reviews
7. git commit
8. git push
9. enter `apps-script/`
10. `clasp push`
11. test deployed Apps Script / Web App

Do not skip directly to production deployment.

---

## 14. Main objective

Prioritize:

1. system correctness
2. preservation of existing functions
3. speed and responsiveness
4. simple operation for staff
5. clear approval and payroll workflows
6. maintainable code
Untracked files:
    AGENTS.md
    