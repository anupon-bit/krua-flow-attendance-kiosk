'use strict';

const http = require('node:http');
const { Storage } = require('@google-cloud/storage');
const { loadConfig } = require('./config');
const { createHandler } = require('./service');

const config = loadConfig();
const handler = createHandler({
  storage: new Storage(),
  bucketName: config.bucketName,
  authToken: config.authToken,
  allowedOrigins: config.allowedOrigins,
  uploadTtlMs: config.uploadTtlMs,
  viewTtlMs: config.viewTtlMs,
  maxBytes: config.maxBytes
});

http.createServer(handler).listen(config.port, '0.0.0.0', () => {
  console.log(JSON.stringify({ event:'file_service_started', port:config.port }));
});
