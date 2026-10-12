/** Disposable, account-scoped cache. Firestore remains the source of truth. */
const DB_NAME='gieokham-encrypted-cache';
const STORE='accounts';
type Entry={uid:string;token:string;key:CryptoKey;iv?:Uint8Array;cipher?:ArrayBuffer};
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 const request=indexedDB.open(DB_NAME,1);
 request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'uid'});
 request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db)};
 request.onerror=()=>reject(request.error);
 request.onblocked=()=>reject(new Error('기기 저장소가 다른 탭에서 사용 중입니다.'));
})}
async function transact<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,done:(value:T)=>void)=>void):Promise<T>{
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode);let result:T;
  tx.oncomplete=()=>{db.close();resolve(result)};
  tx.onabort=()=>{db.close();reject(tx.error||new Error('기기 저장 작업 실패'))};
  tx.onerror=()=>{};
  try{run(tx.objectStore(STORE),value=>{result=value})}catch(e){tx.abort();db.close();reject(e)}
 });
}
export function removeLegacyMemoCopies(){
 // Remove only known memo payload keys; preserve unrelated preferences/auth state.
 for(const key of Object.keys(localStorage))if(key==='gieokham-v1'||key.startsWith('gieokham-v1:'))localStorage.removeItem(key);
}
export async function clearEncryptedCache(){
 await transact<void>('readwrite',(store,done)=>{store.clear();done()});
}
export async function createAccountCache(uid:string,active:()=>boolean){
 const generated=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 if(!active())return null;
 const entry=await transact<Entry|null>('readwrite',(store,done)=>{
  const request=store.get(uid);
  request.onsuccess=()=>{
   if(!active()){done(null);return}
   const existing=request.result as Entry|undefined;
   if(existing){done(existing);return}
   const fresh:Entry={uid,token:crypto.randomUUID(),key:generated};store.put(fresh);done(fresh);
  };
 });
 if(!entry||!active())return null;
 if(entry.key.extractable||entry.key.algorithm.name!=='AES-GCM')throw new Error('잘못된 캐시 키');
 let queue:Promise<void>=Promise.resolve();
 const aad=new TextEncoder().encode('gieokham-cache-v1:'+uid);
 return {
  async read():Promise<unknown|null>{
   if(!active()||!entry.cipher||!entry.iv)return null;
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:entry.iv as Uint8Array<ArrayBuffer>,additionalData:aad},entry.key,entry.cipher);
   return active()?JSON.parse(new TextDecoder().decode(plain)):null;
  },
  write(value:unknown):Promise<void>{
   const json=JSON.stringify(value);
   const job=queue.catch(()=>{}).then(async()=>{
    if(!active())return;
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},entry.key,new TextEncoder().encode(json));
    if(!active())return;
    await transact<void>('readwrite',(store,done)=>{
     const request=store.get(uid);
     request.onsuccess=()=>{
      // A logout in any tab deletes this token. Never resurrect deleted entries.
      if(active()&&request.result?.token===entry.token)store.put({...entry,iv,cipher});
      done();
     };
    });
   });queue=job;return job;
  }
 };
}
