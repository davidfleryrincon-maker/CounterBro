/* CounterBro Gecko: isolated animated companion. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled || document.getElementById('counterbro-gecko-widget')) return;
 const root=document.createElement('div');
 root.id='counterbro-gecko-widget';
 root.setAttribute('aria-hidden','true');
 const img=document.createElement('img');
 img.src='counterbro-gecko/gecko.svg'; img.alt='';
 root.appendChild(img); document.body.appendChild(root);
 let tx=window.innerWidth-76, ty=window.innerHeight-78, x=tx, y=ty, raf=0, lastMove=0;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function place(){root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto';}
 place();
 function frame(){
   const dx=tx-x, dy=ty-y, dist=Math.hypot(dx,dy);
   if(dist>1){const step=Math.min(dist, reduce?dist:Math.max(1.4,dist*.055));x+=dx/dist*step;y+=dy/dist*step;root.classList.toggle('is-walking',dist>8);root.classList.toggle('faces-right',dx>0);place();}
   if(dist>1){raf=requestAnimationFrame(frame)}else{raf=0;root.classList.remove('is-walking')}
 }
 function target(px,py){
   const w=root.offsetWidth||90,h=root.offsetHeight||90;
   tx=Math.max(4,Math.min(window.innerWidth-w-4,px-w*.5));
   ty=Math.max(4,Math.min(window.innerHeight-h-4,py-h*.72));
   lastMove=Date.now();
   if(!raf)raf=requestAnimationFrame(frame);
 }
 window.addEventListener('mousemove',e=>target(e.clientX,e.clientY),{passive:true});
 window.addEventListener('touchmove',e=>{if(e.touches&&e.touches[0])target(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
 window.addEventListener('resize',()=>target(Math.min(tx,window.innerWidth-90),Math.min(ty,window.innerHeight-90)),{passive:true});
 window.addEventListener('scroll',()=>{root.classList.add('is-hidden');clearTimeout(root._showTimer);root._showTimer=setTimeout(()=>root.classList.remove('is-hidden'),400)},{passive:true});
})();