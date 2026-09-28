'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const page = fs.readFileSync('admin-settings.html', 'utf8');
const backend = fs.readFileSync('apps-script/รหัส.js', 'utf8');
const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(x => x[1]);
scripts.forEach((source, index) => new vm.Script(source, {filename:'admin-settings.html#inline-'+(index+1)}));

assert.match(page, /p\.requestId=id;p\.clientOrigin=location\.origin/, 'settings API calls must provide their real client origin');
assert.match(page, /if\(state\.permissionSaving\)return/, 'permission save must reject duplicate submissions');

const saveFunction = page.match(/async function savePermissionSetup\(\)\{([\s\S]*?)\n\}/);
assert.ok(saveFunction, 'permission save function must exist');
assert.doesNotMatch(saveFunction[1], /await loadSelectedManagerScopes\(/, 'permission save must not make a second scope reload request');
assert.match(saveFunction[1], /saved\.scope\|\|Object\.assign/, 'permission save must use the authoritative save response');
assert.match(saveFunction[1], /state\.scopeLoadedFor\[id\]=true/, 'saved scope must remain loaded in local state');

assert.match(backend, /const target=clientOrigin\?JSON\.stringify\(clientOrigin\):'"\*"'/, 'postMessage must target the validated client origin');
assert.match(backend, /return clientOrigin\?output\.setXFrameOptionsMode\(HtmlService\.XFrameOptionsMode\.ALLOWALL\):output/, 'validated clients must receive the iframe response directly');
assert.match(backend, /return\{ok:true,scopeId:savedScope\.scopeId,scope:savedScope,accessRole:role\}/, 'scope save must return the saved scope');

console.log('admin settings permission tests: pass');
