export type Task={id:string;text:string;notes?:string;priority:'최상'|'상'|'중'|'하'|'최하';category:string;date:string;time:string;repeat:'none'|'daily'|'weekly';days:number[];done:boolean;completed:string[];created:number};
export type Data={version:1;categories:string[];categoryParents?:Record<string,string>;tasks:Task[];customOrder?:boolean};
export const KEY='gieokham-v1';
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const empty=():Data=>({version:1,categories:['일상','회사','공부','취업','운동','약속'],tasks:[]});
export function task(text:string):Task{return {id:crypto.randomUUID(),text:text.trim(),notes:'',priority:'중',category:'',date:'',time:'',repeat:'none',days:[],done:false,completed:[],created:Date.now()}}
export function occurrence(t:Task,today=localDate()):string {if(t.repeat==='none')return t.date;let d=new Date((t.date&&t.date>today?t.date:today)+'T12:00:00');for(let n=0;n<370;n++){const s=localDate(d);if((t.repeat==='daily'||t.days.includes(d.getDay()))&&!t.completed.includes(s))return s;d.setDate(d.getDate()+1)}return ''}
export function isToday(t:Task,today=localDate()){if(t.repeat==='none')return !t.done&&!!t.date&&t.date<=today;return occurrence(t,today)===today}
export function toggle(t:Task,today=localDate()):Task {if(t.repeat==='none')return {...t,done:!t.done};return {...t,completed:t.completed.includes(today)?t.completed.filter(x=>x!==today):[...t.completed,today]}}
const validDate=(s:unknown)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&localDate(new Date(s+'T12:00:00'))===s;
export function validate(v:unknown):Data {const d=v as Data;if(!d||d.version!==1||(d.customOrder!==undefined&&typeof d.customOrder!=='boolean')||!Array.isArray(d.categories)||!Array.isArray(d.tasks)||d.tasks.length>50000||d.categories.some(c=>typeof c!=='string'||!c.trim()||c.length>50)||new Set(d.categories).size!==d.categories.length)throw Error('유효한 기억함 백업 파일이 아닙니다.');validateCategoryParents(d);const ids=new Set();for(const t of d.tasks){if(!t||typeof t.id!=='string'||ids.has(t.id)||typeof t.text!=='string'||!t.text.trim()||t.text.length>10000||(t.notes!==undefined&&(typeof t.notes!=='string'||t.notes.length>10000))||!['최상','상','중','하','최하'].includes(t.priority)||typeof t.category!=='string'||(t.category&&!d.categories.includes(t.category))||!(t.date===''||validDate(t.date))||typeof t.time!=='string'||!(t.time===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))||(t.time&&!t.date)||!['none','daily','weekly'].includes(t.repeat)||!Array.isArray(t.days)||t.days.some(n=>!Number.isInteger(n)||n<0||n>6)||(t.repeat==='weekly'&&!t.days.length)||typeof t.done!=='boolean'||!Array.isArray(t.completed)||t.completed.some(s=>!validDate(s))||!Number.isFinite(t.created))throw Error('백업 항목의 형식이 올바르지 않습니다.');ids.add(t.id)}return structuredClone(d)}
export function demo():Data{const d=empty(),today=localDate();d.tasks=['샴푸 사기','지원서 제출','운동 20분','친구와 저녁','공부 내용 정리'].map((x,i)=>({...task(x),category:['일상','취업','운동','약속','공부'][i],priority:(['중','상','중','중','하'] as const)[i],date:i===0?'':today,time:i===3?'19:00':'',repeat:i===2?'daily':'none',created:Date.now()-i*1000}));return d}
export function reorderCategories(categories:string[],source:string,target:string,edge:'before'|'after'):string[]{
 if(source===target||!categories.includes(source)||!categories.includes(target))return categories;
 const result=categories.filter(c=>c!==source);const index=result.indexOf(target)+(edge==='after'?1:0);result.splice(index,0,source);return result;
}
export function reorderTasks(tasks:Task[],visibleIds:string[],source:string,target:string,edge:'before'|'after'):Task[]{
 const visible=new Set(visibleIds);const shown=tasks.filter(t=>visible.has(t.id));
 const ids=shown.map(t=>t.id);const ordered=reorderCategories(ids,source,target,edge);
 if(ordered.every((id,i)=>id===ids[i]))return tasks;
 const byId=new Map(shown.map(t=>[t.id,t]));let index=0;
 return tasks.map(t=>visible.has(t.id)?byId.get(ordered[index++])!:t);
}

export function priorityCompare(a:Task,b:Task){return ({'최상':0,'상':1,'중':2,'하':3,'최하':4}[a.priority]-{'최상':0,'상':1,'중':2,'하':3,'최하':4}[b.priority])||b.created-a.created}
export function customTasks(data:Data):Task[]{return data.customOrder?data.tasks:[...data.tasks].sort(priorityCompare)}

// Used only when the account has no saved state; empty existing accounts stay empty.
export function initialAccountData():Data {
 const entries:[string,string,Task['priority']][]=[
  ['당장 생각나는 것','단순메모','상'],
  ['클렌징폼','쇼핑','중'],
  ['샴푸','쇼핑','중'],
  ['쌀','쇼핑','상'],
  ['땡땡이와 점심 약속','일정','중'],
 ];
 return {version:1,categories:['단순메모','회사','일정','일상','쇼핑','공부','주식','운동'],
  tasks:entries.map(([text,category,priority])=>({...task(text),category,priority}))};
}

// Insert into the priority's first position without rearranging saved manual order.
export function insertTask(data:Data,entry:Task):Task[]{
 const tasks=[...customTasks(data)];
 const ranks={'최상':0,'상':1,'중':2,'하':3,'최하':4};
 let index=tasks.findIndex(t=>!t.done&&t.priority===entry.priority);
 if(index<0)index=tasks.findIndex(t=>!t.done&&ranks[t.priority]>ranks[entry.priority]);
 tasks.splice(index<0?tasks.length:index,0,entry);
 return tasks;
}

export function categoryPath(d:Data,c:string):string[]{const path:string[]=[];const seen=new Set<string>();while(c&&!seen.has(c)){seen.add(c);path.unshift(c);c=d.categoryParents?.[c]||''}return path}
export function inCategory(d:Data,c:string,parent:string){return categoryPath(d,c).includes(parent)}
export function categoryTree(d:Data):string[]{const result:string[]=[];const visit=(parent:string)=>{for(const c of d.categories){if((d.categoryParents?.[c]||'')===parent){result.push(c);visit(c)}}};visit('');return result}
export function validateCategoryParents(d:Data){const p=d.categoryParents;if(p===undefined)return;if(!p||typeof p!=='object'||Array.isArray(p))throw Error('하위 카테고리 형식이 올바르지 않습니다.');for(const [c,parent] of Object.entries(p)){if(!d.categories.includes(c)||typeof parent!=='string'||!d.categories.includes(parent))throw Error('상위 카테고리를 찾을 수 없습니다.');const seen=new Set([c]);let next=parent;while(next){if(seen.has(next))throw Error('카테고리가 서로의 하위가 될 수 없습니다.');seen.add(next);next=p[next]||''}}}
export function saveCategory(d:Data,old:string|null,name:string,parent:string):Data{if(!name.trim()||name.length>50)throw Error('카테고리는 1~50자로 입력하세요.');if(d.categories.includes(name)&&name!==old)throw Error('이미 있는 카테고리입니다.');if(parent&&(parent===old||parent===name||(old&&inCategory(d,parent,old))))throw Error('자신이나 하위 카테고리를 상위로 선택할 수 없습니다.');const parents=Object.fromEntries(Object.entries(d.categoryParents||{}).filter(([c])=>c!==old).map(([c,p])=>[c,p===old?name:p]));if(parent)parents[name]=parent;const next={...d,categories:old?d.categories.map(c=>c===old?name:c):[...d.categories,name],categoryParents:parents,tasks:d.tasks.map(t=>old&&t.category===old?{...t,category:name}:t)};validateCategoryParents(next);return next}
export function deleteCategory(d:Data,name:string):Data{return {...d,categories:d.categories.filter(c=>c!==name),categoryParents:Object.fromEntries(Object.entries(d.categoryParents||{}).filter(([c,p])=>c!==name&&p!==name)),tasks:d.tasks.map(t=>t.category===name?{...t,category:''}:t)}}

export type CategoryDropEdge='before'|'inside'|'after';
export function categoryDropEdge(y:number,top:number,height:number):CategoryDropEdge{const ratio=(y-top)/height;return ratio<.25?'before':ratio>.75?'after':'inside'}
export function moveCategoryTree(d:Data,source:string,target:string,edge:CategoryDropEdge):Data{if(source===target||!d.categories.includes(source)||!d.categories.includes(target))return d;if(inCategory(d,target,source))throw Error('자신의 하위 카테고리로 이동할 수 없습니다.');const parent=edge==='inside'?target:(d.categoryParents?.[target]||'');const next=saveCategory(d,source,source,parent);if(edge!=='inside')next.categories=reorderCategories(next.categories,source,target,edge);else next.categories=[...next.categories.filter(c=>c!==source),source];return next}
