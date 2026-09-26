(function (global) {
  'use strict';

  const SESSION_KEY = 'kruaFlowAdminTokenV4';
  const PERSIST_KEY = 'kruaFlowAdminTokenPersistentV1';
  const EXPIRY_KEY = 'kruaFlowAdminTokenPersistentExpV1';
  const DEFAULT_TTL_SECONDS = 14400;

  function ttlMilliseconds(expiresInSeconds) {
    const seconds = Number(expiresInSeconds);
    const safeSeconds = Number.isFinite(seconds) && seconds >= 1 ? Math.min(seconds, 86400) : DEFAULT_TTL_SECONDS;
    return safeSeconds * 1000;
  }

  function clear() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }

  function get() {
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    if (!expiry || expiry <= Date.now()) {
      clear();
      return '';
    }
    const session = sessionStorage.getItem(SESSION_KEY) || '';
    if (session) return session;
    const persisted = localStorage.getItem(PERSIST_KEY) || '';
    if (!persisted) {
      clear();
      return '';
    }
    sessionStorage.setItem(SESSION_KEY, persisted);
    return persisted;
  }

  function save(token, expiresInSeconds) {
    const value = String(token || '');
    if (!value) {
      clear();
      return '';
    }
    sessionStorage.setItem(SESSION_KEY, value);
    localStorage.setItem(PERSIST_KEY, value);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + ttlMilliseconds(expiresInSeconds)));
    return value;
  }

  function touch(expiresInSeconds) {
    const token = get();
    if (!token) return false;
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + ttlMilliseconds(expiresInSeconds)));
    return true;
  }

  function remainingSeconds() {
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
  }

  function isAuthError(error) {
    const message = String(error && error.message ? error.message : error || '');
    return /สิทธิ์\s*Admin\s*หมดอายุ|Admin.*หมดอายุ|token.*expired|session.*expired|unauthori[sz]ed/i.test(message);
  }

  global.KruaFlowAdminSession = Object.freeze({
    clear: clear,
    defaultTtlSeconds: DEFAULT_TTL_SECONDS,
    expiryKey: EXPIRY_KEY,
    get: get,
    isAuthError: isAuthError,
    persistentKey: PERSIST_KEY,
    remainingSeconds: remainingSeconds,
    save: save,
    sessionKey: SESSION_KEY,
    touch: touch
  });
})(window);
