'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function InstallApp(){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [help,setHelp]=useState(false);
 const [installing,setInstalling]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 const toggleRef=useRef<HTMLButtonElement>(null);
 const installingRef=useRef(false);
 const [mobileDevice,setMobileDevice]=useState(false);
 const [collapsed,setCollapsed]=useState(false);
 useEffect(()=>{
  // iPadOS may identify itself as a Mac; touch support distinguishes it.
  setMobileDevice(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||
   (/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1));
  const displayMode=window.matchMedia('(display-mode: standalone)');
  const updateInstalled=()=>setInstalled(displayMode.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
  updateInstalled();
  displayMode.addEventListener('change',updateInstalled);
  const available=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)};
  const done=()=>{setInstalled(true);setPrompt(null)};
  window.addEventListener('beforeinstallprompt',available);
  window.addEventListener('appinstalled',done);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  return()=>{displayMode.removeEventListener('change',updateInstalled);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done)};
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
 return <><div className={'app-install'+(collapsed?' is-collapsed':'')}>
  <div className="app-install-controls">
   <button ref={toggleRef} type="button" className="app-install-toggle" aria-label={collapsed?'앱 설치 버튼 펼치기':'앱 설치 버튼 접기'} aria-expanded={!collapsed} aria-controls="app-install-action" onClick={()=>setCollapsed(!collapsed)}>{collapsed?'<':'>'}</button>
   <button type="button" id="app-install-action" hidden={collapsed} onClick={()=>{setCollapsed(true);setUnavailable(false);setHelp(true)}}>앱 설치하기</button>
  </div>
 </div>
 <Dialog open={help} onOpenChange={setHelp}>
  <DialogContent showCloseButton={false} className="install-dialog" onCloseAutoFocus={e=>{e.preventDefault();toggleRef.current?.focus()}}>
   <DialogTitle className="install-dialog-title">기억함 바로가기 앱을 설치하시겠습니까?</DialogTitle>
   <DialogDescription asChild><div className="install-dialog-description">
    <p>기억함은 플레이스토어에 공식 등록되어 있지 않아, 기기나 브라우저에 따라 설치 시 경고 문구가 표시될 수 있습니다.</p>
    <p className="install-dialog-hint">설치 안내 아래에 ‘무시하고 설치’가 표시되는 경우, 해당 문구를 찾아 터치하여 설치해주세요.</p>
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
