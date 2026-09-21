'use client';
import {useEffect,useRef} from 'react';
type Kind='category'|'task';
type Edge='before'|'after';
type Options={context:string;onStart:(kind:Kind,id:string)=>void;onTarget:(kind:Kind,id:string|null,edge:Edge)=>void;onDrop:(kind:Kind,source:string,target:string,edge:Edge)=>void;onEnd:()=>void};

// Native non-passive listeners can stop scrolling only after a long press.
// A normal swipe cancels the pending press and remains ordinary scrolling.
export function useTouchReorder(options:Options){
 const latest=useRef(options);latest.current=options;
 useEffect(()=>{
  let pending:ReturnType<typeof setTimeout>|undefined,frame=0,blockClickUntil=0;
  let drag:{kind:Kind;id:string;finger:number;row:HTMLElement;list:HTMLElement;scroll:HTMLElement;x:number;y:number;startX:number;startY:number;active:boolean;target:string|null;edge:Edge}|null=null;
  const scrollingParent=(node:HTMLElement)=>{let p=node.parentElement;while(p){if(/auto|scroll/.test(getComputedStyle(p).overflowY)&&p.scrollHeight>p.clientHeight)return p;p=p.parentElement}return document.scrollingElement as HTMLElement};
  const stop=(save=false)=>{
   clearTimeout(pending);cancelAnimationFrame(frame);const d=drag;drag=null;
   if(!d)return;
   if(d.active){blockClickUntil=Date.now()+700;document.body.classList.remove('touch-reordering');if(save&&d.target)latest.current.onDrop(d.kind,d.id,d.target,d.edge);latest.current.onEnd()}
  };
  const hit=()=>{
   const d=drag;if(!d)return;
   const row=document.elementFromPoint(d.x,d.y)?.closest<HTMLElement>('[data-touch-reorder]');
   const valid=row&&row.parentElement===d.list&&row.dataset.touchReorder===d.kind&&row.dataset.reorderId!==d.id;
   const id=valid?row.dataset.reorderId||null:null;
   const rect=valid?row.getBoundingClientRect():null;
   const edge:Edge=rect&&d.y>=rect.top+rect.height/2?'after':'before';
   if(id!==d.target||edge!==d.edge){d.target=id;d.edge=edge;latest.current.onTarget(d.kind,id,edge)}
  };
  const tick=()=>{
   const d=drag;if(!d?.active)return;
   if(!d.row.isConnected){stop();return}
   const page=d.scroll===document.scrollingElement;
   const rect=page?{top:0,bottom:window.innerHeight}:d.scroll.getBoundingClientRect();
   const top=Math.max(0,rect.top),bottom=Math.min(window.innerHeight,rect.bottom);
   if(d.y>=top-24&&d.y<=bottom+24){const margin=Math.min(56,(bottom-top)/4);const speed=d.y<top+margin?-Math.min(12,(top+margin-d.y)/4):d.y>bottom-margin?Math.min(12,(d.y-bottom+margin)/4):0;if(speed)d.scroll.scrollTop+=speed}
   hit();frame=requestAnimationFrame(tick);
  };
  const start=(event:TouchEvent)=>{
   if(event.touches.length!==1){stop();return}
   stop();
   const target=event.target instanceof Element?event.target:null;
   if(!target||target.closest('input,textarea,select,[role="checkbox"],[contenteditable="true"],.rename'))return;
   const row=target.closest<HTMLElement>('[data-touch-reorder]');
   const kind=row?.dataset.touchReorder as Kind|undefined,id=row?.dataset.reorderId;
   if(!row||!row.parentElement||!id||(kind!=='task'&&kind!=='category'))return;
   const t=event.touches[0];
   drag={kind,id,finger:t.identifier,row,list:row.parentElement,scroll:scrollingParent(row),x:t.clientX,y:t.clientY,startX:t.clientX,startY:t.clientY,active:false,target:null,edge:'before'};
   pending=setTimeout(()=>{if(!drag)return;drag.active=true;document.body.classList.add('touch-reordering');window.getSelection()?.removeAllRanges();latest.current.onStart(kind,id);frame=requestAnimationFrame(tick)},400);
  };
  const move=(event:TouchEvent)=>{
   const d=drag;if(!d)return;
   if(event.touches.length!==1){stop();return}
   const t=Array.from(event.touches).find(t=>t.identifier===d.finger);if(!t){stop();return}
   d.x=t.clientX;d.y=t.clientY;
   if(!d.active){if(Math.hypot(d.x-d.startX,d.y-d.startY)>10)stop();return}
   if(event.cancelable)event.preventDefault();else {stop();return}
   hit();
  };
  const end=(event:TouchEvent)=>{if(!drag)return;if(drag.active){if(event.cancelable)event.preventDefault();const t=Array.from(event.changedTouches).find(t=>t.identifier===drag?.finger);if(t){drag.x=t.clientX;drag.y=t.clientY;hit()}}stop(event.touches.length===0)};
  const cancel=()=>stop();
  const click=(event:MouseEvent)=>{if(Date.now()<blockClickUntil){event.preventDefault();event.stopImmediatePropagation()}};
  const context=(event:Event)=>{if(drag){event.preventDefault()}};
  document.addEventListener('touchstart',start,{passive:true,capture:true});
  document.addEventListener('touchmove',move,{passive:false,capture:true});
  document.addEventListener('touchend',end,{passive:false,capture:true});
  document.addEventListener('touchcancel',cancel,true);
  document.addEventListener('click',click,true);
  document.addEventListener('contextmenu',context,true);
  document.addEventListener('dragstart',context,true);
  window.addEventListener('blur',cancel);
  document.addEventListener('visibilitychange',cancel);
  return()=>{stop();document.removeEventListener('touchstart',start,true);document.removeEventListener('touchmove',move,true);document.removeEventListener('touchend',end,true);document.removeEventListener('touchcancel',cancel,true);document.removeEventListener('click',click,true);document.removeEventListener('contextmenu',context,true);document.removeEventListener('dragstart',context,true);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel)};
 },[options.context]);
}
