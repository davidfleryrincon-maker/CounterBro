/* CounterBro Gecko: isolated animated companion. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled || document.getElementById('counterbro-gecko-widget')) return;
 const root=document.createElement('div'); root.id='counterbro-gecko-widget'; root.setAttribute('aria-hidden','true');
 const img=document.createElement('img'); img.src='counterbro-gecko/gecko.svg'; img.alt=''; root.appendChild(img); document.body.appendChild(root);
 let tx=window.innerWidth-76,ty=window.innerHeight-78,x=tx,y=ty,raf=0,scrollTimer=0,previousScroll=window.scrollY,scrolling=false;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function place(){root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto'}
 place();
 function frame(){
  const dx=tx-x,dy=ty-y,dist=Math.hypot(dx,dy);
  if(dist>1){const step=Math.min(dist,reduce?dist:Math.max(1.5,dist*.07));x+=dx/dist*step;y+=dy/dist*step;root.classList.toggle('is-walking',dist>8);root.classList.toggle('faces-right',dx>0);place()}
  if(dist>1)raf=requestAnimationFrame(frame);else{raf=0;root.classList.remove('is-walking')}
 }
 function target(px,py){
  const w=root.offsetWidth||90,h=root.offsetHeight||90;
  tx=Math.max(4,Math.min(innerWidth-w-4,px-w*.5));ty=Math.max(4,Math.min(innerHeight-h-4,py-h*.72));
  if(!raf)raf=requestAnimationFrame(frame)
 }
 function catchUp(){
  scrolling=false;root.classList.remove('is-lagging');
  const w=root.offsetWidth||90,h=root.offsetHeight||90;
  // Gecko dashes back toward its usual lower-right perch after the page stops.
  tx=Math.max(8,innerWidth-w-12);ty=Math.max(8,innerHeight-h-12);
  root.classList.add('is-walking','catching-up');
  if(!raf)raf=requestAnimationFrame(frame);
  clearTimeout(root._catchTimer);root._catchTimer=setTimeout(()=>root.classList.remove('catching-up'),700)
 }
 addEventListener('mousemove',e=>{window.__counterbroGeckoMouseX=e.clientX;window.__counterbroGeckoMouseY=e.clientY;if(!scrolling)target(e.clientX,e.clientY)},{passive:true});
 addEventListener('touchmove',e=>{if(e.touches&&e.touches[0]&&!scrolling)target(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
 addEventListener('scroll',()=>{
  const delta=scrollY-previousScroll;previousScroll=scrollY;scrolling=true;
  root.classList.add('is-lagging','is-walking');
  const w=root.offsetWidth||90,h=root.offsetHeight||90;
  // Move against the page's direction briefly, creating the illusion of lag.
  tx=Math.max(8,Math.min(innerWidth-w-8,x-delta*.45));
  ty=Math.max(8,Math.min(innerHeight-h-8,y+Math.sign(delta)*Math.min(20,Math.abs(delta)*.12)));
  if(!raf)raf=requestAnimationFrame(frame);
  clearTimeout(scrollTimer);scrollTimer=setTimeout(catchUp,190)
 },{passive:true});
 addEventListener('resize',()=>{tx=Math.max(8,Math.min(innerWidth-(root.offsetWidth||90)-8,tx));ty=Math.max(8,Math.min(innerHeight-(root.offsetHeight||90)-8,ty));if(!raf)raf=requestAnimationFrame(frame)},{passive:true});
})();