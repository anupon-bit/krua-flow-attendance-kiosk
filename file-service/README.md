# KruaFlow File Service

Cloud Run service that authenticates Apps Script with a shared bearer token and creates short-lived V4 signed URLs for a private GCS bucket.

Endpoints:

- `POST /v1/uploads` — signed PUT URL, 10 minutes by default
- `POST /v1/uploads/finalize` — verifies object existence, MIME type, and exact size
- `POST /v1/views` — signed GET URL, 5 minutes by default

Only `image/jpeg`, `image/png`, `image/webp`, and `application/pdf` objects up to 10 MB are accepted. Object keys must follow the server-generated KruaFlow path contract. The service never accepts a bucket name from a request.

Use Cloud Run service identity/Application Default Credentials. Do not create or mount a service-account key file. Put `FILE_SERVICE_AUTH_TOKEN` in Secret Manager and the matching value in STAGING Apps Script Properties.

Run locally:

```sh
npm ci
npm test
GCS_BUCKET=... FILE_SERVICE_AUTH_TOKEN=... npm start
```

Provisioning and deployment commands are documented in `../docs/GCS_FILE_SERVICE_SETUP.md`.
