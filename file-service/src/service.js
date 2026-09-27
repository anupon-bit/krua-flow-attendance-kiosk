'use strict';

const crypto = require('node:crypto');
const {
  httpError,
  validateFinalizeRequest,
  validateMimeType,
  validateSize,
  validateUploadRequest,
  validateViewRequest
} = require('./validation');

const JSON_BODY_LIMIT = 64 * 1024;

function secureTokenMatch(header, expected) {
  const match = String(header || '').match(/^Bearer ([^\s]+)$/);
  if (!match) return false;
  const actualBuffer = Buffer.from(match[1]);
  const expectedBuffer = Buffer.from(String(expected || ''));
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function writeJson(response, status, value, origin) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > JSON_BODY_LIMIT) throw httpError(413, 'REQUEST_TOO_LARGE', 'request body is too large');
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('invalid');
    return parsed;
  } catch (error) {
    throw httpError(400, 'INVALID_JSON', 'request body must be valid JSON');
  }
}

function storageError(error, fallbackMessage) {
  if (error && Number(error.code) === 404) return httpError(404, 'OBJECT_NOT_FOUND', 'object was not found');
  const mapped = httpError(502, 'STORAGE_ERROR', fallbackMessage);
  mapped.cause = error;
  return mapped;
}

function detectedMimeType(bytes) {
  const data = Buffer.from(bytes || []);
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'image/png';
  if (data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  return '';
}

function createHandler(options) {
  const storage = options.storage;
  const bucketName = String(options.bucketName || '');
  const authToken = String(options.authToken || '');
  const allowedOrigins = new Set(options.allowedOrigins || []);
  const uploadTtlMs = Number(options.uploadTtlMs) || 600000;
  const viewTtlMs = Number(options.viewTtlMs) || 300000;
  const maxBytes = Number(options.maxBytes) || 10485760;
  const now = options.now || (() => Date.now());
  if (!storage || !bucketName || !authToken) throw new Error('File Service configuration is incomplete');

  return async function handler(request, response) {
    const origin = String(request.headers.origin || '');
    const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : '';
    try {
      if (origin && !allowedOrigin) throw httpError(403, 'ORIGIN_NOT_ALLOWED', 'origin is not allowed');
      if (request.method === 'OPTIONS') {
        if (!origin) throw httpError(400, 'ORIGIN_REQUIRED', 'origin is required');
        response.statusCode = 204;
        response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        response.setHeader('Access-Control-Max-Age', '3600');
        response.setHeader('Vary', 'Origin');
        response.end();
        return;
      }
      if (request.method !== 'POST') throw httpError(405, 'METHOD_NOT_ALLOWED', 'method is not allowed');
      if (!secureTokenMatch(request.headers.authorization, authToken)) {
        throw httpError(401, 'UNAUTHORIZED', 'authorization failed');
      }

      const body = await readJson(request);
      const bucket = storage.bucket(bucketName);

      if (request.url === '/v1/uploads') {
        const data = validateUploadRequest(body, maxBytes);
        const expiresAt = new Date(now() + uploadTtlMs);
        const requiredHeaders = {
          'Content-Type': data.mimeType,
          'x-goog-if-generation-match': '0',
          'x-goog-content-length-range': data.size + ',' + data.size
        };
        let uploadUrl;
        try {
          [uploadUrl] = await bucket.file(data.objectKey).getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: expiresAt,
            contentType: data.mimeType,
            extensionHeaders: {
              'x-goog-if-generation-match': '0',
              'x-goog-content-length-range': data.size + ',' + data.size
            }
          });
        } catch (error) {
          throw storageError(error, 'could not create upload URL');
        }
        writeJson(response, 200, {
          documentId: data.documentId,
          bucket: bucketName,
          objectKey: data.objectKey,
          uploadUrl,
          expiresAt: expiresAt.toISOString(),
          requiredHeaders
        }, allowedOrigin);
        return;
      }

      if (request.url === '/v1/uploads/finalize') {
        const data = validateFinalizeRequest(body, maxBytes);
        const file = bucket.file(data.objectKey);
        let metadata, signature;
        try {
          [metadata] = await file.getMetadata();
          [signature] = await file.download({ start:0, end:15 });
        } catch (error) {
          throw storageError(error, 'could not verify uploaded object');
        }
        const actualSize = validateSize(metadata.size, maxBytes);
        const actualMimeType = validateMimeType(metadata.contentType);
        const contentMimeType = detectedMimeType(signature);
        if (actualSize !== data.expectedSize || actualMimeType !== data.expectedMimeType || contentMimeType !== data.expectedMimeType) {
          throw httpError(422, 'UPLOAD_MISMATCH', 'uploaded object does not match the expected size or MIME type');
        }
        const checksum = metadata.md5Hash ? 'md5:' + metadata.md5Hash : metadata.crc32c ? 'crc32c:' + metadata.crc32c : '';
        writeJson(response, 200, {
          ok: true,
          documentId: data.documentId,
          objectKey: data.objectKey,
          size: actualSize,
          mimeType: actualMimeType,
          checksum,
          generation: String(metadata.generation || '')
        }, allowedOrigin);
        return;
      }

      if (request.url === '/v1/views') {
        const data = validateViewRequest(body);
        const file = bucket.file(data.objectKey);
        let metadata;
        try {
          [metadata] = await file.getMetadata();
        } catch (error) {
          throw storageError(error, 'could not verify view object');
        }
        validateSize(metadata.size, maxBytes);
        validateMimeType(metadata.contentType);
        const expiresAt = new Date(now() + viewTtlMs);
        let url;
        try {
          [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
        } catch (error) {
          throw storageError(error, 'could not create view URL');
        }
        writeJson(response, 200, {
          documentId: data.documentId,
          objectKey: data.objectKey,
          url,
          expiresAt: expiresAt.toISOString(),
          mimeType: String(metadata.contentType),
          size: Number(metadata.size)
        }, allowedOrigin);
        return;
      }

      throw httpError(404, 'NOT_FOUND', 'route was not found');
    } catch (error) {
      const status = Number(error && error.status) || 500;
      const code = String(error && error.code || 'INTERNAL_ERROR');
      if (status >= 500) console.error(JSON.stringify({ event:'file_service_error', path:String(request.url || ''), status, code }));
      writeJson(response, status, { error: error && error.message ? error.message : 'internal error', code }, allowedOrigin);
    }
  };
}

module.exports = { createHandler, detectedMimeType, secureTokenMatch };
