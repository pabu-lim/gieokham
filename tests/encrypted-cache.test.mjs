// Run: node --test tests/encrypted-cache.test.mjs
// Requires fake-indexeddb (or set FAKE_INDEXEDDB_MODULE to its auto module path).
import assert from 'node:assert/strict';
import {test} from 'node:test';
await import(process.env.FAKE_INDEXEDDB_MODULE||'fake-indexeddb/auto');
const {createAccountCache,clearEncryptedCache,removeLegacyMemoCopies,expireAccountCache,CACHE_TTL_MS}=await import('../lib/encrypted-cache.ts');
async function entry(uid,update){
 const db=await new Promise((ok,no)=>{const r=indexedDB.open('gieokham-encrypted-cache',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
 return new Promise((ok,no)=>{const tx=db.transaction('accounts',update?'readwrite':'readonly');let result;const r=tx.objectStore('accounts').get(uid);r.onsuccess=()=>{result=r.result;if(update)tx.objectStore('accounts').put(update(result))};tx.oncomplete=()=>{db.close();ok(result)};tx.onabort=()=>{db.close();no(tx.error)}});
}
test('encrypted cache lifecycle, isolation and logout races',async()=>{
 await clearEncryptedCache();
 let active=true;
 const a=await createAccountCache('a',()=>active);
 const memo={tasks:[{text:'개인 메모 원문'}]};
 await a.write(memo);
 const stored=await entry('a');
 assert.equal(stored.key.extractable,false);
 await assert.rejects(crypto.subtle.exportKey('raw',stored.key));
 assert.equal(new TextDecoder().decode(stored.cipher).includes('개인 메모'),false);
 const reopened=await createAccountCache('a',()=>active);
 assert.deepEqual(await reopened.read(),memo);
 const b=await createAccountCache('b',()=>true);
 assert.equal(await b.read(),null);
 await b.write({tasks:[]});
 // Even a copied ciphertext from another account fails authentication.
 await entry('b',v=>({...v,iv:stored.iv,cipher:stored.cipher}));
 await assert.rejects((await createAccountCache('b',()=>true)).read());
 // Same-key modification of ciphertext is detected as well.
 await entry('a',v=>{const bytes=new Uint8Array(v.cipher);bytes[0]^=1;return {...v,cipher:bytes.buffer}});
 await assert.rejects((await createAccountCache('a',()=>true)).read());
 await a.write({sequence:1});await a.write({sequence:2});
 assert.deepEqual(await (await createAccountCache('a',()=>true)).read(),{sequence:2});
 assert.notDeepEqual((await entry('a')).iv,stored.iv);
 // A write already queued at logout must not restore any entry.
 const pending=a.write(memo);active=false;
 await clearEncryptedCache();await pending;
 assert.equal(await entry('a'),undefined);assert.equal(await entry('b'),undefined);
 // Another tab with an old session also must not resurrect a deleted key.
 await b.write(memo);assert.equal(await entry('b'),undefined);
 let live=true;const opening=createAccountCache('late',()=>live);live=false;
 assert.equal(await opening,null);assert.equal(await entry('late'),undefined);
 const fresh=await createAccountCache('a',()=>true);
 assert.equal(await fresh.read(),null);
 assert.notEqual((await entry('a')).token,stored.token);
 await clearEncryptedCache();
});
test('legacy plaintext cleanup leaves unrelated preferences intact',()=>{
 globalThis.localStorage={'gieokham-v1':'plain','gieokham-v1:a':'plain',theme:'light',removeItem(k){delete this[k]}};
 removeLegacyMemoCopies();assert.equal(localStorage['gieokham-v1'],undefined);assert.equal(localStorage['gieokham-v1:a'],undefined);assert.equal(localStorage.theme,'light');
});

test('fixed 24-hour expiration, legacy entries and server-only recreation',async()=>{
 await clearEncryptedCache();
 const realNow=Date.now;let now=realNow();Date.now=()=>now;
 try{
  assert.equal(await createAccountCache('ttl',()=>true,false),null);
  assert.equal(await entry('ttl'),undefined);
  const session=await createAccountCache('ttl',()=>true);
  await session.write({text:'server snapshot'});
  const original=await entry('ttl');
  now+=CACHE_TTL_MS-1;
  await session.write({text:'updated'});
  assert.equal((await entry('ttl')).createdAt,original.createdAt);
  assert.deepEqual(await (await createAccountCache('ttl',()=>true,false)).read(),{text:'updated'});
  now++;
  assert.equal(await session.read(),null);
  assert.equal(await entry('ttl'),undefined);
  await session.write({text:'late write'});
  assert.equal(await entry('ttl'),undefined);
  assert.equal(await createAccountCache('ttl',()=>true,false),null);
  const replacement=await createAccountCache('ttl',()=>true,true);
  assert.equal(await replacement.read(),null);
  assert.notEqual((await entry('ttl')).token,original.token);
  assert.equal(replacement.expiresAt,now+CACHE_TTL_MS);
  // Legacy entries without a creation timestamp are discarded, never decrypted.
  await entry('ttl',v=>{delete v.createdAt;return v});
  assert.equal(await createAccountCache('ttl',()=>true,false),null);
  assert.equal(await entry('ttl'),undefined);
  await createAccountCache('timer',()=>true);
  now+=CACHE_TTL_MS;
  assert.equal(await expireAccountCache('timer'),true);
  assert.equal(await entry('timer'),undefined);
  // Clock rollback also invalidates the entry rather than extending its life.
  await createAccountCache('clock',()=>true);now--;
  assert.equal(await createAccountCache('clock',()=>true,false),null);
 }finally{Date.now=realNow;await clearEncryptedCache()}
});
