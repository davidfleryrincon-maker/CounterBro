/* CounterBro Gecko: feature opt-in, no impact on counters. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled || document.getElementById('counterbro-gecko-widget')) return;
 const root=document.createElement('div');
 root.id='counterbro-gecko-widget';
 root.setAttribute('aria-hidden','true');
 const img=document.createElement('img');
 img.src='counterbro-gecko/gecko.svg';
 img.alt='';
 root.appendChild(img); document.body.appendChild(root);
 let hidden=false,dir=-1;
 function blink(){if(hidden||document.hidden)return;root.style.transform='translateY(-3px) scaleX('+dir+')';setTimeout(()=>{root.style.transform='scaleX('+dir+')'},240)}
 root.style.transform='scaleX('+dir+')';
 setInterval(blink,4200);
 window.addEventListener('scroll',()=>{root.classList.add('is-hidden');clearTimeout(root._showTimer);root._showTimer=setTimeout(()=>root.classList.remove('is-hidden'),450)},{passive:true});
 window.addEventListener('resize',()=>{root.style.transform='scaleX('+dir+')'});
})();