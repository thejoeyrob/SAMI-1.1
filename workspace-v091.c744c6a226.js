(() => {
'use strict';
const PreviousFactory = window.SAMIStudio;
if (typeof PreviousFactory !== 'function') return;
window.SAMIStudio = function(C,O){
  const base = PreviousFactory(C,O);
  const S=C.state,G=C.G,PRODUCTS=C.PRODUCTS,ASSETS=C.ASSETS,SERVICES=C.SERVICES;
  const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)], esc=C.esc;
  const layout={planDrawer:'planDraw',drawStyle:'line',drawAsset:'surface_route',placeAsset:'rigid',reference:null,corner:null};
  const DRAW_ITEMS={
    surface_access:{name:'Access route',kind:'line',allowed:['line','freeLine']},
    surface_egress:{name:'Egress route',kind:'line',allowed:['line','freeLine']},
    surface_route:{name:'On-site route',kind:'line',allowed:['line','freeLine']},
    surface_stoneRoad:{name:'Stone road',kind:'line',allowed:['line','freeLine']},
    surface_stoneArea:{name:'Stone hardstanding',kind:'area',allowed:['area','freeArea']},
    surface_area:{name:'Compound / area',kind:'area',allowed:['area','freeArea']},
    surface_hazard:{name:'Concern / exclusion area',kind:'area',allowed:['area','freeArea']},
    surface_excavation:{name:'Excavation',kind:'area',allowed:['area','freeArea']},
    panel_lion:{name:'Lion Panel',kind:'trakway',allowed:['line','freeLine','area','freeArea']},
    panel_hybrid:{name:'Hybrid Panel',kind:'trakway',allowed:['line','freeLine','area','freeArea']},
    panel_tuff:{name:'TuffTrak',kind:'trakway',allowed:['line','freeLine','area','freeArea']},
    panel_sabre:{name:'Sabre-X',kind:'trakway',allowed:['line','freeLine','area','freeArea']}
  };
  const DRAW_STYLE_NAMES={line:'Point line',freeLine:'Freehand line',area:'Point area',freeArea:'Freehand area'};
  let referenceOverlay=null;
  function currentMode(){return S.mode==='create'?'create':S.mode;}
  function modeTitle(){return {map:'MAP',plan:'SITE PLAN',route:'ROUTE TO SITE',create:'CREATE A SHAPE'}[currentMode()]||'SAMI';}
  function projectAreaSummary(){const b=S.project.area;if(!b)return 'No drawing space defined';const a=G.area(b);return (a>=10000?(a/10000).toFixed(2)+' ha':Math.round(a).toLocaleString()+' m²')+' drawing space';}
  function railButton(drawer,icon,label){return `<button class="rail-tool" data-workspace-drawer="${drawer}"><span>${icon}</span><small>${label}</small></button>`;}
  function updateModeChrome(){
    const createBtn=$('[data-mode="create"]');if(createBtn)createBtn.textContent='Create a shape';
    const cap=$('#modeCaption');if(cap)cap.textContent={map:'Explore and define the drawing space',plan:'Draw, place and issue the site plan',route:'Plan the journey to the site',create:'Build reusable scaled shapes'}[currentMode()]||'';
    const title=$('#studioDock .dock-title strong');if(title)title.textContent=modeTitle();
    document.body.dataset.masterMode=currentMode();
    renderRail();
    const dockTools=$('#dockTools'),dockBase=$('#dockBase'),dockAssistant=$('#dockAssistant');
    if(dockTools)dockTools.hidden=true;if(dockBase)dockBase.hidden=true;if(dockAssistant)dockAssistant.hidden=true;
  }
  function renderRail(){
    const rail=$('#toolRail');if(!rail)return;
    let html='';
    if(S.mode==='map')html=railButton('mapExplore','⌕','Explore')+railButton('mapImage','▧','Image locate')+railButton('mapArea','⌗','Drawing space');
    else if(S.mode==='plan')html=railButton('planDraw','✎','Draw')+railButton('planPlace','▣','Place')+railButton('planServices','≋','Services')+railButton('planSelect','↖','Select')+railButton('planStyle','◐','Style')+railButton('planAccess','◎','Access / area');
    else if(S.mode==='route')html=railButton('routeToSite','⇢','Route tools');
    else if(S.mode==='create')html=railButton('create','◇','Shape builder')+railButton('shapeLibrary','▣','My shapes');
    rail.innerHTML=html;
    rail.querySelectorAll('[data-workspace-drawer]').forEach(b=>b.onclick=()=>openDrawer(b.dataset.workspaceDrawer));
    rail.querySelectorAll('[data-workspace-drawer]').forEach(b=>b.classList.toggle('active',b.dataset.workspaceDrawer===S.drawer));
  }
  function ensureAssistantChrome(){
    if(!$('#samiHeaderBtn')){
      const b=document.createElement('button');b.id='samiHeaderBtn';b.className='header-btn sami-header-logo';b.title='Ask SAMI';b.setAttribute('aria-label','Ask SAMI');b.innerHTML='<img src="sami-mark.a35b3708c9.png" alt="">';$('.top-actions')?.prepend(b);b.onclick=()=>toggleSamiChat(true,true);
    }
    if(!$('#samiChatBubble')){
      const b=document.createElement('button');b.id='samiChatBubble';b.className='sami-chat-bubble';b.title='Text chat with SAMI';b.setAttribute('aria-label','Open SAMI text chat');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4V5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
      $('#workspace')?.append(b);b.onclick=()=>toggleSamiChat(true,true);
    }
    let shell=$('#samiChatShell');
    if(!shell){shell=document.createElement('section');shell.id='samiChatShell';shell.className='sami-chat-shell';shell.setAttribute('aria-label','Ask SAMI');$('#workspace')?.append(shell);}
    const bar=$('.ask-bar-wrap'),panel=$('#samiPanel');if(bar&&bar.parentElement!==shell)shell.append(bar);if(panel&&panel.parentElement!==shell)shell.prepend(panel);
    $('#closeSami')?.addEventListener('click',()=>toggleSamiChat(false));
    $('#quickAssets')?.setAttribute('hidden','');$('#quickHelp')?.setAttribute('hidden','');
  }
  function toggleSamiChat(on=true,focus=false){const shell=$('#samiChatShell');if(!shell)return;shell.classList.toggle('open',on);$('#samiPanel')?.classList.toggle('open',on);if(on&&focus)setTimeout(()=>$('#askInput')?.focus(),60);}
  function ensureSidebarTab(){const b=$('#dockReopen');if(!b)return;b.textContent='TOOLS ›';b.classList.add('workspace-tool-tab');b.title='Show tools';const w=$('#workspace');if(w&&b.parentElement!==w)w.append(b);}
  const originalSetMode=base.setMode;
  function setMode(mode){
    if(mode==='plan'&&!S.project.area){originalSetMode('map');updateModeChrome();openDrawer('mapArea');C.toast('Define the drawing space first. SAMI will open Site Plan as soon as it is confirmed.');return false;}
    const result=originalSetMode(mode);updateModeChrome();
    queueMicrotask(()=>{
      if(mode==='map')openDrawer('mapExplore');
      else if(mode==='plan')openDrawer(layout.planDrawer||'planDraw');
      else if(mode==='route')openDrawer('routeToSite');
      else if(mode==='create'){const opt=$('#dockOptions');if(opt)opt.open=false;}
    });
    return result;
  }
  const originalSetModeUI=base.setModeUI;
  function setModeUI(mode){originalSetModeUI(mode);updateModeChrome();}
  const originalOpenDrawer=base.openDrawer;
  function openDrawer(kind){
    if(S.mode==='map'){
      if(kind==='search')kind='mapExplore';
      if(kind==='area')kind='mapArea';
      if(['draw','assets','services','layers'].includes(kind))kind='mapExplore';
    } else if(S.mode==='plan'){
      if(kind==='draw')kind='planDraw';
      else if(kind==='assets'||kind==='library')kind='planPlace';
      else if(kind==='services')kind='planServices';
      else if(kind==='area'||kind==='access')kind='planAccess';
      else if(kind==='layers')kind='planSelect';
    } else if(S.mode==='route'&&kind!=='routeToSite'&&kind!=='project'&&kind!=='selection')kind='routeToSite';
    if(kind.startsWith('plan'))layout.planDrawer=kind;
    originalOpenDrawer(kind);updateModeChrome();
  }
  function mapExploreHTML(){return `<div class="card master-intro"><span class="tag">MAP · EXPLORE</span><h3>Find the site before drawing</h3><p class="subtle">Search, inspect Map or Satellite and define the drawing space. Drawing tools stay unavailable in Map mode.</p></div>
    <label class="field-label">Place, address or postcode<input class="field" id="mapExploreQuery" placeholder="Site, road, town or postcode"></label>
    <div class="row equal"><button data-action="mapSearch" class="primary">Find place</button><button data-action="mapLocate">Use my location</button></div>
    <div class="map-explore-bases"><button data-action="workspaceBase:street">Map</button><button data-action="workspaceBase:satellite">Satellite</button></div><div class="explore-capture-v101"><button data-action="draw:note">＋ Note marker</button><button data-action="draw:photo">＋ Photo marker</button></div><div class="explore-capture-note"><strong>Field capture</strong> · Notes and photos stay on the live project map by default and are excluded from the issued drawing until you choose <em>Show on issued drawing</em>.</div>
    <div class="card"><strong>${esc(projectAreaSummary())}</strong><p class="subtle">Once the drawing space is confirmed, SAMI automatically opens Site Plan.</p></div>
    <button data-action="open:mapImage">Find from map / satellite image</button><button data-action="open:mapArea" class="primary">${S.project.area?'Adjust drawing space':'Define drawing space'}</button>`;}
  function mapAreaHTML(){const has=!!S.project.area;return `<div class="card master-intro"><span class="tag">DRAWING SPACE</span><h3>${has?'Adjust the plan area':'Define the plan area'}</h3><p class="subtle">This is the only drawing operation available in Map mode. Confirming it takes you directly into Site Plan.</p></div>
    <div class="area-method-grid"><button data-action="defineAreaFreehand"><strong>Freehand extent</strong><small>Sketch the required space; SAMI fits the landscape drawing frame</small></button><button data-action="defineAreaPoints"><strong>Point boundary</strong><small>Drop points around the required space</small></button><button data-action="defineArea"><strong>Two corners</strong><small>Fast rectangular extent</small></button><button data-action="visibleArea"><strong>Use visible map</strong><small>Use the current view as the plan extent</small></button></div>
    ${has?`<div class="card"><strong>${esc(projectAreaSummary())}</strong><p class="subtle">You can revise this later under Site Plan → Access / area.</p></div><button data-action="planMode" class="primary">Open Site Plan</button>`:''}`;}
  function drawStyleButtons(item){const allowed=item?.allowed||[];return `<div class="draw-style-grid">${Object.entries(DRAW_STYLE_NAMES).map(([k,v])=>`<button data-action="drawStyle:${k}" class="${layout.drawStyle===k?'active':''}" ${allowed.includes(k)?'':'disabled'}>${v}</button>`).join('')}</div>`;}
  function drawItemButton(k,v){const selected=layout.drawAsset===k;return `<button class="draw-library-item ${selected?'active':''}" data-action="drawChoose:${k}"><span class="draw-kind-icon">${v.kind==='trakway'?'▤':v.kind==='area'?'⬡':'⌁'}</span><span>${esc(v.name)}<small>${v.kind==='trakway'?`${PRODUCTS[k.slice(6)]?.length||''} m progression`:v.kind==='area'?'Area drawing':'Line drawing'}</small></span></button>`;}
  function planDrawHTML(){const item=DRAW_ITEMS[layout.drawAsset]||DRAW_ITEMS.surface_route;if(!item.allowed.includes(layout.drawStyle))layout.drawStyle=item.allowed[0];return `<div class="card master-intro"><span class="tag">SITE PLAN · DRAW</span><h3>Draw connected plan geometry</h3><p class="subtle">Choose one drawing style. Incompatible styles are disabled automatically for the selected item.</p>${drawStyleButtons(item)}</div>
    <div class="asset-category"><div class="asset-category-title">Routes & areas</div><div class="draw-library">${Object.entries(DRAW_ITEMS).filter(([,v])=>v.kind!=='trakway').map(([k,v])=>drawItemButton(k,v)).join('')}</div></div>
    <div class="asset-category"><div class="asset-category-title">Trakway</div><div class="draw-library">${Object.entries(DRAW_ITEMS).filter(([,v])=>v.kind==='trakway').map(([k,v])=>drawItemButton(k,v)).join('')}</div></div>
    <button data-action="startPlanDraw" class="primary">Start ${esc(DRAW_STYLE_NAMES[layout.drawStyle])}</button>
    <div class="asset-category"><div class="asset-category-title">Shapes & annotation</div><div class="compact-tools"><button data-action="draw:rectangle">Rectangle</button><button data-action="draw:circle">Circle</button><button data-action="draw:arrow">Arrow</button><button data-action="draw:measure">Dimension</button><button data-action="draw:textBox">Text</button><button data-action="draw:photo">Photo</button></div></div>`;}
  function placeItems(){const groups={};for(const [k,v] of Object.entries(ASSETS)){if(k.startsWith('surface_')||k.startsWith('panel_'))continue;(groups[v.category||'Other']??=[]).push([k,v]);}return groups;}
  function planPlaceHTML(){const groups=placeItems();return `<div class="card master-intro"><span class="tag">SITE PLAN · PLACE</span><h3>Place individual objects</h3><p class="subtle">For single panels, plant, welfare, event equipment, signs and reusable shapes. Connected or repeated geometry belongs under Draw.</p></div>
    <details class="asset-category" open><summary>Single Trakway panels</summary><div class="asset-grid">${Object.entries(PRODUCTS).filter(([k])=>k!=='custom').map(([k,p])=>`<button class="asset-palette" data-action="placePanel:${k}"><span class="asset-preview">▤</span><span class="asset-copy">${esc(p.name)}<small>${p.length} × ${p.width} m</small></span></button>`).join('')}</div></details>
    <details class="asset-category"><summary>Pre-made Trakway corners</summary><div class="corner-grid">${['lion','hybrid','tuff'].map(k=>`<div class="corner-product"><strong>${esc(PRODUCTS[k].name)}</strong><div><button data-action="placeCorner:${k}:30">30°</button><button data-action="placeCorner:${k}:45">45°</button><button data-action="placeCorner:${k}:60">60°</button></div></div>`).join('')}<p class="subtle">Corner templates use the same SAMI panel engine and junction rules as a drawn run.</p></div></details>
    ${Object.entries(groups).map(([cat,items],i)=>`<details class="asset-category" ${i===0?'open':''}><summary>${esc(cat)}</summary><div class="asset-grid">${items.map(([k,v])=>`<button class="asset-palette" data-action="placeOne:${k}"><span class="asset-preview">${base.assetIconSVG?base.assetIconSVG(k,v):'▣'}</span><span class="asset-copy">${esc(v.name)}<small>${v.length||'?'} × ${v.width||'?'} m</small></span></button>`).join('')}</div></details>`).join('')}`;}
  function planSelectHTML(){const fs=S.project.features.filter(f=>!f.properties.guideHidden);return `<div class="card master-intro"><span class="tag">SITE PLAN · SELECT</span><h3>Select and edit plan items</h3><p class="subtle">Tap an item on the drawing or select it here. Grouping, dimensions, colour, fill, outline, movement and rotation stay attached to the selected item.</p></div>
    <button data-action="selectMode" class="primary">Select on drawing</button>${fs.length?`<div class="plan-object-list">${fs.slice().reverse().slice(0,150).map(f=>`<button data-action="select:${f.id}"><span>${esc(f.properties.label||f.properties.name||f.properties.type||'Item')}</span><small>${esc(f.properties.type||'')}</small></button>`).join('')}</div>`:'<p class="subtle">No plan items yet.</p>'}`;}
  function planStyleHTML(){return `<div class="card master-intro"><span class="tag">SITE PLAN · STYLE</span><h3>Background & drawing presentation</h3><p class="subtle">These settings change the plan view, not the geometry you have drawn.</p></div>
    <div class="style-choice-grid"><button data-action="workspaceBase:street" class="${S.base==='street'?'active':''}">Map</button><button data-action="workspaceBase:satellite" class="${S.base==='satellite'?'active':''}">Satellite</button><button data-action="workspaceBase:drawing" class="${S.base==='drawing'?'active':''}">Convert / CAD</button></div>
    <button data-action="capturePlanBase">${S.project.planBaseMeta?.capturedAt?'Refresh CAD site detail':'Create CAD site detail'}</button>
    <button data-action="showDrawingTemplate" class="primary">Show drawing sheet template</button>
    <div class="row equal"><button data-action="togglePlanLock">${S.planLocked?'Unlock map':'Lock map'}</button><button data-action="fitArea">Fit plan</button></div>
    <div class="card"><strong>Drawing output</strong><p class="subtle">The CAD view includes the outer drawing border and issue title block used as the visual basis for professional exports.</p></div>`;}
  function referenceImageHTML(){const r=layout.reference;return `<div class="card master-intro"><span class="tag">MAP · IMAGE LOCATE</span><h3>Find a site from an existing image</h3><p class="subtle">Use a satellite screenshot, map image or old plan. SAMI checks image location metadata first, then a configured visual matcher, then uses your nearest-place hint for assisted alignment.</p></div>
    <button data-action="chooseReferenceImage" class="primary">${r?'Choose another image':'Choose map / satellite image'}</button>
    ${r?`<img class="reference-preview" src="${esc(r.dataUrl)}" alt="Reference map image"><label class="field-label">Is the site in the UK?<select class="field" id="referenceCountry"><option value="GB" ${r.country==='GB'?'selected':''}>Yes · United Kingdom</option><option value="" ${!r.country?'selected':''}>No / unknown</option></select></label><label class="field-label">Nearest known place (optional)<input class="field" id="referenceHint" value="${esc(r.hint||'')}" placeholder="Town, road, postcode, landmark"></label>
      <div class="reference-status">${r.gps?`Embedded location found: ${r.gps[1].toFixed(6)}, ${r.gps[0].toFixed(6)}`:'No embedded GPS location found.'}</div>
      <button data-action="matchReferenceImage" class="primary">Find this site</button>
      <div class="reference-controls"><label>Image rotation <output id="referenceRotationOut">${r.rotation||0}°</output><input id="referenceRotation" type="range" min="0" max="359" value="${r.rotation||0}"></label><label>Overlay opacity <output id="referenceOpacityOut">${Math.round((r.opacity??.55)*100)}%</output><input id="referenceOpacity" type="range" min="10" max="100" value="${Math.round((r.opacity??.55)*100)}"></label><label>Overlay scale <output id="referenceScaleOut">${Math.round((r.scale??1)*100)}%</output><input id="referenceScale" type="range" min="50" max="180" value="${Math.round((r.scale??1)*100)}"></label></div>
      <div class="row equal"><button data-action="overlayCurrentView">Fit overlay to current view</button><button data-action="removeReferenceOverlay">Hide overlay</button></div>
      <p class="subtle">Pan/zoom the live map, adjust rotation and opacity, then use “Fit overlay to current view” to re-register the reference image.</p>`:''}`;}
  const originalRenderDrawer=base.renderDrawer;
  function renderDrawer(kind){
    const box=$('#drawerContent');if(!box)return originalRenderDrawer(kind);
    const custom={mapExplore:['Explore',mapExploreHTML],mapArea:['Drawing space',mapAreaHTML],mapImage:['Image site finder',referenceImageHTML],planDraw:['Draw',planDrawHTML],planPlace:['Place',planPlaceHTML],planSelect:['Select',planSelectHTML],planStyle:['Style',planStyleHTML]};
    if(custom[kind]){
      $('#drawerTitle').textContent=custom[kind][0];box.innerHTML=custom[kind][1]();box.onclick=e=>{const b=e.target.closest('[data-action]');if(b)runAction(b.dataset.action,b);};bindCustomDrawer(kind);updateModeChrome();return;
    }
    if(kind==='planServices'){
      originalRenderDrawer('services');$('#drawerTitle').textContent='Services';box.insertAdjacentHTML('afterbegin','<div class="card service-commit-note"><strong>Reference layer vs plan record</strong><p class="subtle">External service mapping can be switched off after use. Services you add to the plan remain as drawing geometry.</p></div>');updateModeChrome();return;
    }
    if(kind==='planAccess'){
      originalRenderDrawer('access');$('#drawerTitle').textContent='Access points & drawing area';box.insertAdjacentHTML('beforeend',`<div class="card"><strong>Drawing area</strong><p class="subtle">${esc(projectAreaSummary())}</p></div><div class="row equal"><button data-action="defineAreaFreehand">Redraw area</button><button data-action="visibleArea">Use visible view</button></div>`);updateModeChrome();return;
    }
    if(kind==='shapeLibrary'){originalRenderDrawer('assets');$('#drawerTitle').textContent='My shapes & imports';return;}
    originalRenderDrawer(kind);updateModeChrome();
  }
  function bindCustomDrawer(kind){
    if(kind==='mapExplore')$('#mapExploreQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')runAction('mapSearch');});
    if(kind==='mapImage'&&layout.reference){
      const r=layout.reference;
      $('#referenceCountry')?.addEventListener('change',e=>r.country=e.target.value);
      $('#referenceHint')?.addEventListener('input',e=>r.hint=e.target.value);
      $('#referenceRotation')?.addEventListener('input',e=>{r.rotation=+e.target.value;$('#referenceRotationOut').textContent=r.rotation+'°';updateReferenceOverlay();});
      $('#referenceOpacity')?.addEventListener('input',e=>{r.opacity=+e.target.value/100;$('#referenceOpacityOut').textContent=Math.round(r.opacity*100)+'%';updateReferenceOverlay();});
      $('#referenceScale')?.addEventListener('input',e=>{r.scale=+e.target.value/100;$('#referenceScaleOut').textContent=Math.round(r.scale*100)+'%';updateReferenceOverlay();});
    }
  }
  const originalStartTool=base.startTool;
  function startTool(tool,options={}){
    const areaTool=['planArea','planAreaFreehand','planAreaPoints'].includes(tool);
    if(S.mode==='map'&&!areaTool){C.toast('Map mode is for exploring and defining the drawing space. Open Site Plan to draw.');return;}
    if(S.mode==='route'){C.toast('Route to Site contains route tools only. Open Site Plan to draw.');return;}
    return originalStartTool(tool,options);
  }
  const originalFinishDraw=base.finishDraw;
  function finishDraw(){const t=S.tool,wasArea=['planArea','planAreaFreehand','planAreaPoints'].includes(t);originalFinishDraw();if(wasArea&&S.project.area)queueMicrotask(()=>setMode('plan'));}
  const originalVisibleFeature=base.visibleFeature;
  function visibleFeature(f){
    if(f?.properties?.type==='service'&&f.properties.planCommitted){
      if(f.properties.hidden)return null;let geometry=f.geometry;if(S.project.area)geometry=G.clipGeometry(geometry,S.mode==='plan'?base.planBounds():C.serviceBounds());return geometry?{...f,geometry}:null;
    }
    return originalVisibleFeature(f);
  }
  const originalOnMapClick=base.onMapClick;
  function onMapClick(e){
    if(S.tool==='panelCorner'&&layout.corner){const c=C.coord(e.latlng),{product,angle}=layout.corner,p=PRODUCTS[product],span=Math.max(8,p.length*5),pr=G.projection(c),a=angle*Math.PI/180,ps=[pr.ll([0,-span]),c,pr.ll([Math.sin(a)*span,Math.cos(a)*span])];layout.corner=null;S.tool=null;C.addPanelRun(ps,{...p,product,name:p.name,lanes:1,label:p.name,styleFill:p.color,snap:true});return;}
    return originalOnMapClick(e);
  }
  async function geocode(query,country='GB'){const url='https://nominatim.openstreetmap.org/search?format=json&limit=5'+(country?'&countrycodes='+encodeURIComponent(country.toLowerCase()):'')+'&q='+encodeURIComponent(query);const res=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!res.ok)throw Error('Place search is unavailable.');const data=await res.json();if(!data.length)throw Error('Place not found.');return data;}
  async function mapSearch(){const q=$('#mapExploreQuery')?.value.trim();if(!q)throw Error('Enter a place, address or postcode.');const d=await geocode(q,'GB');const x=d[0];S.map.setView([+x.lat,+x.lon],Math.max(17,S.map.getZoom()),{animate:false});S.project.meta.siteAddress=x.display_name||q;C.saveSoon();C.toast('Site area found. Define the drawing space when ready.');}
  function useCurrentLocation(){navigator.geolocation?.getCurrentPosition(p=>{S.map.setView([p.coords.latitude,p.coords.longitude],18,{animate:false});C.toast('Map centred on your location.');},()=>C.toast('Current location is unavailable.'),{enableHighAccuracy:true,timeout:10000,maximumAge:30000});}
  function imageDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('Image could not be read.'));r.readAsDataURL(file);});}
  function getExifGps(buffer){
    try{
      const v=new DataView(buffer);if(v.getUint16(0,false)!==0xffd8)return null;let o=2;
      while(o+4<v.byteLength){if(v.getUint8(o)!==0xff){o++;continue;}const marker=v.getUint8(o+1),len=v.getUint16(o+2,false);if(marker===0xe1&&len>8){const start=o+4;if(String.fromCharCode(...new Uint8Array(buffer,start,4))==='Exif'){const t=start+6,le=v.getUint16(t,false)===0x4949,u16=(p)=>v.getUint16(p,le),u32=(p)=>v.getUint32(p,le),ifd0=t+u32(t+4),count=u16(ifd0);let gpsPtr=0;for(let i=0;i<count;i++){const p=ifd0+2+i*12;if(u16(p)===0x8825){gpsPtr=u32(p+8);break;}}if(!gpsPtr)return null;const gi=t+gpsPtr,gc=u16(gi),tags={};for(let i=0;i<gc;i++){const p=gi+2+i*12,tg=u16(p),type=u16(p+2),n=u32(p+4),valuePos=n*(type===5?8:type===2?1:4)>4?t+u32(p+8):p+8;tags[tg]={type,n,p:valuePos};}const ascii=x=>x?String.fromCharCode(v.getUint8(x.p)):'';const rationals=x=>{if(!x)return null;const a=[];for(let i=0;i<x.n;i++){const p=x.p+i*8,a0=u32(p),b0=u32(p+4);a.push(b0?a0/b0:0);}return a;};const lat=rationals(tags[2]),lon=rationals(tags[4]);if(!lat||!lon)return null;let la=lat[0]+lat[1]/60+lat[2]/3600,lo=lon[0]+lon[1]/60+lon[2]/3600;if(ascii(tags[1]).toUpperCase()==='S')la=-la;if(ascii(tags[3]).toUpperCase()==='W')lo=-lo;if(Number.isFinite(la)&&Number.isFinite(lo)&&Math.abs(la)<=90&&Math.abs(lo)<=180)return[lo,la];}}
        if(!len||len<2)break;o+=2+len;
      }
    }catch{}
    return null;
  }
  async function chooseReferenceFile(file){if(!file)return;if(!/^image\//.test(file.type))throw Error('Choose an image file.');if(file.size>20*1024*1024)throw Error('Use an image smaller than 20 MB.');const [dataUrl,buf]=await Promise.all([imageDataUrl(file),file.arrayBuffer()]);layout.reference={file,dataUrl,gps:getExifGps(buf),country:'GB',hint:'',rotation:0,opacity:.55,scale:1};openDrawer('mapImage');if(layout.reference.gps){const [lng,lat]=layout.reference.gps;S.map.setView([lat,lng],18,{animate:false});setTimeout(()=>showReferenceOverlay(),100);C.toast('Embedded image location found. Check the overlay alignment.');}}
  function showReferenceOverlay(bounds){const r=layout.reference;if(!r)return;referenceOverlay?.remove();referenceOverlay=L.imageOverlay(r.dataUrl,bounds||S.map.getBounds(),{opacity:r.opacity??.55,interactive:false,className:'sami-reference-image'}).addTo(S.map);updateReferenceOverlay();}
  function updateReferenceOverlay(){const r=layout.reference,el=referenceOverlay?.getElement?.();if(!r||!el)return;referenceOverlay.setOpacity(r.opacity??.55);el.style.rotate=(r.rotation||0)+'deg';el.style.scale=String(r.scale||1);el.style.transformOrigin='50% 50%';}
  async function matchReferenceImage(){const r=layout.reference;if(!r)throw Error('Choose a reference image first.');r.country=$('#referenceCountry')?.value??r.country;r.hint=$('#referenceHint')?.value.trim()??r.hint;
    if(r.gps){const [lng,lat]=r.gps;S.map.setView([lat,lng],18,{animate:false});setTimeout(()=>showReferenceOverlay(),80);saveImageMatch([lng,lat],'Embedded image GPS',1);return;}
    const endpoint=window.SAMI_CONFIG?.siteImageMatchEndpoint;
    if(endpoint){C.toast('Matching the reference image to map data…');const fd=new FormData();fd.append('image',r.file,r.file.name);fd.append('country',r.country||'');fd.append('hint',r.hint||'');const res=await fetch(endpoint,{method:'POST',body:fd,signal:AbortSignal.timeout(45000)}),data=await C.boundedJSON(res,750000),best=data.best||data.candidates?.[0];if(!best||!Number.isFinite(+best.lat)||!Number.isFinite(+best.lng))throw Error('The image matcher did not return a usable location.');const coord=[+best.lng,+best.lat];r.rotation=Number.isFinite(+best.rotation)?(+best.rotation+360)%360:r.rotation;S.map.setView([coord[1],coord[0]],Math.max(17,+best.zoom||18),{animate:false});setTimeout(()=>showReferenceOverlay(),100);saveImageMatch(coord,best.label||'Visual image match',+best.confidence||0);openDrawer('mapImage');return;}
    if(r.hint){const d=await geocode(r.hint,r.country),x=d[0],coord=[+x.lon,+x.lat];S.map.setView([coord[1],coord[0]],18,{animate:false});setTimeout(()=>showReferenceOverlay(),100);saveImageMatch(coord,x.display_name||r.hint,0);C.toast('Nearest place found. Align the reference overlay to confirm the exact site.');return;}
    C.toast('No location metadata was found. Add the nearest known place, or configure the visual site-matching service for automatic image-only location.');
  }
  function saveImageMatch(coord,label,confidence){S.project.meta.referenceImageMatch={coord,label,confidence,matchedAt:new Date().toISOString(),rotation:layout.reference?.rotation||0};C.saveSoon();}
  function planCommittedService(action){const k=$('#serviceType')?.value||S.project.serviceType||'electric',v=SERVICES[k];if(!v)throw Error('Choose a service type.');S.project.serviceType=k;S.project.serviceVisibility[k]=true;S.project.serviceVisibilityConfigured=true;const label=$('#serviceLabel')?.value.trim()||v.name,source=$('#serviceSource')?.value.trim()||'Project / survey record',free=action!=='manualServicePoint';base.startTool(free?'serviceFreehand':'service',{serviceType:k,area:!!v.area,label,source,verification:'Project record · verify before excavation',provenance:'Project / field record',includeLegend:true,planCommitted:true});}
  const originalRunAction=base.runAction;
  async function runAction(action,b){
    try{
      const [cmd,...parts]=action.split(':'),arg=parts.join(':');
      if(action==='mapSearch'){await mapSearch();return;}if(action==='mapLocate'){useCurrentLocation();return;}
      if(cmd==='workspaceBase'){const btn=$(`[data-base="${arg}"]`);btn?.click();return;}
      if(action==='chooseReferenceImage'){$('#referenceImageInput')?.click();return;}if(action==='matchReferenceImage'){await matchReferenceImage();return;}
      if(action==='overlayCurrentView'){showReferenceOverlay(S.map.getBounds());return;}if(action==='removeReferenceOverlay'){referenceOverlay?.remove();referenceOverlay=null;return;}
      if(cmd==='drawChoose'){layout.drawAsset=arg;const item=DRAW_ITEMS[arg];if(item&&!item.allowed.includes(layout.drawStyle))layout.drawStyle=item.allowed[0];renderDrawer('planDraw');return;}
      if(cmd==='drawStyle'){const item=DRAW_ITEMS[layout.drawAsset];if(item?.allowed.includes(arg)){layout.drawStyle=arg;renderDrawer('planDraw');}return;}
      if(action==='startPlanDraw'){await originalRunAction(`pickAsset:${layout.drawAsset}`,b);await originalRunAction(`master:${layout.drawStyle}`,b);renderDrawer('planDraw');return;}
      if(cmd==='placeOne'){await originalRunAction(`pickAsset:${arg}`,b);await originalRunAction('master:place',b);renderDrawer('planPlace');return;}
      if(cmd==='placePanel'){await originalRunAction(`pickAsset:panel_${arg}`,b);await originalRunAction('master:place',b);renderDrawer('planPlace');return;}
      if(cmd==='placeCorner'){const [product,deg]=parts;if(!PRODUCTS[product])throw Error('Unknown panel product.');layout.corner={product,angle:+deg};S.tool='panelCorner';S.points=[];S.options={};$('#drawStatus').hidden=false;$('#toolName').textContent=PRODUCTS[product].name+' · '+deg+'° corner';$('#drawHint').textContent='Tap the corner position. SAMI will place the grouped junction using the panel engine.';$('#finishDrawBtn').hidden=true;$('#backPointBtn').hidden=true;return;}
      if(action==='selectMode'){S.selected=null;C.cancelDraw();base.closeDrawer?.();C.render();C.toast('Tap an item on the plan to select it.');return;}
      if(action==='togglePlanLock'){$('#lockBtn')?.click();renderDrawer('planStyle');return;}
      if(action==='showDrawingTemplate'){$('[data-base="drawing"]')?.click();C.fitArea();return;}
      if(['manualServicePoint','manualServiceFreehand','drawService'].includes(action)){planCommittedService(action);return;}
      if(cmd==='quickService'){const k=arg,v=SERVICES[k];if(!S.project.area){openDrawer('planAccess');return;}S.project.serviceType=k;S.project.serviceVisibility[k]=true;S.project.serviceVisibilityConfigured=true;base.startTool('serviceFreehand',{serviceType:k,area:!!v.area,label:v.name,source:'Project / planning record',verification:'Project record · verify before excavation',provenance:'Project / field record',includeLegend:true,planCommitted:true});return;}
      if(action==='visibleArea'){await originalRunAction(action,b);if(S.project.area)queueMicrotask(()=>setMode('plan'));return;}
      if(action==='planMode'){setMode('plan');return;}
      if(action==='clearArea'){await originalRunAction(action,b);if(!S.project.area)setMode('map');return;}
      if(action==='commitServiceToPlan'){const f=C.selectedFeature();if(!f||f.properties.type!=='service')return;const d=C.copy(f);d.id=C.uid();d.properties={...d.properties,planCommitted:true,referenceSourceId:d.properties.sourceId||'',sourceId:'',committedAt:new Date().toISOString(),label:d.properties.label||SERVICES[d.properties.serviceType]?.name||'Service'};S.project.features.push(d);S.selected=d.id;C.commit();openDrawer('selection');C.toast('Service kept on the plan. Reference mapping can now be hidden independently.');return;}
      return await originalRunAction(action,b);
    }catch(e){C.toast(e.message||'That action could not be completed.');}
  }
  const originalSelectionHTML=base.selectionHTML;
  function selectionHTML(){const f=C.selectedFeature();let h=originalSelectionHTML();if(f?.properties?.type==='service'&&!f.properties.planCommitted)h='<div class="card service-commit-note"><strong>Reference service</strong><p class="subtle">Keep a copy on the plan before switching the reference mapping off.</p><button data-action="commitServiceToPlan" class="primary">Keep this service on plan</button></div>'+h;return h;}
  const originalHandleCommand=base.handleCommand;
  async function handleCommand(q){const text=String(q||'');const drawingIntent=/\b(create|add|draw|place|build|make)\b/i.test(text)&&!/\b(route to site|hgv route|journey)\b/i.test(text);const areaIntent=/\b(site area|drawing space|site boundary|plan area)\b/i.test(text);if((S.mode==='map'||S.mode==='route')&&drawingIntent&&!areaIntent){if(!S.project.area){openDrawer('mapArea');C.samiSay('Define the drawing space first. I will open Site Plan when it is confirmed.');return;}setMode('plan');}return originalHandleCommand(q);}
  const originalMount=base.mount;
  function mount(){
    originalMount();
    ensureAssistantChrome();ensureSidebarTab();updateModeChrome();
    let input=$('#referenceImageInput');if(!input){input=document.createElement('input');input.id='referenceImageInput';input.type='file';input.accept='image/*';input.hidden=true;document.body.append(input);}input.onchange=async()=>{try{await chooseReferenceFile(input.files?.[0]);}catch(e){C.toast(e.message);}finally{input.value='';}};
    const fold=$('#dockFold');if(fold){fold.title='Collapse tools';fold.setAttribute('aria-label','Collapse tools');}
    const reopen=$('#dockReopen');if(reopen)reopen.setAttribute('aria-label','Show planning tools');
    toggleSamiChat(false);
    openDrawer(S.mode==='map'?'mapExplore':S.mode==='plan'?'planDraw':S.mode==='route'?'routeToSite':'create');
  }
  return {...base,setMode,setModeUI,openDrawer,renderDrawer,startTool,finishDraw,visibleFeature,onMapClick,runAction,selectionHTML,handleCommand,mount};
};
})();
