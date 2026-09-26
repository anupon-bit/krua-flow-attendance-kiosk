'use strict';
const assert=require('node:assert/strict');
const core=require('../apps-script/WorkforceV2.js');

assert.equal(core.normalizePhone('+66 81-234-5678'),'0812345678');
assert.equal(core.normalizePhone('081 234 5678'),'0812345678');
assert.equal(core.canTransition('SUBMITTED','SCREENING'),true);
assert.equal(core.canTransition('SUBMITTED','HIRED'),false);
assert.equal(core.canTransition('OFFER_SENT','OFFER_ACCEPTED'),true);
assert.equal(core.ratio(8,10),80);
assert.equal(core.ratio(1,0),null);
assert.equal(core.safeFileName(' สำเนา บัตรประชาชน.pdf '),'pdf');
assert.equal(core.buildObjectKey('EMPLOYEE','E002','DOC-ABC123','id card.pdf'),'employees/E002/documents/DOC-ABC123/id-card.pdf');
assert.throws(()=>core.buildObjectKey('EMPLOYEE','../E002','DOC-1','a.pdf'),/Document owner/);
assert.deepEqual(core.validateWeights([{weight:20},{weight:80}]),{valid:true,total:100});
assert.deepEqual(core.validateWeights([{weight:20},{weight:70}]),{valid:false,total:90});
console.log('workforce-v2 tests: pass');
