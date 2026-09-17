'use client';
import {useEffect,useState} from 'react';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function InstallApp(){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [help,setHelp]=useState(false);
 useEffect(()=>{
  setInstalled(window.matchMedia('(display-mode: standalone)').matches);
  const available=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)};
  const done=()=>{setInstalled(true);setPrompt(null)};
  window.addEventListener('beforeinstallprompt',available);
  window.addEventListener('appinstalled',done);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  return()=>{window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',done)};
 },[]);
 if(installed)return null;
 async function install(){
  if(!prompt){setHelp(!help);return}
  try{await prompt.prompt();await prompt.userChoice;setPrompt(null)}catch{setHelp(true)}
 }
 return <div className="app-install"><button onClick={install}>기억함 앱 설치</button>{help&&<div role="status">갤럭시의 Chrome 또는 삼성 인터넷에서 이 페이지를 열고, 브라우저 메뉴의 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.<button aria-label="설치 안내 닫기" onClick={()=>setHelp(false)}>닫기</button></div>}</div>
}
