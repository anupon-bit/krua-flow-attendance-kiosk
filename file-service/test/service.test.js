'use strict';

const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const test = require('node:test');
const { createHandler } = require('../src/service');

const TOKEN = 'test-token-with-enough-entropy';
const NOW = Date.parse('2026-09-27T00:00:00.000Z');
const IMAGE = {
  documentId: 'DOC-20260927000000-ABC123',
  objectKey: 'registrations/REG-20260927-ABC123/documents/DOC-20260927000000-ABC123/id-card.jpg',
  fileName: 'id card.jpg',
  mimeType: 'image/jpeg',
  size: 12345
};
const PDF = {
  documentId: 'DOC-20260927000001-DEF456',
  objectKey: 'registrations/REG-20260927-ABC123/documents/DOC-20260927000001-DEF456/house.pdf',
  fileName: 'house.pdf',
  mimeType: 'application/pdf',
  size: 54321
};

class FakeStorage {
  constructor() {
    this.calls = [];
    this.metadata = new Map();
    this.contents = new Map();
    this.signError = null;
  }
  bucket(name) {
    return {
      file: key => ({
        getSignedUrl: async options => {
          this.calls.push({ name, key, options });
          if (this.signError) throw this.signError;
          return ['https://storage.test/' + encodeURIComponent(key) + '?signed=1'];
        },
        getMetadata: async () => {
          if (!this.metadata.has(key)) throw Object.assign(new Error('missing'), { code:404 });
          return [this.metadata.get(key)];
        },
        download: async () => {
          if (!this.contents.has(key)) throw Object.assign(new Error('missing'), { code:404 });
          return [this.contents.get(key)];
        }
      })
    };
  }
}

async function withService(run) {
  const storage = new FakeStorage();
  const handler = createHandler({
    storage,
    bucketName:'test-private-bucket',
    authToken:TOKEN,
    allowedOrigins:['https://anupon-bit.github.io','http://localhost:8081'],
    uploadTtlMs:600000,
    viewTtlMs:300000,
    maxBytes:10485760,
    now:() => NOW
  });
  const post = async (path, body, token = TOKEN, origin = '') => {
    const headers = { 'content-type':'application/json' };
    if (token) headers.authorization = 'Bearer ' + token;
    if (origin) headers.origin = origin;
    const request = Readable.from([Buffer.from(JSON.stringify(body))]);
    request.method = 'POST';
    request.url = path;
    request.headers = headers;
    const responseHeaders = new Map();
    const response = {
      statusCode:200,
      body:'',
      setHeader(name, value) { responseHeaders.set(String(name).toLowerCase(), String(value)); },
      end(value) { this.body = value === undefined ? '' : String(value); }
    };
    await handler(request, response);
    return {
      status:response.statusCode,
      body:response.body ? JSON.parse(response.body) : {},
      headers:{ get:name => responseHeaders.get(String(name).toLowerCase()) || null }
    };
  };
  await run({ storage, post });
}

test('unauthorized and invalid bearer access are rejected', async () => {
  await withService(async ({ post }) => {
    assert.equal((await post('/v1/uploads', IMAGE, '')).status, 401);
    assert.equal((await post('/v1/uploads', IMAGE, 'wrong-token')).status, 401);
  });
});

test('valid image upload session is signed for ten minutes without overwrite', async () => {
  await withService(async ({ storage, post }) => {
    const result = await post('/v1/uploads', IMAGE, TOKEN, 'https://anupon-bit.github.io');
    assert.equal(result.status, 200);
    assert.equal(result.body.expiresAt, '2026-09-27T00:10:00.000Z');
    assert.equal(result.body.requiredHeaders['Content-Type'], 'image/jpeg');
    assert.equal(result.body.requiredHeaders['x-goog-if-generation-match'], '0');
    assert.equal(result.body.requiredHeaders['x-goog-content-length-range'], IMAGE.size + ',' + IMAGE.size);
    assert.equal(result.headers.get('access-control-allow-origin'), 'https://anupon-bit.github.io');
    assert.equal(storage.calls[0].options.action, 'write');
    assert.equal(storage.calls[0].options.extensionHeaders['x-goog-if-generation-match'], '0');
    assert.equal(storage.calls[0].options.extensionHeaders['x-goog-content-length-range'], IMAGE.size + ',' + IMAGE.size);
  });
});

test('valid PDF upload session is accepted', async () => {
  await withService(async ({ post }) => {
    const result = await post('/v1/uploads', PDF);
    assert.equal(result.status, 200);
    assert.equal(result.body.requiredHeaders['Content-Type'], 'application/pdf');
  });
});

test('invalid MIME type is rejected', async () => {
  await withService(async ({ post }) => {
    const result = await post('/v1/uploads', { ...IMAGE, mimeType:'image/gif' });
    assert.equal(result.status, 400);
    assert.equal(result.body.code, 'INVALID_MIME_TYPE');
  });
});

test('files over 10 MB are rejected', async () => {
  await withService(async ({ post }) => {
    const result = await post('/v1/uploads', { ...IMAGE, size:10485761 });
    assert.equal(result.status, 400);
    assert.equal(result.body.code, 'INVALID_SIZE');
  });
});

test('invalid object key and browser-selected path are rejected', async () => {
  await withService(async ({ post }) => {
    const traversal = await post('/v1/uploads', { ...IMAGE, objectKey:'registrations/../secret.jpg' });
    assert.equal(traversal.status, 400);
    const wrongName = await post('/v1/uploads', { ...IMAGE, objectKey:IMAGE.objectKey.replace('id-card.jpg', 'other.jpg') });
    assert.equal(wrongName.status, 400);
    assert.equal(wrongName.body.code, 'INVALID_OBJECT_KEY');
  });
});

test('finalize succeeds only when stored size and MIME match', async () => {
  await withService(async ({ storage, post }) => {
    storage.metadata.set(IMAGE.objectKey, { size:String(IMAGE.size), contentType:IMAGE.mimeType, md5Hash:'abc=', generation:'7' });
    storage.contents.set(IMAGE.objectKey, Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10]));
    const request = { documentId:IMAGE.documentId, objectKey:IMAGE.objectKey, expectedSize:IMAGE.size, expectedMimeType:IMAGE.mimeType };
    const success = await post('/v1/uploads/finalize', request);
    assert.equal(success.status, 200);
    assert.equal(success.body.checksum, 'md5:abc=');
    const mismatch = await post('/v1/uploads/finalize', { ...request, expectedSize:IMAGE.size + 1 });
    assert.equal(mismatch.status, 422);
    assert.equal(mismatch.body.code, 'UPLOAD_MISMATCH');
    storage.contents.set(IMAGE.objectKey, Buffer.from('%PDF-1.7'));
    const disguised = await post('/v1/uploads/finalize', request);
    assert.equal(disguised.status, 422);
    assert.equal(disguised.body.code, 'UPLOAD_MISMATCH');
  });
});

test('finalize fails when the object is absent', async () => {
  await withService(async ({ post }) => {
    const result = await post('/v1/uploads/finalize', { documentId:IMAGE.documentId, objectKey:IMAGE.objectKey, expectedSize:IMAGE.size, expectedMimeType:IMAGE.mimeType });
    assert.equal(result.status, 404);
    assert.equal(result.body.code, 'OBJECT_NOT_FOUND');
  });
});

test('signed view succeeds and expires after five minutes', async () => {
  await withService(async ({ storage, post }) => {
    storage.metadata.set(PDF.objectKey, { size:String(PDF.size), contentType:PDF.mimeType, generation:'9' });
    const result = await post('/v1/views', { documentId:PDF.documentId, objectKey:PDF.objectKey });
    assert.equal(result.status, 200);
    assert.equal(result.body.expiresAt, '2026-09-27T00:05:00.000Z');
    assert.equal(result.body.mimeType, 'application/pdf');
    assert.equal(storage.calls[0].options.action, 'read');
  });
});

test('invalid origin and signing failure do not expose a signed URL', async () => {
  await withService(async ({ storage, post }) => {
    const denied = await post('/v1/uploads', IMAGE, TOKEN, 'https://evil.example');
    assert.equal(denied.status, 403);
    storage.signError = new Error('expired signing credential');
    const failed = await post('/v1/uploads', IMAGE);
    assert.equal(failed.status, 502);
    assert.equal(failed.body.code, 'STORAGE_ERROR');
    assert.equal(Object.hasOwn(failed.body, 'uploadUrl'), false);
  });
});
