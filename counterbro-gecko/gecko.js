/* CounterBro Gecko: curious companion with result-peeking behavior. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled || document.getElementById('counterbro-gecko-widget')) return;
 const root=document.createElement('div');root.id='counterbro-gecko-widget';root.setAttribute('aria-hidden','true');
 const img=document.createElement('img');img.src='counterbro-gecko/gecko.svg';img.alt='';root.appendChild(img);document.body.appendChild(root);
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let x=0,y=0,tx=0,ty=0,raf=0,scrollTimer=0,previousScroll=window.scrollY,scrolling=false;
 let mouseTimer=0,lastReact=0,mouseX=null,mouseY=null,resultTimer=0,resultReturnTimer=0,peeking=false;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function size(){return {w:root.offsetWidth||100,h:root.offsetHeight||74}}
 function place(){root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto'}
 function perch(){const s=size();return {x:innerWidth-s.w-12,y:innerHeight-s.h-12}}
 const p=perch();x=tx=p.x;y=ty=p.y;place();
 function frame(){
  const dx=tx-x,dy=ty-y,dist=Math.hypot(dx,dy);
  if(dist>1){
   const step=Math.min(dist,reduce?dist:Math.min(2.15,Math.max(.45,dist*.032)));
   x+=dx/dist*step;y+=dy/dist*step;
   root.classList.toggle('is-walking',dist>8);root.classList.toggle('faces-right',dx>0);place();
  }
  if(dist>1)raf=requestAnimationFrame(frame);else{raf=0;root.classList.remove('is-walking')}
 }
 function go(px,py){
  const s=size();tx=clamp(px,8,innerWidth-s.w-8);ty=clamp(py,8,innerHeight-s.h-8);
  if(!raf)raf=requestAnimationFrame(frame);
 }
 function peekAtResults(){
  const results=document.getElementById('resultadosCounter');
  if(!results||getComputedStyle(results).display==='none'||!results.getClientRects().length)return;
  clearTimeout(resultReturnTimer);peeking=true;root.classList.add('is-curious');
  const r=results.getBoundingClientRect(),s=size();
  // Walk to the nearest visible edge of the results and pause there as if inspecting the picks.
  const px=clamp(r.right-s.w*.7,12,innerWidth-s.w-8);
  const py=clamp(r.top+Math.min(58,r.height*.22),12,innerHeight-s.h-8);
  go(px,py);
  resultReturnTimer=setTimeout(()=>{
   peeking=false;root.classList.remove('is-curious');
   if(!scrolling){const q=perch();go(q.x,q.y)}
  },3800);
 }
 function schedulePeek(){clearTimeout(resultTimer);resultTimer=setTimeout(peekAtResults,450)}
 function noticeMouse(e){
  mouseX=e.clientX;mouseY=e.clientY;clearTimeout(mouseTimer);
  mouseTimer=setTimeout(()=>{
   if(scrolling||peeking||mouseX==null)return;
   const s=size(),cx=x+s.w/2,cy=y+s.h/2,d=Math.hypot(mouseX-cx,mouseY-cy);
   if(d>340)return;
   const now=Date.now();if(now-lastReact<1100)return;lastReact=now;
   const angle=Math.atan2(cy-mouseY,cx-mouseX),distance=clamp(d*.42,48,112);
   go(mouseX+Math.cos(angle)*distance-s.w/2,mouseY+Math.sin(angle)*distance-s.h/2);
  },380);
 }
 addEventListener('mousemove',noticeMouse,{passive:true});
 addEventListener('touchmove',e=>{if(e.touches&&e.touches[0])noticeMouse(e.touches[0])},{passive:true});
 addEventListener('scroll',()=>{
  const delta=scrollY-previousScroll;previousScroll=scrollY;scrolling=true;root.classList.add('is-lagging','is-walking');
  const s=size();tx=clamp(x-delta*.25,8,innerWidth-s.w-8);ty=clamp(y+Math.sign(delta)*Math.min(16,Math.abs(delta)*.1),8,innerHeight-s.h-8);
  if(!raf)raf=requestAnimationFrame(frame);
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
   scrolling=false;root.classList.remove('is-lagging');
   if(peeking){peekAtResults();return}
   const q=perch();go(q.x,q.y);
  },220);
 },{passive:true});
 addEventListener('resize',()=>{const s=size();tx=clamp(tx,8,innerWidth-s.w-8);ty=clamp(ty,8,innerHeight-s.h-8);if(!raf)raf=requestAnimationFrame(frame)},{passive:true});
 const results=document.getElementById('resultadosCounter');
 if(results){
  new MutationObserver(schedulePeek).observe(results,{attributes:true,attributeFilter:['style','class','hidden'],childList:true,subtree:true});
 }
})();