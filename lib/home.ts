import {isToday,localDate,occurrence,priorityCompare,type Task} from './memory';
export type AttentionItem={task:Task;label:string;tone:'overdue'|'soon'|'today'|'important';rank:number;due:number};
export function attentionItems(tasks:Task[],now=new Date()):AttentionItem[]{
 const today=localDate(now),stamp=now.getTime();
 return tasks.flatMap((task):AttentionItem[]=>{
  if(task.done||(task.repeat!=='none'&&task.completed.includes(today)))return [];
  const date=occurrence(task,today);
  const due=date?new Date(date+'T'+(task.time||'23:59')+':00').getTime():Infinity;
  let label='',tone:AttentionItem['tone']='important',rank=3;
  if(date&&(date<today||(date===today&&!!task.time&&due<stamp))){label='기한 지남'+(task.time?' · '+task.time:'');tone='overdue';rank=0}
  else if(date&&task.time&&due>=stamp&&due-stamp<=24*60*60*1000){const minutes=Math.ceil((due-stamp)/60000);label=minutes===0?'지금':minutes<60?`${minutes}분 뒤`:`${Math.floor(minutes/60)}시간${minutes%60?' '+minutes%60+'분':''} 뒤`;tone='soon';rank=1}
  else if(isToday(task,today)){label='오늘'+(task.repeat==='daily'?' · 매일 반복':task.repeat==='weekly'?' · 요일 반복':'');tone='today';rank=2}
  else if(task.priority==='최상'||task.priority==='상'){label=task.priority==='최상'?'최상 · 긴급해요':'상 · 중요해요'}
  else return [];
  return [{task,label,tone,rank,due}];
 }).sort((a,b)=>a.rank-b.rank||((a.rank<2)?a.due-b.due:0)||priorityCompare(a.task,b.task));
}
