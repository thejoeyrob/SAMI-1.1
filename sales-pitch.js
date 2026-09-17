(()=>{
'use strict';
const pitch=document.getElementById('pitch');
const canvas=document.getElementById('pitchCanvas');
const ctx=canvas?.getContext('2d',{alpha:true});
if(!pitch||!canvas||!ctx)return;
const labelsHost=document.getElementById('pitchLabels');
const centre=document.getElementById('centreNode');
const sceneNetwork=document.getElementById('sceneNetwork');
const sceneResolve=document.getElementById('sceneResolve');
const resolvePin=document.getElementById('resolvePin');
const resolveBrand=document.getElementById('resolveBrand');
const wordmark=document.getElementById('pitchWordmark');
const caption=document.getElementById('pitchCaption');
const bigCopy=document.getElementById('bigCopy');
const progress=document.getElementById('pitchProgress');
const enter=document.getElementById('pitchEnter');
const guide=document.getElementById('pitchInstallGuide');
const replay=document.getElementById('pitchReplay');
const soundBtn=document.getElementById('pitchSound');
const fx=document.getElementById('pitchFx');
const reduced=matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
let installPrompt=null,started=0,raf=0,soundOn=false,ended=false,lastStage=-1;
const DURATION=47.5;
const ITEMS=[
['SITE VISIT',.14,.24],['PHOTOGRAPHS',.28,.17],['NOTES',.42,.22],['SERVICE INFORMATION',.61,.16],['UTILITY PLANS',.76,.24],['MEASUREMENTS',.86,.35],['VERIFICATION',.89,.50],['COMMUNICATION',.83,.66],['DRAFT',.72,.78],['CAD',.58,.84],['REVIEW',.43,.80],['AMENDMENT',.27,.84],['RE-REVIEW',.14,.72],['APPROVAL',.10,.54],['PROJECT CHANGE',.12,.38],['UPDATES',.27,.63],['TIME',.37,.10],['COST',.55,.10],['TRAVEL',.72,.10],['ENVIRONMENTAL IMPACT',.89,.78]
];
const captions=[
[0,'Creating one site plan brings together a lot of moving parts.'],
[3.0,'Site visits. Photographs. Notes. Service information.'],
[8.5,'Utility plans. Measurements. Verification. Communication.'],
[14.3,'Drafting. CAD. Review. Amendment. Re-review. Approval.'],
[21.0,'Then the project changes, and the cycle starts again.'],
[25.0,'More updates. More time. More cost. More travel. More duplication. More environmental impact.'],
[31.0,'Different sources of information. Different processes. Different people.'],
[35.0,'And somehow, it all has to come together in one plan.'],
[38.1,'What if we brought it all together?']
];
const copyStages=[
[38.4,40.0,'ONE SOURCE OF INFORMATION'],[40.0,41.0,'ONE TEAM'],[41.0,42.0,'ONE TOOL'],[42.0,43.5,'IT’S TIME TO WORK SMARTER'],[43.5,44.6,'IT’S TIME TO…'],[44.6,47.5,'ASK SAMI','green']
];
function resize(){const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0)}
function clamp(v,a=0,b=1){return Math.max(a,Math.min(b,v))}
function ease(t){t=clamp(t);return 1-Math.pow(1-t,3)}
function createLabels(){labelsHost.innerHTML='';ITEMS.forEach(([text,x,y],i)=>{const e=document.createElement('div');e.className='pitch-label';e.textContent=text;e.style.left=(x*100)+'%';e.style.top=(y*100)+'%';e.dataset.i=i;labelsHost.appendChild(e)})}
function linePoint(item){const r=canvas.getBoundingClientRect(),cx=r.width*.5,cy=r.height*.51;return[cx+(item[1]-.5)*r.width,cy+(item[2]-.51)*r.height]}
function drawBackground(t){const w=canvas.clientWidth,h=canvas.clientHeight,cx=w*.5,cy=h*.51;ctx.clearRect(0,0,w,h);const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.55);g.addColorStop(0,'rgba(46,238,164,.055)');g.addColorStop(.35,'rgba(12,154,132,.018)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const q=.014+.006*Math.sin(t*1.15);ctx.strokeStyle=`rgba(88,244,171,${q})`;ctx.lineWidth=.6;for(let i=0;i<18;i++){const a=(i/18)*Math.PI*2+t*.009,r=Math.min(w,h)*(.16+(i%5)*.04);ctx.beginPath();ctx.ellipse(cx,cy,r*2.2,r*.56,a*.04,0,Math.PI*2);ctx.stroke()}}
function drawNetwork(t){const w=canvas.clientWidth,h=canvas.clientHeight,cx=w*.5,cy=h*.51;const grow=clamp((t-2.3)/27.0);const visible=Math.min(ITEMS.length,Math.floor(grow*ITEMS.length+0.8));ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(let i=0;i<visible;i++){const [x,y]=linePoint(ITEMS[i]);const p=clamp((grow*ITEMS.length-i));const midX=cx+(x-cx)*(.45+((i%3)*.08)),midY=cy+(y-cy)*(.42+((i%4)*.05));ctx.globalAlpha=.18+.35*p;ctx.strokeStyle=i%4===0?'rgba(119,255,174,.92)':'rgba(42,227,190,.82)';ctx.lineWidth=.75+(i%5===0?.45:0);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(midX,midY);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=.36+.42*p;ctx.fillStyle='rgba(113,255,177,.85)';ctx.beginPath();ctx.arc(x,y,i%4===0?2.1:1.25,0,Math.PI*2);ctx.fill();if(i%3===0){ctx.globalAlpha=.13;ctx.strokeStyle='rgba(93,255,173,.72)';ctx.beginPath();ctx.arc(x,y,6+Math.sin(t*2+i)*2,0,Math.PI*2);ctx.stroke()}}
ctx.restore();
const els=labelsHost.children;for(let i=0;i<els.length;i++){const on=i<visible;els[i].classList.toggle('on',on);els[i].classList.toggle('flash',on&&i===visible-1)}
}
function updateCaption(t){let text='';for(const c of captions){if(t>=c[0])text=c[1]}caption.textContent=text;caption.classList.toggle('show',!!text&&t<38.3)}
function updateCopy(t){let stage=-1;for(let i=0;i<copyStages.length;i++){const s=copyStages[i];if(t>=s[0]&&t<s[1]){stage=i;break}}if(stage!==lastStage){lastStage=stage;bigCopy.classList.remove('show','green');if(stage>=0){const s=copyStages[stage];bigCopy.textContent=s[2];bigCopy.classList.toggle('green',s[3]==='green');requestAnimationFrame(()=>bigCopy.classList.add('show'))}else bigCopy.textContent=''}
}
function startCollapse(t){const p=clamp((t-36.6)/1.65);sceneNetwork.style.transform=`scale(${1-.04*p})`;sceneNetwork.style.opacity=String(1-.88*p);if(p>0){const els=labelsHost.children;for(let i=0;i<els.length;i++)els[i].style.opacity=String(1-p)}if(p>=.95)sceneNetwork.classList.add('dimmed')}
function resolveSequence(t){if(t<44.35)return;pitch.classList.add('resolve-mode');sceneResolve.classList.add('on');const stage=clamp((t-44.35)/2.7);const cr=centre.getBoundingClientRect(),wr=wordmark.getBoundingClientRect();const fromX=cr.left+cr.width/2,fromY=cr.top+cr.height*.42,targetX=wr.left+wr.width*.410,targetY=wr.top+wr.height*.665;const dx=(targetX-fromX)*ease(clamp(stage/0.45)),dy=(targetY-fromY)*ease(clamp(stage/0.45));resolvePin.style.left=fromX+'px';resolvePin.style.top=fromY+'px';resolvePin.style.transform=`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${1-.67*ease(clamp(stage/.45))})`;if(stage>.28)resolveBrand.classList.add('on');if(stage>.46)resolveBrand.classList.add('wordmark-on');if(stage>.54)resolvePin.style.opacity=String(1-clamp((stage-.54)/.18));if(stage>.80)ended=true}
function frame(now){const t=reduced?47.3:(now-started)/1000;drawBackground(t);if(t<36.8)drawNetwork(t);if(t>=36.6&&t<38.4)startCollapse(t);updateCaption(t);updateCopy(t);resolveSequence(t);progress.style.width=(clamp(t/DURATION)*100)+'%';if(t<DURATION&&!reduced)raf=requestAnimationFrame(frame);else{ended=true;progress.style.width='100%'}}
function start(){cancelAnimationFrame(raf);started=performance.now();ended=false;lastStage=-1;pitch.classList.remove('resolve-mode');sceneNetwork.classList.remove('dimmed');sceneNetwork.style.cssText='';sceneResolve.classList.remove('on');resolveBrand.classList.remove('on','wordmark-on');resolvePin.style.cssText='';bigCopy.className='big-copy';caption.className='pitch-caption';createLabels();if(soundOn){fx.currentTime=0;fx.volume=.22;fx.play().catch(()=>{})}raf=requestAnimationFrame(frame)}
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function ios(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function installText(){guide.hidden=false;if(ios()){guide.innerHTML='<strong>Add SAMI to your Home Screen</strong><br>Tap <b>Share</b> in Safari, then choose <b>Add to Home Screen</b>. Apple does not allow websites to open that panel automatically.'}else{guide.innerHTML='<strong>Install SAMI</strong><br>Use your browser’s Install / Add to Home Screen option, then launch SAMI from the new app icon.'}}
async function enterApp(){if(standalone()){location.href='./index.html?from=meet';return}if(installPrompt){installPrompt.prompt();try{await installPrompt.userChoice}catch{}installPrompt=null;installText();return}installText()}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
addEventListener('appinstalled',()=>{setTimeout(()=>location.href='./index.html?from=meet',500)});
enter.addEventListener('click',enterApp);
replay.addEventListener('click',start);
soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?'Sound on':'Sound';if(soundOn){fx.currentTime=0;fx.volume=.22;fx.play().catch(()=>{})}else fx.pause()});
addEventListener('resize',resize,{passive:true});
resize();createLabels();start();
})();
