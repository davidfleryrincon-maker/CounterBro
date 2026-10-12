/* CounterBro Gecko: optional visual companion, isolated from counter logic. */
(function(){
 const settings=window.COUNTERBRO_GECKO||{enabled:false};
 if(!settings.enabled || document.getElementById('counterbro-gecko-widget')) return;
 const root=document.createElement('div');
 root.id='counterbro-gecko-widget';
 root.setAttribute('aria-hidden','true');
 const img=document.createElement('img');
 img.src='counterbro-gecko/gecko.svg';
 img.alt='';
 root.appendChild(img);
 document.body.appendChild(root);
 let showTimer;
 window.addEventListener('scroll',()=>{
   root.classList.add('is-hidden');
   clearTimeout(showTimer);
   showTimer=setTimeout(()=>root.classList.remove('is-hidden'),450);
 },{passive:true});
})();