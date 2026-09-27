# Private GCS File Service setup

The implementation lives in `file-service/`. It follows the existing Apps Script contracts:

- `POST /v1/uploads` → V4 signed PUT URL, about 10 minutes
- `POST /v1/uploads/finalize` → verify object existence, size, MIME type, and checksum
- `POST /v1/views` → V4 signed GET URL, about 5 minutes

The GCS bucket is private with public access prevention. Cloud Run uses its attached service account and IAM `signBlob`; no service-account key file is created or stored. Cloud Run permits network invocation because the current Apps Script adapter uses a shared bearer token rather than a Google identity token. The application rejects every business request without that bearer token.

Do not run these commands against the Production project or Old Production @42. Keep `GCS_DOCUMENTS_ENABLED=FALSE` until the complete STAGING E2E checklist passes.

## 1. Choose STAGING resource names

Run from the repository root and replace only the project ID if needed:

```sh
export KF_PROJECT_ID="YOUR_STAGING_GCP_PROJECT_ID"
export KF_REGION="asia-southeast1"
export KF_BUCKET="${KF_PROJECT_ID}-kruaflow-documents-staging"
export KF_SERVICE="kruaflow-file-service-staging"
export KF_SERVICE_ACCOUNT="kruaflow-file-service"
export KF_SERVICE_ACCOUNT_EMAIL="${KF_SERVICE_ACCOUNT}@${KF_PROJECT_ID}.iam.gserviceaccount.com"
export KF_SECRET="kruaflow-file-service-auth-token"

gcloud config set project "${KF_PROJECT_ID}"
```

If the dedicated STAGING project does not exist yet, the Google Cloud owner must create and link billing before `gcloud config set project`:

```sh
export KF_BILLING_ACCOUNT="YOUR_BILLING_ACCOUNT_ID"
gcloud projects create "${KF_PROJECT_ID}" --name="KruaFlow File Service STAGING"
gcloud billing projects link "${KF_PROJECT_ID}" --billing-account="${KF_BILLING_ACCOUNT}"
```

## 2. Enable required APIs

```sh
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  secretmanager.googleapis.com

export KF_PROJECT_NUMBER="$(gcloud projects describe "${KF_PROJECT_ID}" --format='value(projectNumber)')"

gcloud projects add-iam-policy-binding "${KF_PROJECT_ID}" \
  --member="serviceAccount:${KF_PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/run.builder"
```

## 3. Create and lock down the bucket

```sh
gcloud storage buckets create "gs://${KF_BUCKET}" \
  --project="${KF_PROJECT_ID}" \
  --location="${KF_REGION}" \
  --uniform-bucket-level-access

gcloud storage buckets update "gs://${KF_BUCKET}" \
  --public-access-prevention

gcloud storage buckets update "gs://${KF_BUCKET}" \
  --cors-file="file-service/cors.staging.json"
```

The CORS file permits only:

- `https://anupon-bit.github.io`
- `http://localhost:8081`
- `http://127.0.0.1:8081`

## 4. Create the Cloud Run service identity

```sh
gcloud iam service-accounts create "${KF_SERVICE_ACCOUNT}" \
  --project="${KF_PROJECT_ID}" \
  --display-name="KruaFlow STAGING File Service"

gcloud storage buckets add-iam-policy-binding "gs://${KF_BUCKET}" \
  --member="serviceAccount:${KF_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/storage.objectCreator"

gcloud storage buckets add-iam-policy-binding "gs://${KF_BUCKET}" \
  --member="serviceAccount:${KF_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/storage.objectViewer"

gcloud iam service-accounts add-iam-policy-binding "${KF_SERVICE_ACCOUNT_EMAIL}" \
  --project="${KF_PROJECT_ID}" \
  --member="serviceAccount:${KF_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

`roles/iam.serviceAccountTokenCreator` is required for keyless V4 URL signing through the IAM Credentials API.

## 5. Create the bearer secret

Generate the token into a temporary owner-readable file. Never paste it into Git, a command argument, logs, or a Sheet.

```sh
umask 077
openssl rand -hex 32 > /tmp/kruaflow-file-service-token

gcloud secrets create "${KF_SECRET}" \
  --project="${KF_PROJECT_ID}" \
  --replication-policy="automatic"

gcloud secrets versions add "${KF_SECRET}" \
  --project="${KF_PROJECT_ID}" \
  --data-file=/tmp/kruaflow-file-service-token

gcloud secrets add-iam-policy-binding "${KF_SECRET}" \
  --project="${KF_PROJECT_ID}" \
  --member="serviceAccount:${KF_SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

Use the same temporary token value for the STAGING Apps Script property `FILE_SERVICE_AUTH_TOKEN`, then remove the temporary file after both sides are configured.

## 6. Test and deploy Cloud Run

```sh
cd file-service
npm ci
npm test

gcloud run deploy "${KF_SERVICE}" \
  --project="${KF_PROJECT_ID}" \
  --region="${KF_REGION}" \
  --source=. \
  --service-account="${KF_SERVICE_ACCOUNT_EMAIL}" \
  --allow-unauthenticated \
  --ingress=all \
  --set-secrets="FILE_SERVICE_AUTH_TOKEN=${KF_SECRET}:latest" \
  --set-env-vars="^;^GCS_BUCKET=${KF_BUCKET};ALLOWED_ORIGINS=https://anupon-bit.github.io,http://localhost:8081,http://127.0.0.1:8081;UPLOAD_URL_TTL_SECONDS=600;VIEW_URL_TTL_SECONDS=300;DOCUMENT_MAX_BYTES=10485760"

export KF_FILE_SERVICE_URL="$(gcloud run services describe "${KF_SERVICE}" --project="${KF_PROJECT_ID}" --region="${KF_REGION}" --format='value(status.url)')"
```

The source deploy may require the deployer/Cloud Build identities to have the standard Cloud Run source deployment roles shown by `gcloud`. Grant only the roles requested for this STAGING project.

## 7. Configure Apps Script STAGING only

In the STAGING Apps Script project settings, add:

- `FILE_SERVICE_URL` = the Cloud Run service URL in `KF_FILE_SERVICE_URL`
- `FILE_SERVICE_AUTH_TOKEN` = the value stored in `/tmp/kruaflow-file-service-token`

Then remove the local temporary token:

```sh
rm /tmp/kruaflow-file-service-token
```

Do **not** set `GCS_DOCUMENTS_ENABLED=TRUE` yet.

## 8. Required STAGING E2E before enabling the flag for release

Temporarily enable the flag only in the isolated STAGING environment for the controlled UAT, then verify:

1. Missing/invalid bearer access is rejected.
2. JPG/PNG/WEBP employee photo uploads directly to GCS.
3. JPG/PNG ID card uploads directly to GCS.
4. PDF house registration uploads directly to GCS.
5. Files over 10 MB and invalid MIME types are rejected.
6. Failed PUT/finalize can retry only that file without creating another registration.
7. Admin opens images and PDFs through `documentGetViewUrl`.
8. Admin downloads files.
9. Refresh and logout/login still allow a fresh signed GET URL.
10. Legacy Drive documents still open through the existing fallback.

Only after all checks pass may STAGING keep `GCS_DOCUMENTS_ENABLED=TRUE`. Production and Old Production @42 remain untouched.
