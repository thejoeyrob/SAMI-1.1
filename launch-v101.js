(()=>{
'use strict';
const $=q=>document.querySelector(q);
function ensureSidebarSemantics(){const fold=$('#dockFold'),reopen=$('#dockReopen'),rail=$('#railCollapse');if(rail)rail.hidden=true;if(fold){fold.textContent='‹';fold.title='Hide complete sidebar';fold.setAttribute('aria-label','Hide complete sidebar')}if(reopen){reopen.textContent='TOOLS ›';reopen.title='Show complete sidebar';reopen.setAttribute('aria-label','Show complete sidebar')}}
function addCloseButton(){if($('#closeAppV101'))return;const host=$('.top-actions');if(!host)return;const b=document.createElement('button');b.id='closeAppV101';b.className='header-btn';b.type='button';b.title='Close SAMI';b.setAttribute('aria-label','Close SAMI');b.textContent='Close';host.appendChild(b);b.addEventListener('click',closeApp)}
function showIntro(url){const root=document.documentElement,layer=$('#salesIntroLayer'),frame=$('#salesIntroFrame'),skip=$('#salesIntroSkip');if(!layer||!frame)return;root.classList.add('sales-intro-active');$('#app')?.setAttribute('aria-hidden','true');layer.style.display='block';layer.setAttribute('aria-hidden','false');if(skip)skip.style.display=url.includes('closing=1')?'none':'';frame.src=url}
function closeApp(){showIntro('meet.html?embedded=1&closing=1&v=110')}
function closedFallback(){document.documentElement.classList.remove('sales-intro-active');$('#salesIntroLayer')?.remove();$('#app')?.setAttribute('aria-hidden','true');const x=document.createElement('div');x.id='samiClosedScreen';x.innerHTML='<div><img src="sami-wordmark.eb168c8e3c.png" alt="SAMI"><p>SAMI closed</p></div>';document.body.appendChild(x);try{window.close()}catch{}}
addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='sami:close-ready')closedFallback()});
function boot(){ensureSidebarSemantics();addCloseButton();const dock=$('#studioDock');if(dock&&!dock.dataset.v101Observed){dock.dataset.v101Observed='1';new MutationObserver(ensureSidebarSemantics).observe(dock,{childList:true,subtree:true})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,80),{once:true});else setTimeout(boot,80);
})();
