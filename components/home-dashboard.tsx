'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Clock3,NotebookPen,Sun} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {attentionItems} from '@/lib/home';
import {inCategory,categoryPath,categoryTree,isToday,localDate,type Data,type Task} from '@/lib/memory';
export function HomeDashboard({data,onOpen,onDone,onNavigate}:{data:Data;onOpen:(t:Task)=>void;onDone:(t:Task)=>void;onNavigate:(view:string)=>void}){
 const [now,setNow]=useState(()=>new Date()),[expanded,setExpanded]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer)},[]);
 const today=localDate(now),active=data.tasks.filter(t=>!t.done),attention=attentionItems(data.tasks,now);
 const recent=[...active].sort((a,b)=>b.created-a.created).slice(0,5);
 const row=(t:Task,label?:string,tone='recent')=><article className="home-memory" key={t.id}>
  <Checkbox aria-label={t.text+' 완료'} checked={t.repeat==='none'?t.done:t.completed.includes(today)} disabled={t.repeat!=='none'&&!isToday(t,today)&&!t.completed.includes(today)} onCheckedChange={()=>onDone(t)}/>
  <button className="home-memory-content" onClick={()=>onOpen(t)}>
   {label&&<span className={'home-status '+tone}>{label}</span>}
   <span className="home-memory-title">{t.text}</span>
   <span className="home-memory-meta">{t.category||'미분류'}{t.date&&<> · {t.date===today?'오늘':t.date.slice(5).replace('-','.')} {t.time}</>}{t.notes?.trim()&&<> · 추가 메모</>}</span>
  </button><span className={'priority p'+t.priority}>{t.priority}</span>
 </article>;
 return <div className="home-dashboard">
  <div className="home-main">
   <section className="home-card home-attention" aria-labelledby="attention-heading">
    <header className="home-section-heading"><div><span className="home-kicker"><Sun size={15}/>먼저 확인해요</span><h2 id="attention-heading">지금 챙길 기억 <span>{attention.length}</span></h2></div><span className="home-today">{now.getMonth()+1}월 {now.getDate()}일</span></header>
    {attention.length?<div>{(expanded?attention:attention.slice(0,6)).map(item=>row(item.task,item.label,item.tone))}</div>:<div className="home-empty"><Sun size={28}/><strong>지금 급하게 챙길 기억은 없어요.</strong><p>오늘 할 일이나 중요한 메모를 남기면 여기에 보여요.</p></div>}
    {attention.length>6&&<button className="home-more" onClick={()=>setExpanded(!expanded)}>{expanded?'접기':`나머지 ${attention.length-6}개 더 보기`}</button>}
   </section>
   <section className="home-card" aria-labelledby="recent-heading"><header className="home-section-heading"><div><span className="home-kicker"><Clock3 size={15}/>방금 떠오른 생각들</span><h2 id="recent-heading">최근 남긴 기억</h2></div><button className="home-link" onClick={()=>onNavigate('all')}>전체 보기 <ArrowUpRight size={16}/></button></header>
    {recent.length?recent.map(t=>row(t)):<div className="home-empty"><NotebookPen size={28}/><strong>첫 번째 기억을 남겨보세요.</strong><p>위 입력창에 내용만 적으면 됩니다.</p></div>}
   </section>
  </div>
  <section className="home-card home-categories" aria-labelledby="categories-heading"><header className="home-section-heading"><div><span className="home-kicker">나만의 분류</span><h2 id="categories-heading">나의 카테고리</h2></div></header><div className="home-category-grid">{[...categoryTree(data),''].map((c,i)=>{const count=active.filter(t=>c?inCategory(data,t.category,c):!t.category).length;return <button key={c||'__uncategorized'} className="home-category" onClick={()=>onNavigate(c?'cat:'+c:'uncategorized')}><span className={'category-color c'+i%6}>#</span><span className="home-category-name">{c?categoryPath(data,c).join(' › '):'미분류'}</span><strong>{count}<span className="sr-only">개 미완료</span></strong><ArrowUpRight size={15}/></button>})}</div><p className="home-category-note">카테고리를 눌러 기억을 모아 보세요.</p></section>
 </div>;
}
