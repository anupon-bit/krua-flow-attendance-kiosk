# Private GCS File Service setup

The repository implements the Apps Script contracts and metadata layer, but no cloud resource is provisioned automatically.

Required resources:

1. A private GCS bucket with public access prevention enabled.
2. A Cloud Run service account with object create/read permissions limited to that bucket.
3. A private Cloud Run service implementing:
   - `POST /v1/uploads` → short-lived signed PUT URL
   - `POST /v1/uploads/finalize` → verify object key, size, MIME, and checksum
   - `POST /v1/views` → short-lived signed GET URL
4. Apps Script properties `FILE_SERVICE_URL` and `FILE_SERVICE_AUTH_TOKEN` (or replace the bearer adapter with an identity-token integration).
5. Set `GCS_DOCUMENTS_ENABLED=TRUE` only after unauthorized access, expired URL, image, PDF, and legacy Drive compatibility tests pass.

The public applicant flow receives a random upload token cached for 30 minutes and scoped to exactly one `applicantId/personId`. Configure Cloud Run CORS for the approved GitHub Pages and local STAGING origins so browser `PUT` uploads can succeed.

Never store a service-account private key, bearer token, or signed URL in Git, Sheets, or document metadata. The browser may choose the original filename but never the bucket or object path; Apps Script derives a safe path from owner and document IDs.
