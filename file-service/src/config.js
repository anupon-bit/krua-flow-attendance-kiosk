'use strict';

function positiveInteger(value, fallback, name) {
  const parsed = Number(value === undefined || value === '' ? fallback : value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(name + ' must be a positive integer');
  return parsed;
}

function required(value, name) {
  const text = String(value || '').trim();
  if (!text) throw new Error(name + ' is required');
  return text;
}

function loadConfig(env = process.env) {
  return {
    bucketName: required(env.GCS_BUCKET, 'GCS_BUCKET'),
    authToken: required(env.FILE_SERVICE_AUTH_TOKEN, 'FILE_SERVICE_AUTH_TOKEN'),
    allowedOrigins: String(env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
    uploadTtlMs: positiveInteger(env.UPLOAD_URL_TTL_SECONDS, 600, 'UPLOAD_URL_TTL_SECONDS') * 1000,
    viewTtlMs: positiveInteger(env.VIEW_URL_TTL_SECONDS, 300, 'VIEW_URL_TTL_SECONDS') * 1000,
    maxBytes: positiveInteger(env.DOCUMENT_MAX_BYTES, 10 * 1024 * 1024, 'DOCUMENT_MAX_BYTES'),
    port: positiveInteger(env.PORT, 8080, 'PORT')
  };
}

module.exports = { loadConfig };
