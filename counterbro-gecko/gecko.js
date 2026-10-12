/* CounterBro Gecko: curious, free-roaming pixel companion. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled||document.getElementById('counterbro-gecko-widget'))return;
 const root=document.createElement('div');root.id='counterbro-gecko-widget';root.setAttribute('aria-hidden','true');
 const img=document.createElement('img');img.src='counterbro-gecko/gecko.svg';img.alt='';root.appendChild(img);document.body.appendChild(root);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let x=0,y=0,tx=0,ty=0,raf=0,scrollTimer=0,previousScroll=scrollY,scrolling=false;
 let mouseTimer=0,lastReact=0,mouseX=null,mouseY=null,resultTimer=0,resultReturnTimer=0,peeking=false,wanderTimer=0,jumpTimer=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function size(){return {w:root.offsetWidth||100,h:root.offsetHeight||74}}
 function place(){root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto'}
 function perch(){const s=size();return {x:innerWidth-s.w-12,y:innerHeight-s.h-12}}
 function frame(){
  const dx=tx-x,dy=ty-y,dist=Math.hypot(dx,dy);
  if(dist>1){
   const step=Math.min(dist,reduce?dist:Math.min(2.8,Math.max(.65,dist*.045)));
   x+=dx/dist*step;y+=dy/dist*step;
   root.classList.toggle('is-walking',dist>7);root.classList.toggle('faces-right',dx>0);place();
  }
  if(dist>1)raf=requestAnimationFrame(frame);else{raf=0;root.classList.remove('is-walking')}
 }
 function go(px,py){const s=size();tx=clamp(px,8,innerWidth-s.w-8);ty=clamp(py,8,innerHeight-s.h-8);if(!raf)raf=requestAnimationFrame(frame)}
 function jump(){
  root.classList.remove('is-jumping');
  // Restart the CSS keyframes for every click without toggling mouse curiosity.
  void root.offsetWidth;root.classList.add('is-jumping');
  clearTimeout(jumpTimer);jumpTimer=setTimeout(()=>root.classList.remove('is-jumping'),620);
  scheduleWander(900);
 }
 root.addEventListener('click',jump);
 function rectsToAvoid(){
  const selectors='header,nav,button,input,textarea,select,[role="button"],.hero-card,.hero-card-container,#resultadosCounter,.result-card,.counter-card,.step-card';
  return [...document.querySelectorAll(selectors)].filter(el=>el!==root&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
 }
 function score(px,py,rects,s){
  const a={left:px,top:py,right:px+s.w,bottom:py+s.h};let cost=0;
  for(const r of rects){const ox=Math.max(0,Math.min(a.right,r.right)-Math.max(a.left,r.left));const oy=Math.max(0,Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top));if(ox&&oy)cost+=ox*oy+10000}
  return cost;
 }
 function wander(){
  if(scrolling||peeking){scheduleWander(1200);return}
  const s=size(),rects=rectsToAvoid();let best=null,bestScore=Infinity;
  for(let i=0;i<22;i++){
   const px=8+Math.random()*Math.max(1,innerWidth-s.w-16),py=8+Math.random()*Math.max(1,innerHeight-s.h-16);
   const d=Math.hypot(px-x,py-y);if(d<55||d>Math.min(360,Math.max(innerWidth,innerHeight)*.65))continue;
   const cost=score(px,py,rects,s)+d*.12+Math.random()*900;
   if(cost<bestScore){bestScore=cost;best={x:px,y:py}}
  }
  if(best)go(best.x,best.y);scheduleWander(3200+Math.random()*3800);
 }
 function scheduleWander(delay){clearTimeout(wanderTimer);wanderTimer=setTimeout(wander,delay)}
 const start=perch();x=tx=start.x;y=ty=start.y;place();scheduleWander(1800);
 function peekAtResults(){
  const results=document.getElementById('resultadosCounter');
  if(!results||getComputedStyle(results).display==='none'||!results.getClientRects().length)return;
  clearTimeout(resultReturnTimer);peeking=true;root.classList.add('is-curious');
  const r=results.getBoundingClientRect(),s=size(),candidates=[
   {x:r.left-s.w-10,y:r.top+12},{x:r.right+10,y:r.top+12},
   {x:r.left-s.w-10,y:r.bottom-s.h-8},{x:r.right+10,y:r.bottom-s.h-8},
   {x:r.left+12,y:r.bottom+10},{x:r.right-s.w-12,y:r.bottom+10}
  ];
  const rects=rectsToAvoid();let best=candidates[0],bestScore=Infinity;
  for(const c of candidates){const px=clamp(c.x,8,innerWidth-s.w-8),py=clamp(c.y,8,innerHeight-s.h-8);const cost=score(px,py,rects,s)+Math.hypot(px-x,py-y)*.08;if(cost<bestScore){bestScore=cost;best={x:px,y:py}}}
  go(best.x,best.y);
  resultReturnTimer=setTimeout(()=>{peeking=false;root.classList.remove('is-curious');if(!scrolling)scheduleWander(500)},3000);
 }
 function schedulePeek(){clearTimeout(resultTimer);resultTimer=setTimeout(peekAtResults,500)}
 function noticeMouse(e){
  mouseX=e.clientX;mouseY=e.clientY;clearTimeout(mouseTimer);
  mouseTimer=setTimeout(()=>{
   if(scrolling||mouseX==null)return;
   const s=size(),cx=x+s.w/2,cy=y+s.h/2,d=Math.hypot(mouseX-cx,mouseY-cy);
   if(d>340)return;const now=Date.now();if(now-lastReact<900)return;lastReact=now;
   const angle=Math.atan2(cy-mouseY,cx-mouseX)+(Math.random()-.5)*.8,distance=clamp(d*.4,45,100);
   go(mouseX+Math.cos(angle)*distance-s.w/2,mouseY+Math.sin(angle)*distance-s.h/2);
   if(!peeking)scheduleWander(4000+Math.random()*2000);
  },350);
 }
 addEventListener('mousemove',noticeMouse,{passive:true});
 addEventListener('touchmove',e=>{if(e.touches&&e.touches[0])noticeMouse(e.touches[0])},{passive:true});
 addEventListener('scroll',()=>{
  const delta=scrollY-previousScroll;previousScroll=scrollY;scrolling=true;root.classList.add('is-lagging','is-walking');
  const s=size();tx=clamp(x-delta*.25,8,innerWidth-s.w-8);ty=clamp(y+Math.sign(delta)*Math.min(16,Math.abs(delta)*.1),8,innerHeight-s.h-8);
  if(!raf)raf=requestAnimationFrame(frame);clearTimeout(scrollTimer);
  scrollTimer=setTimeout(()=>{scrolling=false;root.classList.remove('is-lagging');if(peeking){peekAtResults();return}const p=perch();go(p.x,p.y);scheduleWander(1800)},220);
 },{passive:true});
 addEventListener('resize',()=>{const s=size();tx=clamp(tx,8,innerWidth-s.w-8);ty=clamp(ty,8,innerHeight-s.h-8);if(!raf)raf=requestAnimationFrame(frame)},{passive:true});
 const results=document.getElementById('resultadosCounter');
 if(results)new MutationObserver(schedulePeek).observe(results,{attributes:true,attributeFilter:['style','class','hidden'],childList:true,subtree:true});
})();