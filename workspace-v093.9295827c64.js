(() => {
'use strict';
const PreviousFactory = window.SAMIStudio;
if (typeof PreviousFactory !== 'function') return;
window.SAMIStudio = function(C,O){
  const base = PreviousFactory(C,O);
  const S=C.state,G=C.G,PRODUCTS=C.PRODUCTS,ASSETS=C.ASSETS,SERVICES=C.SERVICES,TYPES=C.TYPES;
  const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)], esc=C.esc;
  const ui={drawMode:'freeArea',drawAsset:'panel_lion',showAll:false,serviceMode:'show',draftPoint:-1};
  const SURFACES={
    surface_access:{name:'Access route',category:'Routes & areas',kind:'line',allowed:['line','freeLine'],icon:'↳'},
    surface_egress:{name:'Egress route',category:'Routes & areas',kind:'line',allowed:['line','freeLine'],icon:'↱'},
    surface_route:{name:'On-site route',category:'Routes & areas',kind:'line',allowed:['line','freeLine'],icon:'⌁'},
    surface_stoneRoad:{name:'Stone road',category:'Routes & areas',kind:'line',allowed:['line','freeLine'],icon:'━'},
    surface_stoneArea:{name:'Stone hardstanding',category:'Routes & areas',kind:'area',allowed:['area','freeArea'],icon:'▧'},
    surface_area:{name:'Compound / area',category:'Routes & areas',kind:'area',allowed:['area','freeArea'],icon:'⬡'},
    surface_hazard:{name:'Concern / exclusion area',category:'Routes & areas',kind:'area',allowed:['area','freeArea'],icon:'⚠'},
    surface_excavation:{name:'Excavation',category:'Routes & areas',kind:'area',allowed:['area','freeArea'],icon:'▱'},
  };
  const SHAPES={
    shape_rectangle:{name:'Rectangle',category:'Shapes & annotation',action:'draw:rectangle',allowed:['area'],icon:'▭'},
    shape_circle:{name:'Circle / radius',category:'Shapes & annotation',action:'draw:circle',allowed:['area'],icon:'○'},
    shape_arrow:{name:'Direction arrow',category:'Shapes & annotation',action:'draw:arrow',allowed:['line'],icon:'➜'},
    shape_measure:{name:'Dimension',category:'Shapes & annotation',action:'draw:measure',allowed:['line'],icon:'↔'},
    shape_text:{name:'Text',category:'Shapes & annotation',action:'draw:textBox',allowed:['place'],icon:'T'},
    shape_photo:{name:'Photo',category:'Shapes & annotation',action:'draw:photo',allowed:['place'],icon:'▣'}
  };
  const MODE_NAMES={freeArea:'Freehand area',area:'Point area',freeLine:'Freehand line',line:'Point line'};
  const railButtons={
    map:[['mapExplore','⌕','Explore'],['mapImage','▧','Image locate'],['mapArea','⌗','Drawing space']],
    plan:[['planDraw','✎','Draw'],['planPlace','▣','Place'],['planServices','≋','Services'],['planSelect','↖','Select'],['planStyle','◐','Style'],['planAccess','◎','Access'],['planArea','⌗','Area']],
    route:[['routeToSite','⇢','Route tools']],
    create:[['create','◇','Shape builder'],['shapeLibrary','▣','My shapes']]
  };
  function currentMode(){return S.mode==='create'?'create':S.mode;}
  function itemFor(k){
    if(k?.startsWith('panel_')){const p=PRODUCTS[k.slice(6)];return p&&{name:p.name,category:'Trakway',kind:'trakway',allowed:['line','freeLine','area','freeArea'],icon:'▤'};}
    return SURFACES[k]||SHAPES[k]||null;
  }
  function preferredMode(item){if(!item)return 'freeArea';if(item.allowed.includes('freeArea'))return 'freeArea';if(item.allowed.includes('freeLine'))return 'freeLine';return item.allowed[0];}
  function railButton(drawer,icon,label){return `<button class="rail-tool" data-v093-drawer="${drawer}"><span>${icon}</span><small>${label}</small></button>`;}
  function renderCompactRail(){
    const rail=$('#toolRail');if(!rail)return;const rows=railButtons[currentMode()]||[];
    rail.dataset.railCount=String(rows.length);
    rail.innerHTML=rows.map(x=>railButton(...x)).join('');
    rail.querySelectorAll('[data-v093-drawer]').forEach(b=>b.onclick=()=>{const k=b.dataset.v093Drawer;openDrawer(k);if(k==='planDraw')activateCurrentDraw(true);});
    rail.querySelectorAll('[data-v093-drawer]').forEach(b=>b.classList.toggle('active',b.dataset.v093Drawer===S.drawer));
  }
  function compactDetails(title,body,count=''){return `<details class="compact-section"><summary><span>${esc(title)}</span>${count?`<small>${esc(String(count))}</small>`:''}</summary><div class="compact-section-body">${body}</div></details>`;}
  function assetRow(action,icon,name,meta='',active=false,disabled=false){return `<button class="compact-asset-row ${active?'active':''}" data-action="${action}" ${disabled?'disabled':''}><span class="asset-row-icon">${icon}</span><span><strong>${esc(name)}</strong>${meta?`<small>${esc(meta)}</small>`:''}</span></button>`;}
  function drawModeBar(){return `<div class="draw-mode-bar">${Object.entries(MODE_NAMES).map(([k,n])=>`<button data-action="v093DrawMode:${k}" class="${!ui.showAll&&ui.drawMode===k?'active':''}">${esc(n)}</button>`).join('')}<button data-action="v093ShowAll" class="show-all ${ui.showAll?'active':''}">All assets</button></div>`;}
  function drawItemsForCategory(cat){
    const entries=[];
    for(const k of Object.keys(PRODUCTS))entries.push(['panel_'+k,itemFor('panel_'+k)]);
    for(const [k,v] of Object.entries(SURFACES))entries.push([k,v]);
    for(const [k,v] of Object.entries(SHAPES))entries.push([k,v]);
    return entries.filter(([,v])=>v&&v.category===cat).filter(([,v])=>ui.showAll||v.allowed.includes(ui.drawMode));
  }
  function drawCategory(cat){const items=drawItemsForCategory(cat);if(!items.length&&!ui.showAll)return'';return compactDetails(cat,`<div class="compact-asset-list">${items.map(([k,v])=>assetRow(`v093DrawAsset:${k}`,v.icon,v.name,v.kind==='trakway'?`${PRODUCTS[k.slice(6)]?.length||''} m progression`:v.kind==='area'?'Area':'Line',ui.drawAsset===k)).join('')}</div>`,items.length);}
  function placeOnlyCategories(){const groups={};for(const [k,v] of Object.entries(ASSETS)){const cat=v.category==='Welfare'?'Welfare & accommodation':v.category==='Plant'?'Plant & site vehicles':v.category==='Vehicles'?'Vehicles':v.category||'Other';(groups[cat]??=[]).push([k,v]);}return groups;}
  function planDrawHTML(){
    const selected=itemFor(ui.drawAsset);if(selected&&!selected.allowed.includes(ui.drawMode)&&!ui.showAll)ui.drawMode=preferredMode(selected);
    let allExtra='';if(ui.showAll){const groups=placeOnlyCategories();allExtra=Object.entries(groups).map(([cat,items])=>compactDetails(cat,`<div class="compact-asset-list">${items.map(([k,v])=>assetRow(`v093PlaceFromDraw:${k}`,C.assetIconSVG?C.assetIconSVG(k,v):'▣',v.name,`${v.length||'?'} × ${v.width||'?'} m`)).join('')}</div>`,items.length)).join('');}
    return `${drawModeBar()}<div class="active-draw-strip"><span>Active</span><strong>${esc(selected?.name||'Choose an asset')}</strong><small>${ui.showAll?'Choose any item below':esc(MODE_NAMES[ui.drawMode])}</small></div>
      ${drawCategory('Trakway')}${drawCategory('Routes & areas')}${drawCategory('Shapes & annotation')}${allExtra}`;
  }
  function planPlaceHTML(){
    const groups=placeOnlyCategories();
    const panels=Object.entries(PRODUCTS).map(([k,p])=>assetRow(`v093PlacePanel:${k}`,'▤',p.name,`${p.length} × ${p.width} m`)).join('');
    const corners=['lion','hybrid','tuff'].filter(k=>PRODUCTS[k]).map(k=>`<div class="compact-corner-row"><strong>${esc(PRODUCTS[k].name)}</strong><div><button data-action="placeCorner:${k}:30">30°</button><button data-action="placeCorner:${k}:45">45°</button><button data-action="placeCorner:${k}:60">60°</button></div></div>`).join('');
    return `${compactDetails('Single Trakway panels',`<div class="compact-asset-list">${panels}</div>`,Object.keys(PRODUCTS).length)}${compactDetails('Pre-made Trakway corners',corners,'3')}${Object.entries(groups).map(([cat,items])=>compactDetails(cat,`<div class="compact-asset-list">${items.map(([k,v])=>assetRow(`v093Place:${k}`,C.assetIconSVG?C.assetIconSVG(k,v):'▣',v.name,`${v.length||'?'} × ${v.width||'?'} m`)).join('')}</div>`,items.length)).join('')}`;
  }
  function serviceCounts(){const counts={};for(const f of S.project.features)if(f.properties?.type==='service')counts[f.properties.serviceType]=(counts[f.properties.serviceType]||0)+1;return counts;}
  function serviceRows(mode){
    const counts=serviceCounts(),keys=Object.keys(SERVICES).sort((a,b)=>a==='ohl'?-1:b==='ohl'?1:(counts[b]||0)-(counts[a]||0)||SERVICES[a].name.localeCompare(SERVICES[b].name));
    const available=keys.filter(k=>k==='ohl'||counts[k]>0),unavailable=keys.filter(k=>!available.includes(k));
    const row=(k)=>{const v=SERVICES[k],n=counts[k]||0;if(mode==='show')return `<label class="service-check"><input type="checkbox" data-v093-service-toggle="${k}" ${S.project.serviceVisibility[k]?'checked':''}><i style="--service-col:${v.color}"></i><span>${esc(v.name)}<small>${n?`${n} mapped / added`:(k==='ohl'?'Reference source available':'No returned records yet')}</small></span></label>`;return `<button class="service-add-row" data-action="v093AddService:${k}"><i style="--service-col:${v.color}"></i><span><strong>${esc(v.name)}</strong><small>${v.area?'Draw area':'Draw line'}${k==='ohl'?' · support + markers included':''}</small></span><b>＋</b></button>`;};
    return `<div class="service-list-head">${mode==='show'?'Available / on this project':'Add to plan'}</div>${available.map(row).join('')}${mode==='show'&&unavailable.length?compactDetails('Unavailable / no returned data yet',`<div class="service-check-list">${unavailable.map(row).join('')}</div>`,unavailable.length):mode==='add'?unavailable.map(row).join(''):''}`;
  }
  function planServicesHTML(){if(!S.project.area)return `<div class="empty-compact"><strong>Define the drawing area first.</strong><button data-action="open:planArea">Area</button></div>`;return `<div class="two-way-toggle"><button data-action="v093ServiceMode:show" class="${ui.serviceMode==='show'?'active':''}">Show</button><button data-action="v093ServiceMode:add" class="${ui.serviceMode==='add'?'active':''}">Add</button></div>${serviceRows(ui.serviceMode)}${ui.serviceMode==='show'?'<div class="compact-action-row"><button data-action="showServiceMapping" class="primary">Refresh / show checked</button><button data-action="resetServiceMapping">Reset</button></div>':''}`;}
  function planSelectHTML(){const fs=S.project.features.filter(f=>!f.properties?.guideHidden);return `<div class="compact-action-row"><button data-action="selectMode" class="primary">Tap item on plan</button></div>${compactDetails('Plan items',`<div class="plan-object-list">${fs.slice().reverse().slice(0,180).map(f=>`<button data-action="select:${f.id}"><span>${esc(f.properties.label||f.properties.name||f.properties.type||'Item')}</span><small>${esc(f.properties.type||'')}</small></button>`).join('')}</div>`,fs.length)}`;}
  function planStyleHTML(){return `<div class="style-choice-grid compact"><button data-action="workspaceBase:street" class="${S.base==='street'?'active':''}">Map</button><button data-action="workspaceBase:satellite" class="${S.base==='satellite'?'active':''}">Satellite</button><button data-action="workspaceBase:drawing" class="${S.base==='drawing'?'active':''}">CAD</button></div><div class="compact-action-row"><button data-action="capturePlanBase">${S.project.planBaseMeta?.capturedAt?'Refresh CAD detail':'Create CAD detail'}</button><button data-action="showDrawingTemplate">Drawing sheet</button></div><div class="compact-action-row"><button data-action="togglePlanLock">${S.planLocked?'Unlock map':'Lock map'}</button><button data-action="fitArea">Fit plan</button></div>`;}
  function planAccessHTML(){const pts=S.project.features.filter(f=>f.properties?.type==='accessPoint');return `<div class="compact-action-row"><button data-action="accessPoint" class="primary">＋ Access point</button></div>${pts.length?compactDetails('Defined access points',`<div class="plan-object-list">${pts.map(f=>`<button data-action="select:${f.id}"><span>${esc(f.properties.label||'Access point')}</span><small>${esc(f.properties.address||'')}</small></button>`).join('')}</div>`,pts.length):'<p class="compact-muted">No access points added yet.</p>'}`;}
  function areaSummary(){const b=S.project.area;if(!b)return'No drawing area';const a=G.area(b);return a>=10000?(a/10000).toFixed(2)+' ha':Math.round(a).toLocaleString()+' m²';}
  function planAreaHTML(){return `<div class="area-summary"><strong>${esc(areaSummary())}</strong><span>${S.project.areaAspectLocked!==false?'Landscape paper ratio':'Free ratio'}</span></div><div class="area-method-grid compact"><button data-action="defineAreaFreehand">Freehand</button><button data-action="defineAreaPoints">Points</button><button data-action="defineArea">2 corners</button><button data-action="v093VisibleArea">Use visible space</button></div>${S.project.area?'<div class="compact-action-row"><button data-action="fitArea">Fit area</button><button data-action="clearArea">Clear</button></div>':''}`;}
  function mapExploreHTML(){return `<label class="compact-search"><input id="mapExploreQuery" placeholder="Place, road, postcode or site"><button data-action="mapSearch">Find</button></label><div class="compact-action-row"><button data-action="mapLocate">◎ My location</button><button data-action="open:mapImage">▧ Find from image</button></div>${S.project.area?`<button class="wide-compact primary" data-action="open:mapArea">Drawing space · ${esc(areaSummary())}</button>`:'<button class="wide-compact primary" data-action="open:mapArea">Define drawing space</button>'}`;}
  function mapAreaHTML(){return planAreaHTML();}
  function mapImageHTML(){return null;}
  function replacementOptions(f){const m=f.properties||{};if(m.type==='panel')return Object.entries(PRODUCTS).map(([k,v])=>`<option value="panel:${k}" ${m.product===k?'selected':''}>${esc(v.name)}</option>`).join('');if(m.type==='asset')return Object.entries(ASSETS).map(([k,v])=>`<option value="asset:${k}" ${m.kind===k?'selected':''}>${esc(v.name)}</option>`).join('');if(['access','egress','route','stoneRoad','area','hazard','excavation'].includes(m.type)){return Object.entries(SURFACES).map(([k,v])=>`<option value="surface:${k.slice(8)}" ${m.type===k.slice(8)?'selected':''}>${esc(v.name)}</option>`).join('');}return'';}
  function selectionHTML(){
    const f=C.selectedFeature();if(!f)return'<p class="compact-muted">Tap an item on the drawing.</p>';const m=f.properties||{},members=C.groupMembers(f),grouped=members.length>1,st=C.featureStyle({...f,id:'__preview__',properties:{...m,groupId:null}}),canPoints=!m.derived&&!m.sourceId&&!['asset','panel','logo'].includes(m.type)&&['Point','LineString','Polygon'].includes(f.geometry?.type),replace=replacementOptions(f);
    return `<div class="selected-summary"><span>${esc(TYPES[m.type]||m.type||'Item')}${grouped?' · GROUP':''}</span><strong>${esc(m.label||m.name||TYPES[m.type]||'Selected item')}</strong></div>${replace?`<div class="replace-row"><select id="v093Replace">${replace}</select><button data-action="v093ReplaceSelected">Replace</button></div>`:''}<div class="style-editor-compact"><div class="style-mini-grid"><label>Line<input id="editStyleColor" type="color" value="${esc(m.styleColor||st.color||'#174d43')}"></label><label>Width<input id="editStyleWeight" type="number" min="0.5" max="12" step="0.5" value="${esc(m.styleWeight||st.weight||2)}"></label><label>Edge<select id="editStyleDash"><option value="solid" ${(m.styleDash||'solid')==='solid'?'selected':''}>Solid</option><option value="dashed" ${m.styleDash==='dashed'?'selected':''}>Dash</option><option value="dotted" ${m.styleDash==='dotted'?'selected':''}>Dots</option></select></label><label>Fill<input id="editStyleFill" type="color" value="${esc(m.styleFill||st.fillColor||'#72bc9c')}"></label><label>Opacity<input id="editStyleFillOpacity" type="range" min="0" max="100" value="${Math.round((Number.isFinite(+m.styleFillOpacity)?+m.styleFillOpacity:(st.fillOpacity??.15))*100)}"></label><label>Pattern<select id="editStylePattern"><option value="solid" ${(m.stylePattern||(m.type==='stoneRoad'?'hatch':'solid'))==='solid'?'selected':''}>Solid</option><option value="hatch" ${(m.stylePattern||(m.type==='stoneRoad'?'hatch':'solid'))==='hatch'?'selected':''}>Hatch</option><option value="dots" ${m.stylePattern==='dots'?'selected':''}>Dots</option><option value="none" ${m.stylePattern==='none'?'selected':''}>None</option></select></label></div><button data-action="v093ApplyStyle" class="primary wide-compact">Apply style</button></div><div class="selection-quick-v093"><button data-action="editMove">Move</button>${canPoints?'<button data-action="editVertices">Points</button>':''}<button data-action="editDuplicate">Duplicate</button><button data-action="v093GroupToggle">${grouped?'Ungroup':'Group'}</button><button data-action="toggleSelectedLock">${m.locked?'Unlock':'Lock'}</button><button data-action="editDelete" class="danger-lite">Delete</button></div><details class="compact-section"><summary><span>Details</span></summary><div class="compact-section-body"><label class="field-label">Label<input class="field" id="editLabel" value="${esc(m.label||m.name||'')}"></label><label class="check-row"><input type="checkbox" id="editLegend" ${m.includeLegend!==false?'checked':''}> Include in legend</label><button data-action="editLabel">Save label</button>${m.source?`<p class="compact-muted">Source: ${esc(m.source)}</p>`:''}</div></details>`;
  }
  function openDrawer(kind){if(kind==='planAccessArea')kind='planAccess';if(kind==='area'&&S.mode==='plan')kind='planArea';base.openDrawer(kind);queueMicrotask(renderCompactRail);}
  function renderDrawer(kind){
    const box=$('#drawerContent');if(!box)return base.renderDrawer(kind);
    const custom={planDraw:['Draw',planDrawHTML],planPlace:['Place',planPlaceHTML],planServices:['Services',planServicesHTML],planSelect:['Select',planSelectHTML],planStyle:['Style',planStyleHTML],planAccess:['Access',planAccessHTML],planArea:['Area',planAreaHTML],mapExplore:['Explore',mapExploreHTML],mapArea:['Drawing space',mapAreaHTML]};
    if(custom[kind]){S.drawer=kind;$('#drawerTitle').textContent=custom[kind][0];box.innerHTML=custom[kind][1]();box.onclick=e=>{const b=e.target.closest('[data-action]');if(b)runAction(b.dataset.action,b);};bindCompactDrawer(kind);queueMicrotask(renderCompactRail);return;}
    if(kind==='selection'){S.drawer=kind;$('#drawerTitle').textContent='Selected item';box.innerHTML=selectionHTML();box.onclick=e=>{const b=e.target.closest('[data-action]');if(b)runAction(b.dataset.action,b);};queueMicrotask(renderCompactRail);return;}
    base.renderDrawer(kind);queueMicrotask(renderCompactRail);
  }
  function bindCompactDrawer(kind){if(kind==='mapExplore')$('#mapExploreQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter')runAction('mapSearch');});if(kind==='planServices')$$('[data-v093-service-toggle]').forEach(el=>el.onchange=()=>{S.project.serviceVisibilityConfigured=true;S.project.serviceVisibility[el.dataset.v093ServiceToggle]=el.checked;C.commit();renderDrawer('planServices');});}
  async function activateCurrentDraw(reopen=true){
    const item=itemFor(ui.drawAsset);if(!item)return;if(!item.allowed.includes(ui.drawMode))ui.drawMode=preferredMode(item);ui.showAll=false;
    if(item.action){await base.runAction(item.action);}
    else {await base.runAction(`pickAsset:${ui.drawAsset}`);await base.runAction(`master:${ui.drawMode}`);}
    if(reopen)setTimeout(()=>openDrawer('planDraw'),0);
  }
  function visiblePaperArea(){const b=S.map.getBounds(),sw=C.coord(b.getSouthWest()),ne=C.coord(b.getNorthEast()),raw=[sw[0],sw[1],ne[0],ne[1]],ratio=+S.project.areaPaperRatio||420/297,c=[(raw[0]+raw[2])/2,(raw[1]+raw[3])/2],pr=G.projection(c),a=pr.xy([raw[0],raw[1]]),z=pr.xy([raw[2],raw[3]]);let w=Math.abs(z[0]-a[0]),h=Math.abs(z[1]-a[1]);if(S.project.areaAspectLocked!==false){if(w/h<ratio)w=h*ratio;else h=w/ratio;}const p1=pr.ll([-w/2,-h/2]),p2=pr.ll([w/2,h/2]);S.project.area=[Math.min(p1[0],p2[0]),Math.min(p1[1],p2[1]),Math.max(p1[0],p2[0]),Math.max(p1[1],p2[1])];S.project.planBaseMeta={...(S.project.planBaseMeta||{}),stale:true,reason:'Drawing area changed'};C.cancelDraw();C.commit();C.toast('Drawing space set from the complete visible map view.');if(S.mode==='map')base.setMode('plan');else openDrawer('planArea');}
  function centerOf(f){const b=G.boundsOf(f.geometry);return[(b[0]+b[2])/2,(b[1]+b[3])/2];}
  function transformCoords(g,fn){if(!g)return;const walk=x=>Array.isArray(x)&&typeof x[0]==='number'?fn(x):x.map(walk);g.coordinates=walk(g.coordinates);}
  function scaleMembers(members,center,factor){const pr=G.projection(center);for(const f of members){transformCoords(f.geometry,c=>{const q=pr.xy(c);return pr.ll([q[0]*factor,q[1]*factor]);});if(Number.isFinite(+f.properties.length))f.properties.length=+(+f.properties.length*factor).toFixed(3);if(Number.isFinite(+f.properties.width))f.properties.width=+(+f.properties.width*factor).toFixed(3);}}
  function handleIcon(kind,txt){return L.divIcon({className:'',html:`<div class="transform-control v093 ${kind}">${txt}</div>`,iconSize:[32,32],iconAnchor:[16,16]});}
  function renderTransformHandles(){
    const f=C.selectedFeature();if(!f||S.vertexEditId||f.properties?.locked)return;const members=C.groupMembers(f),b=C.groupBounds(members);if(!b)return;const center=[(b[0]+b[2])/2,(b[1]+b[3])/2],pr=G.projection(center),xy=[pr.xy([b[0],b[1]]),pr.xy([b[2],b[3]])],rx=Math.max(2,Math.abs(xy[1][0]-xy[0][0])/2),ry=Math.max(2,Math.abs(xy[1][1]-xy[0][1])/2),radius=Math.max(rx,ry)+3;
    const move=L.marker(C.latlng(center),{draggable:true,zIndexOffset:1100,icon:handleIcon('move','✥')}).addTo(S.editGroup);move.bindTooltip('Move',{direction:'top'});move.on('dragend',()=>{const n=C.coord(move.getLatLng()),d=[n[0]-center[0],n[1]-center[1]];C.translateMembers(members,d);C.commit();});
    if(f.geometry?.type!=='Point'){
      const rotPos=pr.ll([0,radius]),rot=L.marker(C.latlng(rotPos),{draggable:true,zIndexOffset:1100,icon:handleIcon('rotate','↻')}).addTo(S.editGroup);rot.bindTooltip('Rotate',{direction:'top'});rot.on('dragend',()=>{const q=pr.xy(C.coord(rot.getLatLng())),deg=Math.atan2(q[0],q[1])*180/Math.PI;C.rotateMembers(members,center,deg);C.commit();});
      const locked=members.some(x=>x.properties?.dimensionLocked);if(!locked){const resizePos=pr.ll([radius*.72,radius*.72]),resize=L.marker(C.latlng(resizePos),{draggable:true,zIndexOffset:1100,icon:handleIcon('resize','↘')}).addTo(S.editGroup);resize.bindTooltip('Resize',{direction:'top'});resize.on('dragend',()=>{const q=pr.xy(C.coord(resize.getLatLng())),r=Math.hypot(q[0],q[1]),initial=Math.hypot(radius*.72,radius*.72),factor=Math.max(.1,Math.min(10,r/initial));scaleMembers(members,center,factor);C.commit();});}
    }
  }
  function draftIcon(i){return L.divIcon({className:'',html:`<div class="draft-edit-point ${ui.draftPoint===i?'active':''}"></div>`,iconSize:[18,18],iconAnchor:[9,9]});}
  function renderDraft(){
    if(S.tool&&!S.vertexEditId)S.editGroup?.clearLayers();base.renderDraft();if(!S.tool||S.freehandActive)return;
    const pts=S.points||[];if(pts.length&&pts.length<=180){pts.forEach((p,i)=>{const m=L.marker(C.latlng(p),{draggable:true,zIndexOffset:1000,icon:draftIcon(i)}).addTo(S.editGroup);m.on('click',e=>{L.DomEvent.stopPropagation(e.originalEvent);ui.draftPoint=i;renderDraft();});m.on('dragstart',()=>{ui.draftPoint=i;});m.on('dragend',()=>{S.points[i]=C.coord(m.getLatLng());ui.draftPoint=i;renderDraft();});});}
    const single=['asset','singlePanel','note','photo','hazard-marker','textBox'].includes(S.tool),auto=['planArea','rectangle'].includes(S.tool);if(!single&&!auto){$('#finishDrawBtn').hidden=false;$('#backPointBtn').hidden=false;$('#backPointBtn').textContent='↶ Undo point';$('#backPointBtn').disabled=!pts.length;$('#finishDrawBtn').disabled=pts.length<((S.options?.area||/Area|area|hazard|excavation|stoneArea/.test(S.tool))?3:2);$('#finishDrawBtn').textContent='Finish';if(C.isFreehandTool(S.tool))$('#drawHint').textContent=pts.length?'Adjust any highlighted point, continue drawing, or press Finish.':'Draw on the map. Lift your finger, adjust points if needed, then press Finish.';}
  }
  function initFreehandInput(){
    const el=$('#map');let pointer=null,lastPx=null,startedNew=false;
    el.addEventListener('pointerdown',e=>{if(!C.isFreehandTool(S.tool)||pointer!==null||e.button>0||e.target.closest?.('.leaflet-marker-icon'))return;const c=C.screenToCoord(e);if(!C.freehandPointAllowed(c)){C.toast('Start inside the active drawing area.');return;}pointer=e.pointerId;S.freehandActive=true;startedNew=!S.points.length;if(startedNew)S.points=[c];else if(G.distance(S.points.at(-1),c)>.03)S.points.push(c);lastPx={x:e.clientX,y:e.clientY};S.map.dragging.disable();el.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();renderDraft();},{capture:true});
    el.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||!S.freehandActive)return;const d=Math.hypot(e.clientX-lastPx.x,e.clientY-lastPx.y);if(d<6)return;const c=C.screenToCoord(e);if(!C.freehandPointAllowed(c))return;const prev=S.points.at(-1);if(!prev||G.distance(prev,c)>.2){S.points.push(c);lastPx={x:e.clientX,y:e.clientY};base.renderDraft();}e.preventDefault();e.stopPropagation();},{capture:true});
    const end=e=>{if(pointer!==e.pointerId)return;el.releasePointerCapture?.(e.pointerId);pointer=null;S.freehandActive=false;S.map.dragging[C.isLocked()?'disable':'enable']();const min=(S.options?.area||/Area|area|hazard|excavation|stoneArea/.test(S.tool))?3:2;if(S.points.length>=min){const out=[];for(const p of S.points)if(!out.length||G.distance(out.at(-1),p)>=.35)out.push(p);if(out.length>=min)S.points=out;ui.draftPoint=S.points.length-1;renderDraft();C.toast('Sketch retained. Adjust points or press Finish.');}else{C.toast('Draw a little further, then press Finish.');renderDraft();}e.preventDefault();e.stopPropagation();};
    el.addEventListener('pointerup',end,{capture:true});el.addEventListener('pointercancel',e=>{if(pointer===e.pointerId){pointer=null;S.freehandActive=false;S.map.dragging[C.isLocked()?'disable':'enable']();renderDraft();}},{capture:true});
  }
  function genericPattern(f,shown){
    const pat=f.properties?.stylePattern;
    if(!['hatch','dots'].includes(pat)||shown.geometry?.type!=='Polygon'||(f.properties?.type==='stoneRoad'&&pat==='hatch'))return;
    const ring=shown.geometry.coordinates?.[0];
    if(!ring||ring.length<4)return;
    const b=G.boundsOf(shown.geometry),c=[(b[0]+b[2])/2,(b[1]+b[3])/2],pr=G.projection(c),rxy=ring.slice(0,-1).map(pr.xy);
    const xs=rxy.map(p=>p[0]),ys=rxy.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const w=Math.max(.5,maxX-minX),h=Math.max(.5,maxY-minY),target=360;
    let spacing=Math.max(.5,Math.sqrt((w*h)/target));
    const estimated=Math.ceil(w/spacing)*Math.ceil(h/spacing);
    if(estimated>900)spacing*=Math.sqrt(estimated/900);
    const color=f.properties.styleColor||f.properties.styleFill||'#53796b',len=spacing*.28;
    /* Cover the complete polygon uniformly. The previous row-major hard stop made
       large fills appear to end halfway across the selected area. */
    for(let y=minY;y<=maxY;y+=spacing){
      for(let x=minX;x<=maxX;x+=spacing){
        if(!C.pointInRingXY([x,y],rxy))continue;
        if(pat==='dots')L.circleMarker(C.latlng(pr.ll([x,y])),{interactive:false,radius:1.25,color,fillColor:color,fillOpacity:.68,weight:0}).addTo(S.group);
        else L.polyline([C.latlng(pr.ll([x-len,y-len])),C.latlng(pr.ll([x+len,y+len]))],{interactive:false,color,weight:.8,opacity:.5}).addTo(S.group);
      }
    }
  }
  function render(){base.render();for(const f of S.project.features){let shown;try{shown=C.visibleFeature(f);}catch{continue;}if(shown)genericPattern(f,shown);}syncSelectionBar();queueMicrotask(renderCompactRail);}
  function syncSelectionBar(){const bar=$('#selectionBar'),f=C.selectedFeature();if(!bar||!f)return;const grouped=C.groupMembers(f).length>1,resize=bar.querySelector('[data-action="v093ResizeHint"]'),points=bar.querySelector('[data-action="editVertices"]');if(resize)resize.disabled=f.properties?.dimensionLocked||f.geometry?.type==='Point';if(points)points.disabled=!!f.properties?.derived||!!f.properties?.sourceId||['asset','panel','logo'].includes(f.properties?.type);const gb=bar.querySelector('[data-action="v093GroupToggle"]');if(gb){gb.textContent=grouped?'▢':'▣';gb.title=grouped?'Ungroup':'Group';}}
  function enhanceSelectionBar(){const bar=$('#selectionBar');if(!bar)return;bar.innerHTML='<span><strong id="selectionName"></strong><small id="selectionCount"></small></span><button data-action="open:selection" title="Style / replace">◐</button><button data-action="editMove" title="Move">✥</button><button data-action="v093RotateHint" title="Rotate">↻</button><button data-action="v093ResizeHint" title="Resize">↘</button><button data-action="editVertices" title="Edit points">⌁</button><button data-action="v093GroupToggle" title="Group / ungroup">▣</button><button data-action="editDelete" title="Delete">×</button>';}
  function addMapStyleControl(){if($('#mapStyleToggle'))return;const wrap=document.createElement('div');wrap.className='map-style-quick';wrap.innerHTML='<div id="mapStyleOptions" class="map-style-options" hidden><button data-base-quick="street">Map</button><button data-base-quick="satellite">Satellite</button><button data-base-quick="drawing">CAD</button><button id="mapStyleClose" aria-label="Collapse map style">‹</button></div><button id="mapStyleToggle" title="Map style" aria-label="Map style">◐</button>';$('.map-controls')?.prepend(wrap);$('#mapStyleToggle').onclick=()=>{$('#mapStyleOptions').hidden=!$('#mapStyleOptions').hidden;};$('#mapStyleClose').onclick=()=>$('#mapStyleOptions').hidden=true;$$('[data-base-quick]').forEach(b=>b.onclick=()=>{$(`[data-base="${b.dataset.baseQuick}"]`)?.click();$('#mapStyleOptions').hidden=true;});}
  function bindSelectionExtras(){const bar=$('#selectionBar');if(!bar)return;bar.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='v093RotateHint'){C.toast('Drag the ↻ handle above the selected item.');}if(a==='v093ResizeHint'){C.toast('Drag the ↘ handle to resize the selected item.');}});}
  function replaceSelected(){const f=C.selectedFeature(),value=$('#v093Replace')?.value;if(!f||!value)return;const [kind,key]=value.split(':');const center=centerOf(f);if(kind==='asset'&&ASSETS[key]){const a=ASSETS[key];f.properties={...f.properties,...a,kind:key,label:a.name,angle:0};f.geometry=G.rectangle(center,+a.length,+a.width,0);}else if(kind==='panel'&&PRODUCTS[key]){const p=PRODUCTS[key];f.properties={...f.properties,...p,product:key,label:p.name,length:p.length,width:p.width,dimensionLocked:true};f.geometry=G.rectangle(center,+p.length,+p.width,+f.properties.angle||0);}else if(kind==='surface'&&SURFACES['surface_'+key]){f.properties.type=key;f.properties.label=SURFACES['surface_'+key].name;}C.commit();renderDrawer('selection');C.toast('Selected item replaced.');}
  async function runAction(action,b){
    const [cmd,...parts]=action.split(':'),arg=parts.join(':');
    if(cmd==='v093DrawMode'){ui.drawMode=arg;ui.showAll=false;const item=itemFor(ui.drawAsset);if(item&&!item.allowed.includes(ui.drawMode)){const candidate=[...Object.entries({...Object.fromEntries(Object.keys(PRODUCTS).map(k=>['panel_'+k,itemFor('panel_'+k)])),...SURFACES,...SHAPES})].find(([,v])=>v?.allowed?.includes(arg));if(candidate)ui.drawAsset=candidate[0];}renderDrawer('planDraw');activateCurrentDraw(true);return;}
    if(action==='v093ShowAll'){ui.showAll=!ui.showAll;C.cancelDraw();renderDrawer('planDraw');return;}
    if(cmd==='v093DrawAsset'){const item=itemFor(arg);if(!item)return;ui.drawAsset=arg;if(ui.showAll||!item.allowed.includes(ui.drawMode))ui.drawMode=preferredMode(item);ui.showAll=false;renderDrawer('planDraw');activateCurrentDraw(true);return;}
    if(cmd==='v093PlaceFromDraw'){openDrawer('planPlace');await runAction('v093Place:'+arg,b);return;}
    if(cmd==='v093Place'){await base.runAction(`pickAsset:${arg}`,b);await base.runAction('master:place',b);setTimeout(()=>openDrawer('planPlace'),0);return;}
    if(cmd==='v093PlacePanel'){await base.runAction(`pickAsset:panel_${arg}`,b);await base.runAction('master:place',b);setTimeout(()=>openDrawer('planPlace'),0);return;}
    if(cmd==='v093ServiceMode'){ui.serviceMode=arg;renderDrawer('planServices');return;}
    if(cmd==='v093AddService'){S.project.serviceType=arg;S.project.serviceVisibility[arg]=true;S.project.serviceVisibilityConfigured=true;await base.runAction(`quickService:${arg}`,b);setTimeout(()=>openDrawer('planServices'),0);return;}
    if(action==='v093VisibleArea'){visiblePaperArea();return;}
    if(action==='v093ApplyStyle'){const f=C.selectedFeature();if(!f)return;const vals={styleColor:$('#editStyleColor')?.value,styleWeight:+$('#editStyleWeight')?.value||2,styleDash:$('#editStyleDash')?.value||'solid',styleFill:$('#editStyleFill')?.value,styleFillOpacity:(+$('#editStyleFillOpacity')?.value||0)/100,stylePattern:$('#editStylePattern')?.value||'solid'};for(const x of C.groupMembers(f).filter(x=>!x.properties?.guideHidden))Object.assign(x.properties,vals);C.commit();renderDrawer('selection');C.toast('Style applied.');return;}
    if(action==='v093ReplaceSelected'){replaceSelected();return;}
    if(action==='v093GroupToggle'){const f=C.selectedFeature();if(!f)return;return base.runAction(C.groupMembers(f).length>1?'editUngroup':'editGroup',b);}
    if(action==='v093RotateHint'||action==='v093ResizeHint'){return;}
    if(action==='selectMode'){S.selected=null;C.cancelDraw();base.closeDrawer?.();C.render();C.toast('Tap an item on the plan. Tap empty map space to deselect.');return;}
    return base.runAction(action,b);
  }
  function finishDraw(){const t=S.tool,opt={...S.options};base.finishDraw();if(opt.serviceType==='ohl'&&S.selected){const f=S.project.features.find(x=>x.id===S.selected);if(f&&f.properties?.type==='service'){const pts=f.geometry.type==='LineString'?f.geometry.coordinates:f.geometry.type==='MultiLineString'?f.geometry.coordinates.flat():[];if(pts.length&&!f.properties.supportPointsJSON)f.properties.supportPointsJSON=JSON.stringify(pts);f.properties.planCommitted=true;C.commit();C.toast('Overhead line added. Tap a + support marker to classify it as a pole or tower.');}}}
  function mount(){base.mount?.();enhanceSelectionBar();bindSelectionExtras();addMapStyleControl();renderCompactRail();document.body.classList.add('sami-v093');$('#dockReopen')?.setAttribute('aria-label','Show tools');}
  function setMode(mode){const r=base.setMode(mode);queueMicrotask(()=>{renderCompactRail();if(mode==='plan'&&S.drawer==='planDraw'){} });return r;}
  return {...base,mount,setMode,openDrawer,renderDrawer,renderDraft,renderTransformHandles,initFreehandInput,selectionHTML,runAction,finishDraw,render};
};
})();
