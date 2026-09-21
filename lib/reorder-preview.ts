// A visual-only copy follows the pointer while the original keeps its space.
export function createReorderPreview(row:HTMLElement,x:number,y:number){
 const rect=row.getBoundingClientRect();
 const offsetX=x-rect.left,offsetY=y-rect.top;
 const element=row.cloneNode(true) as HTMLElement;
 const originals=[row,...Array.from(row.querySelectorAll<HTMLElement>('*'))];
 const copies=[element,...Array.from(element.querySelectorAll<HTMLElement>('*'))];
 originals.forEach((original,index)=>{
  const copy=copies[index],style=getComputedStyle(original);
  for(let i=0;i<style.length;i++){const name=style[i];copy.style.setProperty(name,style.getPropertyValue(name))}
  copy.removeAttribute('id');copy.removeAttribute('data-touch-reorder');copy.removeAttribute('data-reorder-id');copy.removeAttribute('draggable');
  copy.style.setProperty('pointer-events','none','important');
  copy.style.setProperty('transition','none','important');
  copy.style.setProperty('animation','none','important');
 });
 element.classList.remove('task-dragging','category-dragging','task-drop-before','task-drop-after','drop-before','drop-after');
 element.classList.add('reorder-preview');
 element.setAttribute('aria-hidden','true');element.inert=true;
 Object.assign(element.style,{position:'fixed',left:'0px',top:'0px',right:'auto',bottom:'auto',width:rect.width+'px',height:rect.height+'px',boxSizing:'border-box',margin:'0',opacity:'0.96',zIndex:'10000',backgroundColor:'#fff',boxShadow:'0 12px 30px #17274438',outline:'2px solid #2458da',outlineOffset:'-2px',borderRadius:'10px',willChange:'transform'});
 const move=(clientX:number,clientY:number)=>{element.style.transform=`translate3d(${clientX-offsetX}px, ${clientY-offsetY}px, 0)`};
 move(x,y);document.body.appendChild(element);
 return {element,offsetX,offsetY,move,remove:()=>element.remove()};
}

export function setReorderDragImage(event:{currentTarget:HTMLElement;clientX:number;clientY:number;dataTransfer:DataTransfer}){
 const row=event.currentTarget.closest<HTMLElement>('[data-touch-reorder]');if(!row)return;
 const preview=createReorderPreview(row,event.clientX,event.clientY);
 try{event.dataTransfer.setDragImage(preview.element,preview.offsetX,preview.offsetY)}finally{
  // The browser snapshots the row at the end of dragstart, then owns movement.
  setTimeout(preview.remove,0);
 }
}
