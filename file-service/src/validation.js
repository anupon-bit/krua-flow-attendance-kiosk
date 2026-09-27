'use strict';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]);
const OBJECT_ROOTS = new Set(['persons', 'applicants', 'employees', 'leave', 'registrations']);
const SIMPLE_ID = /^[A-Za-z0-9_-]+$/;
const SAFE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function safeFileName(name) {
  const clean = String(name || 'file')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120);
  return clean || 'file';
}

function validateDocumentId(value) {
  const documentId = String(value || '');
  if (!/^DOC-[A-Za-z0-9_-]{3,}$/.test(documentId)) {
    throw httpError(400, 'INVALID_DOCUMENT_ID', 'documentId is invalid');
  }
  return documentId;
}

function validateMimeType(value) {
  const mimeType = String(value || '').trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw httpError(400, 'INVALID_MIME_TYPE', 'mimeType is not allowed');
  }
  return mimeType;
}

function validateSize(value, maxBytes) {
  const size = Number(value);
  if (!Number.isSafeInteger(size) || size <= 0 || size > maxBytes) {
    throw httpError(400, 'INVALID_SIZE', 'size is outside the allowed range');
  }
  return size;
}

function validateObjectKey(value, documentId, fileName) {
  const objectKey = String(value || '');
  if (!objectKey || objectKey.length > 512 || objectKey.includes('..') || objectKey.includes('\\') || objectKey.startsWith('/')) {
    throw httpError(400, 'INVALID_OBJECT_KEY', 'objectKey is invalid');
  }
  const parts = objectKey.split('/');
  if (
    parts.length !== 5 ||
    !OBJECT_ROOTS.has(parts[0]) ||
    !SIMPLE_ID.test(parts[1]) ||
    parts[2] !== 'documents' ||
    parts[3] !== documentId ||
    !SAFE_FILE_NAME.test(parts[4])
  ) {
    throw httpError(400, 'INVALID_OBJECT_KEY', 'objectKey is invalid');
  }
  if (fileName !== undefined && parts[4] !== safeFileName(fileName)) {
    throw httpError(400, 'INVALID_OBJECT_KEY', 'objectKey does not match fileName');
  }
  return objectKey;
}

function validateUploadRequest(body, maxBytes) {
  const documentId = validateDocumentId(body && body.documentId);
  const fileName = String(body && body.fileName || '').trim();
  if (!fileName || fileName.length > 255) throw httpError(400, 'INVALID_FILE_NAME', 'fileName is invalid');
  const mimeType = validateMimeType(body && body.mimeType);
  const size = validateSize(body && body.size, maxBytes);
  const objectKey = validateObjectKey(body && body.objectKey, documentId, fileName);
  return { documentId, fileName, mimeType, size, objectKey };
}

function validateFinalizeRequest(body, maxBytes) {
  const documentId = validateDocumentId(body && body.documentId);
  const objectKey = validateObjectKey(body && body.objectKey, documentId);
  const expectedMimeType = validateMimeType(body && body.expectedMimeType);
  const expectedSize = validateSize(body && body.expectedSize, maxBytes);
  return { documentId, objectKey, expectedMimeType, expectedSize };
}

function validateViewRequest(body) {
  const documentId = validateDocumentId(body && body.documentId);
  const objectKey = validateObjectKey(body && body.objectKey, documentId);
  return { documentId, objectKey };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  httpError,
  safeFileName,
  validateFinalizeRequest,
  validateMimeType,
  validateObjectKey,
  validateSize,
  validateUploadRequest,
  validateViewRequest
};
