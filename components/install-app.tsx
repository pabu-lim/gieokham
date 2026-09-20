'use client';
import {useEffect,useState} from 'react';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function InstallApp(){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [help,setHelp]=useState(false);
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
  if(!prompt){setHelp(!help);return}
  try{await prompt.prompt();await prompt.userChoice;setPrompt(null)}catch{setHelp(true)}
 }
 return <div className={'app-install'+(collapsed?' is-collapsed':'')}>
  <div className="app-install-controls">
   <button type="button" className="app-install-toggle" aria-label={collapsed?'앱 설치 버튼 펼치기':'앱 설치 버튼 접기'} aria-expanded={!collapsed} aria-controls="app-install-action" onClick={()=>{setCollapsed(!collapsed);setHelp(false)}}>{collapsed?'<':'>'}</button>
   <button type="button" id="app-install-action" hidden={collapsed} onClick={install}>앱 설치하기</button>
  </div>
  {!collapsed&&help&&<div className="app-install-help" role="status">갤럭시는 Chrome 또는 삼성 인터넷 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를, iPhone·iPad는 Safari 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요.<button type="button" aria-label="설치 안내 닫기" onClick={()=>setHelp(false)}>닫기</button></div>}
 </div>
}
