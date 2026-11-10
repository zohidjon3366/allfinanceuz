'use strict';
const assert = require('node:assert/strict');
const guard = require('./consult-security');
const req = ip => ({ headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, socket: { remoteAddress: '127.0.0.1' } });
const a = req('198.51.100.10');
assert.equal(guard.preflight(a).ok, true);
assert.equal(guard.preflight(a).ok, true);
assert.equal(guard.preflight(a).ok, true);
assert.equal(guard.preflight(a).ok, false);
assert.equal(guard.preflight(req('198.51.100.11')).ok, true);
// Behind the same proxy, two real visitors must get different buckets.
const proxied = real => ({headers:{'content-type':'application/json','x-forwarded-for':real+', 10.0.0.1'},socket:{remoteAddress:'10.0.0.1'}});
assert.equal(guard.preflight(proxied('198.51.100.12')).ok,true);
assert.equal(guard.preflight(proxied('198.51.100.12')).ok,true);
assert.equal(guard.preflight(proxied('198.51.100.12')).ok,true);
assert.equal(guard.preflight(proxied('198.51.100.12')).ok,false);
assert.equal(guard.preflight(proxied('198.51.100.13')).ok,true);
// Flooding from multiple addresses cannot trigger a shared global 429 bucket.
for(let i=1;i<=80;i++) assert.equal(guard.preflight(req('203.0.113.'+i)).ok,true);
// Large numbers of IPs are handled without repeated O(n) pruning per request.
for(let i=0;i<5400;i++) assert.equal(guard.preflight(req('2001:db8::'+i.toString(16))).ok,true);
assert.equal(guard.preflight({headers:{'content-type':'text/plain'},socket:{remoteAddress:'127.0.0.1'}}).status,415);
const d = guard.validate({name:' Bob ',phone:'+998 (90) 123 45 67',company:' Test ',service:'Audit',comment:' Hello '});
assert.equal(d.name,'Bob');
assert.equal(d.comment,'Hello');
assert.throws(()=>guard.validate({name:'a',phone:'111'}));
assert.throws(()=>guard.validate({name:'Bob',phone:'123456789',comment:[] }));
const now = Date.now();
const old = {...d, createdAt:new Date(now-5*60_000).toISOString()};
assert.equal(guard.isDuplicate({...d,service:'Other'},[old],now),true);
const old2 = {...d, createdAt:new Date(now-2*60*60_000).toISOString()};
assert.equal(guard.isDuplicate({...d},[old2],now),true);
assert.equal(guard.isDuplicate({...d,comment:'different'},[old2],now),false);
console.log('Security guard tests passed');
