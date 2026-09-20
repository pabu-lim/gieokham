'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,X} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
const INSTALL_EVENT='gieokham:open-install';
const SEEN_KEY='gieokham:install-intro-seen:v1';
let introSeenThisSession=false;
function isMobileDevice(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1)}
function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone)}
export function InstallMenuButton(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const mode=window.matchMedia('(display-mode: standalone)');const update=()=>setVisible(isMobileDevice()&&!isStandalone());const installed=()=>setVisible(false);update();mode.addEventListener('change',update);window.addEventListener('appinstalled',installed);return()=>{mode.removeEventListener('change',update);window.removeEventListener('appinstalled',installed)}},[]);
 if(!visible)return null;
 return <button type="button" className="settings-button install-menu-button" onClick={()=>window.dispatchEvent(new Event(INSTALL_EVENT))}><Download size={17}/>앱 설치하기</button>;
}
export function InstallApp(){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [help,setHelp]=useState(false);
 const [installing,setInstalling]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 const returnFocus=useRef<HTMLElement|null>(null);
 const introChecked=useRef(false);
 const installingRef=useRef(false);
 const [mobileDevice,setMobileDevice]=useState(false);
 const [showIntro,setShowIntro]=useState(false);
 useEffect(()=>{
  setMobileDevice(isMobileDevice());
  if(!introChecked.current&&isMobileDevice()&&!isStandalone()){
   introChecked.current=true;
   let seen=introSeenThisSession;
   try{seen=seen||localStorage.getItem(SEEN_KEY)==='1';localStorage.setItem(SEEN_KEY,'1')}catch{}
   introSeenThisSession=true;
   setShowIntro(!seen);
  }
  const open=()=>{returnFocus.current=document.activeElement as HTMLElement|null;setShowIntro(false);setUnavailable(false);setHelp(true)};
  window.addEventListener(INSTALL_EVENT,open);
  const displayMode=window.matchMedia('(display-mode: standalone)');
  const updateInstalled=()=>setInstalled(displayMode.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
  updateInstalled();
  displayMode.addEventListener('change',updateInstalled);
  const available=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)};
  const done=()=>{setInstalled(true);setPrompt(null)};
  window.addEventListener('beforeinstallprompt',available);
  window.addEventListener('appinstalled',done);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  return()=>{window.removeEventListener(INSTALL_EVENT,open);displayMode.removeEventListener('change',updateInstalled);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done)};
 },[]);
 if(installed||!mobileDevice)return null;
 async function install(){
  if(installingRef.current)return;
  if(!prompt){setUnavailable(true);return}
  installingRef.current=true;setInstalling(true);setUnavailable(false);
  try{await prompt.prompt();await prompt.userChoice;setPrompt(null);setHelp(false)}
  catch{setPrompt(null);setUnavailable(true)}
  finally{installingRef.current=false;setInstalling(false)}
 }
 return <>{showIntro&&<div className="app-install">
  <div className="app-install-controls">
   <button type="button" onClick={()=>window.dispatchEvent(new Event(INSTALL_EVENT))}>앱 설치하기</button>
   <button type="button" className="app-install-dismiss" aria-label="앱 설치 안내 닫기" onClick={()=>setShowIntro(false)}><X size={18}/></button>
  </div>
 </div>}
 <Dialog open={help} onOpenChange={setHelp}>
  <DialogContent showCloseButton={false} className="install-dialog" onCloseAutoFocus={e=>{e.preventDefault();(returnFocus.current?.isConnected?returnFocus.current:document.querySelector<HTMLElement>('.install-menu-button, .quick-entry input'))?.focus()}}>
   <DialogTitle className="install-dialog-title">기억함 바로가기 앱을 설치하시겠습니까?</DialogTitle>
   <DialogDescription asChild><div className="install-dialog-description">
    <p>기억함은 플레이스토어에 공식 등록되어 있지 않아, 기기나 브라우저에 따라 설치 시 경고 문구가 표시될 수 있습니다.</p>
    <p className="install-dialog-hint">‘세부정보 더보기’를 터치하고 표시되는 안내사항 아래에 ‘무시하고 설치하기’가 표시되는 경우, 해당 문구를 찾아 터치하여 설치해주세요.</p>
    <p>아무 반응이 없는 경우 삼성 브라우저(인터넷)를 통해 이 사이트에 다시 접속 후 설치를 눌러주세요.</p>
   </div></DialogDescription>
   {unavailable&&<p className="install-dialog-status" role="status">현재 브라우저에서 설치 창을 열 수 없습니다. 갤럭시는 삼성 인터넷으로 다시 접속하거나 메뉴의 ‘홈 화면에 추가’를 이용해주세요. iPhone·iPad는 Safari 공유 메뉴의 ‘홈 화면에 추가’를 이용해주세요.</p>}
   <div className="install-dialog-actions">
    <button type="button" className="install-dialog-cancel" onClick={()=>setHelp(false)}>설치 안 함</button>
    <button type="button" className="install-dialog-confirm" disabled={installing} onClick={install}>{installing?'설치 창 여는 중…':'설치하기'}</button>
   </div>
  </DialogContent>
 </Dialog></>
}
