/* CounterBro Gecko: curious, independent pixel-art companion. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled || document.getElementById('counterbro-gecko-widget')) return;
 const root=document.createElement('div'); root.id='counterbro-gecko-widget'; root.setAttribute('aria-hidden','true');
 const img=document.createElement('img'); img.src='counterbro-gecko/gecko.svg'; img.alt=''; root.appendChild(img); document.body.appendChild(root);
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let x=0,y=0,tx=0,ty=0,raf=0,scrollTimer=0,previousScroll=window.scrollY,scrolling=false;
 let mouseX=null,mouseY=null,mouseTimer=0,lastReact=0,curious=false;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function size(){return {w:root.offsetWidth||94,h:root.offsetHeight||70}}
 function place(){root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto'}
 function perch(){const s=size();return {x:innerWidth-s.w-12,y:innerHeight-s.h-12}}
 const start=perch();x=tx=start.x;y=ty=start.y;place();
 function frame(){
  const dx=tx-x,dy=ty-y,dist=Math.hypot(dx,dy);
  if(dist>1){
   // Slow, slightly variable pace: Gecko follows out of curiosity, not like a cursor attachment.
   const step=Math.min(dist,reduce?dist:Math.min(1.25,Math.max(.22,dist*.018)));
   x+=dx/dist*step;y+=dy/dist*step;
   root.classList.toggle('is-walking',dist>10);root.classList.toggle('faces-right',dx>0);place();
  }
  if(dist>1)raf=requestAnimationFrame(frame);else{raf=0;root.classList.remove('is-walking')}
 }
 function go(px,py){
  const s=size();tx=clamp(px,8,innerWidth-s.w-8);ty=clamp(py,8,innerHeight-s.h-8);
  if(!raf)raf=requestAnimationFrame(frame);
 }
 function noticeMouse(e){
  mouseX=e.clientX;mouseY=e.clientY;
  clearTimeout(mouseTimer);
  // Wait for the pointer to pause before Gecko reacts; keep a comfortable distance.
  mouseTimer=setTimeout(()=>{
   if(scrolling||mouseX==null)return;
   const cx=x+size().w/2,cy=y+size().h/2,d=Math.hypot(mouseX-cx,mouseY-cy);
   if(d>300)return;
   const now=Date.now();if(now-lastReact<800)return;lastReact=now;curious=true;
   const angle=Math.atan2(cy-mouseY,cx-mouseX);
   const distance=clamp(d*.38,42,105);
   go(mouseX+Math.cos(angle)*distance-size().w/2,mouseY+Math.sin(angle)*distance-size().h/2);
  },320);
 }
 addEventListener('mousemove',noticeMouse,{passive:true});
 addEventListener('touchmove',e=>{if(e.touches&&e.touches[0])noticeMouse(e.touches[0])},{passive:true});
 addEventListener('scroll',()=>{
  const delta=scrollY-previousScroll;previousScroll=scrollY;scrolling=true;
  root.classList.add('is-lagging','is-walking');
  const s=size();tx=clamp(x-delta*.25,8,innerWidth-s.w-8);ty=clamp(y+Math.sign(delta)*Math.min(16,Math.abs(delta)*.1),8,innerHeight-s.h-8);
  if(!raf)raf=requestAnimationFrame(frame);
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
   scrolling=false;root.classList.remove('is-lagging');
   const p=perch();go(p.x,p.y);
  },220);
 },{passive:true});
 addEventListener('resize',()=>{const s=size();tx=clamp(tx,8,innerWidth-s.w-8);ty=clamp(ty,8,innerHeight-s.h-8);if(!raf)raf=requestAnimationFrame(frame)},{passive:true});
})();