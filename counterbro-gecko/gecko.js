/* CounterBro Gecko: independent, curious, cat-like pixel companion. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled||document.getElementById('counterbro-gecko-widget'))return;
 const root=document.createElement('div');root.id='counterbro-gecko-widget';root.setAttribute('aria-hidden','true');
 const img=document.createElement('img');
 const baseSprite='counterbro-gecko/gecko.svg',sleepSprites={base:'counterbro-gecko/gecko-sleep.svg',gold:'counterbro-gecko/gecko-gold-sleep.svg',exp:'counterbro-gecko/gecko-exp-sleep.svg',mid:'counterbro-gecko/gecko-mid-sleep.svg',roam:'counterbro-gecko/gecko-roam-sleep.svg',jungle:'counterbro-gecko/gecko-jungle-sleep.svg',spectral:'counterbro-gecko/gecko-spectral-sleep.svg'};
 const evolutionSprites={gold:'counterbro-gecko/gecko-gold.svg',exp:'counterbro-gecko/gecko-exp.svg',mid:'counterbro-gecko/gecko-mid.svg',roam:'counterbro-gecko/gecko-roam.svg',jungle:'counterbro-gecko/gecko-jungle.svg',spectral:'counterbro-gecko/gecko-spectral.svg'};
 const walkingSprites={gold:'counterbro-gecko/gecko-gold-walk.svg',exp:'counterbro-gecko/gecko-exp-walk.svg',mid:'counterbro-gecko/gecko-mid-walk.svg',roam:'counterbro-gecko/gecko-roam-walk.svg',jungle:'counterbro-gecko/gecko-jungle-walk.svg',spectral:'counterbro-gecko/gecko-spectral-walk.svg'};
 let awakeSprite=baseSprite,activeEvolution=null,previousEvolution=null,isSleeping=false;
 img.src=awakeSprite;img.alt='';root.appendChild(img);document.body.appendChild(root);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let x=0,y=0,tx=0,ty=0,raf=0,scrollTimer=0,previousScroll=scrollY,scrolling=false;
 let mouseTimer=0,lastReact=0,mouseX=null,mouseY=null,resultTimer=0,resultReturnTimer=0,peeking=false,wanderTimer=0,jumpTimer=0,idleTimer=0,napTimer=0;
 let mood='curious',lastClick=0,curiosityUntil=0;
 const laneSearchCounts={gold:0,exp:0,mid:0,roam:0,jungle:0};
 let activityTimer=0,transformTimer=0,spectralActive=false;
 function currentSprite(){return activeEvolution?evolutionSprites[activeEvolution]:baseSprite}
 function setWalking(on){const was=root.classList.contains('is-walking');if(was===on)return;root.classList.toggle('is-walking',on);if(!isSleeping)img.src=on&&activeEvolution?walkingSprites[activeEvolution]:currentSprite();}
 function currentSleepSprite(){return activeEvolution?sleepSprites[activeEvolution]:sleepSprites.base}
 function wakeUp(){if(!isSleeping)return;root.classList.remove('is-resting');isSleeping=false;img.src=currentSprite();clearTimeout(napTimer);}
 function wakeSprite(){awakeSprite=currentSprite();if(!isSleeping)img.src=awakeSprite}
 function transformTo(evolution){
  if(!evolution||activeEvolution===evolution)return;
  activeEvolution=evolution;wakeSprite();
  root.classList.remove('is-resting');isSleeping=false;clearTimeout(napTimer);
  root.classList.remove('is-evolving');void root.offsetWidth;root.classList.add('is-evolving');
  clearTimeout(transformTimer);transformTimer=setTimeout(()=>root.classList.remove('is-evolving'),1250);
 }
 function completeSearch(lane){
  if(!Object.prototype.hasOwnProperty.call(laneSearchCounts,lane))return;
  laneSearchCounts[lane]++;
  if(laneSearchCounts[lane]>=2&&laneSearchCounts[lane]%2===0&&activeEvolution!==lane){
   spectralActive=false;previousEvolution=null;transformTo(lane);
  }
 }
 function markActivity(){
  clearTimeout(activityTimer);
  if(spectralActive){
   spectralActive=false;const restore=previousEvolution;previousEvolution=null;
   root.classList.remove('is-spectral');
   activeEvolution=restore;wakeSprite();
   root.classList.remove('is-evolving');void root.offsetWidth;root.classList.add('is-evolving');
   clearTimeout(transformTimer);transformTimer=setTimeout(()=>root.classList.remove('is-evolving'),1250);
  }
  activityTimer=setTimeout(()=>{
   if(spectralActive)return;
   previousEvolution=activeEvolution;spectralActive=true;
   transformTo('spectral');root.classList.add('is-spectral');
  },180000);
 }
 window.CounterBroGecko={completeSearch};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function size(){return {w:root.offsetWidth||100,h:root.offsetHeight||74}}
 function place(){root.style.left=x+'px';root.style.top=y+'px';root.style.right='auto';root.style.bottom='auto'}
 function perch(){const s=size();return {x:innerWidth-s.w-12,y:innerHeight-s.h-12}}
 function setMood(next,duration=0){mood=next;root.dataset.mood=next;clearTimeout(idleTimer);if(duration)idleTimer=setTimeout(()=>{if(!scrolling&&!peeking)setMood('curious')},duration)}
 function frame(){
  if(isSleeping){raf=0;return}
  const dx=tx-x,dy=ty-y,dist=Math.hypot(dx,dy);
  if(dist>1){
   const step=Math.min(dist,reduce?dist:Math.min(mood==='startled'?4.2:2.35,Math.max(.48,dist*.035)));
   x+=dx/dist*step;y+=dy/dist*step;
   setWalking(dist>7);root.classList.toggle('faces-right',dx>0);place();
  }
  if(dist>1)raf=requestAnimationFrame(frame);else{raf=0;setWalking(false)}
 }
 function go(px,py){if(isSleeping)return;const s=size();tx=clamp(px,8,innerWidth-s.w-8);ty=clamp(py,8,innerHeight-s.h-8);if(!raf)raf=requestAnimationFrame(frame)}
 function hop(kind='playful'){
  root.classList.remove('is-jumping','is-pouncing');void root.offsetWidth;
  root.classList.add(kind==='pounce'?'is-pouncing':'is-jumping');
  clearTimeout(jumpTimer);jumpTimer=setTimeout(()=>root.classList.remove('is-jumping','is-pouncing'),700);
 }
 function reactToClick(){
  markActivity();
  const now=Date.now();lastClick=now;clearTimeout(napTimer);clearTimeout(wanderTimer);if(root.classList.contains('is-resting')){root.classList.remove('is-resting');isSleeping=false;img.src=currentSprite();}
  wakeUp();wakeUp();const r=root.getBoundingClientRect(),s=size();
  const roll=Math.random();
  if(roll<.2){setMood('aloof',2200);go(x+(Math.random()<.5?-1:1)*(55+Math.random()*55),y+(Math.random()-.5)*35);return}
  if(roll<.48){setMood('playful',900);hop('playful');scheduleWander(750);return}
  if(roll<.73){setMood('playful',1100);hop('pounce');const dir=Math.random()<.5?-1:1;go(x+dir*(65+Math.random()*65),y-18);scheduleWander(900);return}
  setMood('curious',1000);hop('playful');go(x+(Math.random()-.5)*90,y+(Math.random()-.5)*55);scheduleWander(1200);
 }
 root.addEventListener('click',reactToClick);
 document.addEventListener('click',markActivity,{passive:true});
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
  const s=size(),rects=rectsToAvoid(),roll=Math.random();
  if(roll<.08){setMood('resting',0);isSleeping=true;root.classList.add('is-resting');img.src=currentSleepSprite();clearTimeout(napTimer);napTimer=setTimeout(()=>{root.classList.remove('is-resting');isSleeping=false;img.src=currentSprite();setMood('curious');scheduleWander(500)},2800+Math.random()*1200);scheduleWander(16000+Math.random()*4000);return}
  if(root.classList.contains('is-resting')){root.classList.remove('is-resting');isSleeping=false;img.src=currentSprite();clearTimeout(napTimer)}
  if(roll<.36)setMood('watchful',1300);else setMood('curious',1800);
  let best=null,bestScore=Infinity;
  for(let i=0;i<24;i++){
   const px=8+Math.random()*Math.max(1,innerWidth-s.w-16),py=8+Math.random()*Math.max(1,innerHeight-s.h-16);
   const d=Math.hypot(px-x,py-y);if(d<55||d>Math.min(360,Math.max(innerWidth,innerHeight)*.65))continue;
   const cost=score(px,py,rects,s)+d*.12+Math.random()*900;
   if(cost<bestScore){bestScore=cost;best={x:px,y:py}}
  }
  if(best)go(best.x,best.y);scheduleWander(5200+Math.random()*4200);
 }
 function scheduleWander(delay){clearTimeout(wanderTimer);wanderTimer=setTimeout(wander,delay)}
 const start=perch();x=tx=start.x;y=ty=start.y;place();markActivity();scheduleWander(1800);
 function peekAtResults(){
  const results=document.getElementById('resultadosCounter');
  if(!results||getComputedStyle(results).display==='none'||!results.getClientRects().length)return;
  clearTimeout(resultReturnTimer);peeking=true;wakeUp();setMood('interested',3200);root.classList.add('is-curious');
  const r=results.getBoundingClientRect(),s=size(),candidates=[
   {x:r.left-s.w-10,y:r.top+12},{x:r.right+10,y:r.top+12},
   {x:r.left-s.w-10,y:r.bottom-s.h-8},{x:r.right+10,y:r.bottom-s.h-8},
   {x:r.left+12,y:r.bottom+10},{x:r.right-s.w-12,y:r.bottom+10}
  ];
  const rects=rectsToAvoid();let best=candidates[0],bestScore=Infinity;
  for(const c of candidates){const px=clamp(c.x,8,innerWidth-s.w-8),py=clamp(c.y,8,innerHeight-s.h-8);const cost=score(px,py,rects,s)+Math.hypot(px-x,py-y)*.08;if(cost<bestScore){bestScore=cost;best={x:px,y:py}}}
  go(best.x,best.y);
  resultReturnTimer=setTimeout(()=>{peeking=false;root.classList.remove('is-curious');setMood('curious');if(!scrolling)scheduleWander(900)},3200);
 }
 function schedulePeek(){clearTimeout(resultTimer);resultTimer=setTimeout(peekAtResults,500)}
 function noticeMouse(e){
  mouseX=e.clientX;mouseY=e.clientY;clearTimeout(mouseTimer);
  mouseTimer=setTimeout(()=>{
   if(scrolling||mouseX==null)return;
   const s=size(),cx=x+s.w/2,cy=y+s.h/2,d=Math.hypot(mouseX-cx,mouseY-cy);
   if(d>360)return;const now=Date.now();if(now-lastReact<1100)return;lastReact=now;
   // Cats may investigate, lose interest, or hop away when something gets too close.
   if(d<62&&Math.random()<.58){
    setMood('startled',900);wakeUp();const angle=Math.atan2(cy-mouseY,cx-mouseX)+(Math.random()-.5)*.65;
    go(x+Math.cos(angle)*(70+Math.random()*50),y+Math.sin(angle)*(50+Math.random()*35));hop('pounce');scheduleWander(1700);return;
   }
   if(Math.random()<.24){setMood('aloof',1300);return}
   setMood('watchful',1000);curiosityUntil=now+1200;
   const angle=Math.atan2(mouseY-cy,mouseX-cx)+(Math.random()-.5)*.55;
   const distance=clamp(d*.32,38,95);
   go(mouseX-Math.cos(angle)*distance-s.w/2,mouseY-Math.sin(angle)*distance-s.h/2);
   if(!peeking)scheduleWander(3800+Math.random()*2500);
  },380);
 }
 addEventListener('mousemove',e=>{markActivity();noticeMouse(e)},{passive:true});
 addEventListener('touchstart',markActivity,{passive:true});
 addEventListener('touchmove',e=>{markActivity();if(e.touches&&e.touches[0])noticeMouse(e.touches[0])},{passive:true});
 addEventListener('keydown',markActivity,{passive:true});
 addEventListener('scroll',()=>{
  markActivity();
  const delta=scrollY-previousScroll;previousScroll=scrollY;scrolling=true;root.classList.add('is-lagging');setWalking(true);
  const s=size();tx=clamp(x-delta*.25,8,innerWidth-s.w-8);ty=clamp(y+Math.sign(delta)*Math.min(16,Math.abs(delta)*.1),8,innerHeight-s.h-8);
  if(!raf)raf=requestAnimationFrame(frame);clearTimeout(scrollTimer);
  scrollTimer=setTimeout(()=>{scrolling=false;root.classList.remove('is-lagging');setWalking(false);if(isSleeping)return;if(peeking){peekAtResults();return}const p=perch();go(p.x,p.y);scheduleWander(1800)},220);
 },{passive:true});
 addEventListener('resize',()=>{const s=size();tx=clamp(tx,8,innerWidth-s.w-8);ty=clamp(ty,8,innerHeight-s.h-8);if(!raf)raf=requestAnimationFrame(frame)},{passive:true});
 const results=document.getElementById('resultadosCounter');
 if(results)new MutationObserver(schedulePeek).observe(results,{attributes:true,attributeFilter:['style','class','hidden'],childList:true,subtree:true});
})();