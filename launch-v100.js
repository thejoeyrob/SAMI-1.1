(()=>{
'use strict';
const root=document.documentElement;
const gate=document.getElementById('mobileInstallGate');
const installBtn=document.getElementById('gateInstallBtn');
const installCopy=document.getElementById('gateInstallInstructions');
const salesLayer=document.getElementById('salesIntroLayer');
const salesFrame=document.getElementById('salesIntroFrame');
let promptEvent=window.__SAMI_INSTALL_PROMPT__||null;
function standalone(){return matchMedia?.('(display-mode: standalone)')?.matches||matchMedia?.('(display-mode: fullscreen)')?.matches||navigator.standalone===true;}
function portable(){const ua=navigator.userAgent||'';const touch=(navigator.maxTouchPoints||0)>0;return /Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||(touch&&matchMedia?.('(pointer: coarse)')?.matches);}
function ios(){return /iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
function gateRequired(){return portable()&&!standalone();}
function closeLegacySplash(){const splash=document.getElementById('splash');if(splash)splash.style.display='none';}
function unlockWorkspace(){root.classList.remove('browser-gated','sales-intro-active');if(salesLayer)salesLayer.style.display='none';closeLegacySplash();const app=document.getElementById('app');if(app)app.removeAttribute('aria-hidden');}
function showSalesIntro(){root.classList.remove('browser-gated','install-required');root.classList.add('sales-intro-active');closeLegacySplash();if(salesLayer){salesLayer.style.display='block';salesLayer.setAttribute('aria-hidden','false');}if(salesFrame&&!salesFrame.src.includes('embedded=1'))salesFrame.src='meet.html?embedded=1';}
function renderGate(){root.classList.add('install-required','browser-gated');root.classList.remove('sales-intro-active');if(salesLayer)salesLayer.style.display='none';if(gate)gate.style.display='grid';closeLegacySplash();if(!installCopy||!installBtn)return;if(ios()){
  installBtn.hidden=true;
  installCopy.innerHTML='<strong>Install SAMI to continue</strong><span>In Safari, tap the <b>Share</b> button, then choose <b>Add to Home Screen</b>. Open SAMI from the new Home Screen icon. Apple does not provide a website button that can open this panel automatically.</span>';
}else if(promptEvent){
  installBtn.hidden=false;installBtn.textContent='Add SAMI to Home Screen';
  installCopy.innerHTML='<strong>Install SAMI to continue</strong><span>The SAMI workspace is available from the installed app only on phones and tablets.</span>';
}else{
  installBtn.hidden=true;
  installCopy.innerHTML='<strong>Install SAMI to continue</strong><span>Use your browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>, then launch SAMI from the installed icon.</span>';
}}
async function promptInstall(){if(!promptEvent){renderGate();return;}const p=promptEvent;promptEvent=null;window.__SAMI_INSTALL_PROMPT__=null;try{p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted'){installBtn.hidden=true;installCopy.innerHTML='<strong>SAMI installed</strong><span>Open SAMI from the new Home Screen icon to use the workspace.</span>';}else renderGate();}catch{renderGate();}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;window.__SAMI_INSTALL_PROMPT__=e;if(gateRequired())renderGate();});
addEventListener('appinstalled',()=>{promptEvent=null;window.__SAMI_INSTALL_PROMPT__=null;if(gateRequired()&&installCopy){installBtn.hidden=true;installCopy.innerHTML='<strong>SAMI installed</strong><span>Now open SAMI from the Home Screen icon. This browser page remains installation-only.</span>';}});
addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='sami:sales-intro-done')unlockWorkspace();});
installBtn?.addEventListener('click',promptInstall);
document.getElementById('salesIntroSkip')?.addEventListener('click',()=>{try{salesFrame?.contentWindow?.postMessage({type:'sami:sales-intro-skip'},location.origin);}catch{}unlockWorkspace();});
function boot(){
  if(gateRequired()){renderGate();return;}
  const returning=new URLSearchParams(location.search).get('from')==='meet';
  if(returning){
    unlockWorkspace();
    try{history.replaceState(null,'',location.pathname+location.hash);}catch{}
    return;
  }
  showSalesIntro();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
addEventListener('pageshow',()=>{if(gateRequired())renderGate();},{passive:true});
})();
