(() => {
  'use strict';

  const PreviousFactory = window.SAMIStudio;
  if (typeof PreviousFactory !== 'function') return;

  window.SAMIStudio = function (C, O) {
    const base = PreviousFactory(C, O);
    const S = C.state;
    const $ = selector => document.querySelector(selector);
    const esc = C.esc;

    function areaSummary() {
      if (!S.project.area) return 'Define drawing space';
      const area = C.G.area(S.project.area);
      return area >= 10000 ? `${(area / 10000).toFixed(2)} ha drawing space` : `${Math.round(area).toLocaleString()} m² drawing space`;
    }

    function mapExploreHTML() {
      return `
        <label class="compact-search v103-search">
          <input id="mapExploreQuery" placeholder="Place, road, postcode or site" autocomplete="street-address">
          <button data-action="mapSearch">Find</button>
        </label>
        <div class="compact-action-row v103-explore-row">
          <button data-action="mapLocate">◎ My location</button>
          <button data-action="open:mapImage">▧ Find from image</button>
        </div>
        <div class="field-capture-strip">
          <span><strong>Field capture</strong><small>Kept off the issued drawing unless you switch it on.</small></span>
          <div>
            <button data-action="v103FieldNote">＋ Note</button>
            <button data-action="v103FieldPhoto">＋ Photo</button>
          </div>
        </div>
        <button class="wide-compact primary v103-area-button" data-action="open:mapArea">${esc(areaSummary())}</button>`;
    }

    function addIssuedDrawingControl(html) {
      const f = C.selectedFeature();
      if (!f || !['note', 'photo'].includes(f.properties?.type) || html.includes('id="editOnDrawing"')) return html;
      const control = `<label class="marker-output-toggle"><span><strong>Issued drawing</strong><small>Field markers stay on the live map by default.</small></span><input type="checkbox" id="editOnDrawing" ${f.properties.includeOnDrawing === true ? 'checked' : ''}></label>`;
      const marker = '<details class="compact-section">';
      return html.includes(marker) ? html.replace(marker, control + marker) : html + control;
    }

    function selectionHTML() {
      return addIssuedDrawingControl(base.selectionHTML());
    }

    function bindMarkerOutput() {
      const toggle = $('#editOnDrawing');
      const f = C.selectedFeature();
      if (!toggle || !f || !['note', 'photo'].includes(f.properties?.type)) return;
      toggle.onchange = () => {
        f.properties.includeOnDrawing = toggle.checked;
        if (toggle.checked && f.properties.includeLegend == null) f.properties.includeLegend = false;
        C.commit();
        C.toast(toggle.checked ? 'Marker will appear on the issued drawing.' : 'Marker remains field evidence only.');
      };
    }

    function bindLiveStyle() {
      ['editStyleColor', 'editStyleWeight', 'editStyleDash', 'editStyleFill', 'editStyleFillOpacity', 'editStylePattern'].forEach(id => {
        const control = $(`#${id}`);
        if (control) control.onchange = () => runAction('v093ApplyStyle', control);
      });
    }

    const originalRenderDrawer = base.renderDrawer;
    function renderDrawer(kind) {
      const box = $('#drawerContent');
      if (!box) return originalRenderDrawer(kind);
      if (kind === 'mapExplore') {
        S.drawer = kind;
        $('#drawerTitle').textContent = 'Explore';
        box.innerHTML = mapExploreHTML();
        box.onclick = event => {
          const button = event.target.closest('[data-action]');
          if (button) runAction(button.dataset.action, button);
        };
        $('#mapExploreQuery')?.addEventListener('keydown', event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            runAction('mapSearch');
          }
        });
        return;
      }
      if (kind === 'selection') {
        originalRenderDrawer(kind);
        box.innerHTML = selectionHTML();
        box.onclick = event => {
          const button = event.target.closest('[data-action]');
          if (button) runAction(button.dataset.action, button);
        };
        bindMarkerOutput();
        bindLiveStyle();
        return;
      }
      originalRenderDrawer(kind);
      if (kind === 'planServices') {
        box.insertAdjacentHTML('beforeend', '<div class="service-guidance"><strong>Planning guidance only</strong><span>Gas, water, electric, drainage, telecom and overhead-line records are shown only where a source returns them. Always verify utility positions with the asset owner, current plans and site locating before work.</span></div>');
      }
    }

    const originalOpenDrawer = base.openDrawer;
    function openDrawer(kind) {
      const result = originalOpenDrawer(kind);
      if (kind === 'mapExplore' || kind === 'selection') queueMicrotask(() => renderDrawer(kind));
      return result;
    }

    const originalStartTool = base.startTool;
    function startTool(tool, options = {}) {
      if (S.mode === 'map' && ['note', 'photo'].includes(tool)) {
        const mode = S.mode;
        S.mode = 'plan';
        try {
          return originalStartTool(tool, {
            ...options,
            includeOnDrawing: false,
            includeLegend: false,
            fieldCapture: true
          });
        } finally {
          S.mode = mode;
          document.body.dataset.masterMode = 'map';
        }
      }
      return originalStartTool(tool, options);
    }

    function beginFieldNote() {
      C.showModal('Add a field note', `
        <p class="subtle">This marker is saved with the project but stays off the issued drawing unless you later switch it on.</p>
        <label class="field-label" for="v103FieldNoteText">Note</label>
        <textarea class="field v103-note-field" id="v103FieldNoteText" rows="6" maxlength="2000" placeholder="Access issue, observation, instruction or site detail…"></textarea>
        <button class="wide-btn primary" data-v103-place-note="1">Choose marker position</button>`);
      const body = $('#modalBody');
      body.onclick = event => {
        if (!event.target.closest('[data-v103-place-note]')) return;
        const text = $('#v103FieldNoteText')?.value.trim();
        if (!text) {
          C.toast('Enter the note first.');
          return;
        }
        C.closeModal();
        startTool('note', { text, label: text, includeOnDrawing: false, includeLegend: false, fieldCapture: true });
        C.toast('Tap the map to place the field note.');
      };
      setTimeout(() => $('#v103FieldNoteText')?.focus(), 40);
    }

    const originalRunAction = base.runAction;
    async function runAction(action, button) {
      if (action === 'v103FieldNote') {
        beginFieldNote();
        return;
      }
      if (action === 'v103FieldPhoto') {
        $('#photoInput')?.click();
        return;
      }
      return originalRunAction(action, button);
    }

    const originalFeatureStyle = base.featureStyle;
    function featureStyle(feature) {
      const style = originalFeatureStyle(feature);
      const pattern = feature?.properties?.stylePattern;
      if (pattern === 'none') style.fillOpacity = 0;
      else if (pattern === 'hatch' || pattern === 'dots') style.fillOpacity = Math.min(Number(style.fillOpacity) || 0, .07);
      return style;
    }

    function ensureTipLayer(){let tip=document.querySelector('#samiUiTip');if(tip)return tip;tip=document.createElement('div');tip.id='samiUiTip';tip.className='sami-ui-tip';document.body.appendChild(tip);return tip;}
    function showTip(button){const text=button?.dataset?.tip||button?.getAttribute('aria-label')||button?.title;if(!text)return;const tip=ensureTipLayer(),r=button.getBoundingClientRect();tip.textContent=text;tip.style.left=Math.max(8,Math.min(innerWidth-tip.offsetWidth-8,r.left+r.width/2))+'px';tip.style.top=Math.min(innerHeight-46,r.bottom+8)+'px';tip.classList.add('show');clearTimeout(showTip.t);showTip.t=setTimeout(()=>tip.classList.remove('show'),1450);}
    function iconButton(selector,icon,label){const b=$(selector);if(!b)return;b.textContent=icon;b.dataset.tip=label;b.setAttribute('aria-label',label);b.title=label;b.classList.add('symbol-btn');if(b.dataset.tipBound)return;b.dataset.tipBound='1';b.addEventListener('mouseenter',()=>showTip(b));b.addEventListener('focus',()=>showTip(b));b.addEventListener('dblclick',e=>{e.preventDefault();showTip(b)});let hold;b.addEventListener('pointerdown',()=>{clearTimeout(hold);hold=setTimeout(()=>showTip(b),420)},{passive:true});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(hold),{passive:true}));}
    function decorateUI(){iconButton('#quickAssets','▣','Assets');iconButton('#quickHelp','?','Help & shortcuts');iconButton('#searchBtn','⌕','Find site');iconButton('#projectBtn','◫','Project');iconButton('#exportBtn','↗','Export / issue drawing');iconButton('#locateBtn','◎','Use current location');iconButton('#fitBtn','⛶','Fit plan');iconButton('#lockBtn','◇','Lock map');iconButton('#zoomInBtn','＋','Zoom in');iconButton('#zoomOutBtn','−','Zoom out');iconButton('#mapStyleToggle','◐','Map style');const bc=$('#baseCollapse');if(bc){bc.dataset.tip='Map style';bc.setAttribute('aria-label','Map style')}
      let close=$('#closeAppV120');if(!close){const host=$('.top-actions');if(host){close=document.createElement('button');close.id='closeAppV120';close.type='button';close.className='header-btn symbol-btn';close.textContent='×';close.dataset.tip='Close SAMI';close.setAttribute('aria-label','Close SAMI');host.appendChild(close);close.onclick=()=>window.SAMILaunch?.closeApp?.();}}
      document.querySelectorAll('.map-controls button,.canvas-toolbar button,.selection-bar button,.master-toolbar button').forEach(b=>{if(!b.dataset.tip)b.dataset.tip=b.getAttribute('aria-label')||b.title||b.textContent.trim();if(!b.dataset.tipBound){b.dataset.tipBound='1';b.addEventListener('mouseenter',()=>showTip(b));b.addEventListener('focus',()=>showTip(b));b.addEventListener('dblclick',e=>{e.preventDefault();showTip(b)});}});
    }
    const originalMount = base.mount;
    function mount() {
      originalMount?.();
      document.body.classList.add('sami-v103','sami-v120');
      const version = $('.project-meta');
      if (version) version.innerHTML = version.innerHTML.replace(/v\d+\.\d+\.\d+/i, 'v1.2.0');
      $('#dockFold')?.setAttribute('aria-label', 'Hide complete sidebar');
      $('#dockReopen')?.setAttribute('aria-label', 'Show complete sidebar');
      const close = $('#closeDrawer');
      if (close) {
        close.setAttribute('aria-label', 'Hide complete sidebar');
        close.title = 'Hide complete sidebar';
        close.onclick = () => $('#dockFold')?.click();
      }
      const dock = $('#studioDock');
      const status = $('#drawStatus');
      const options = $('#dockOptions');
      if (dock && status && options && status.parentElement !== dock) dock.insertBefore(status, options);
      if (S.mode === 'map') renderDrawer('mapExplore');
      decorateUI();
      setTimeout(decorateUI,120);
      setTimeout(decorateUI,650);
    }

    return {
      ...base,
      mount,
      openDrawer,
      renderDrawer,
      selectionHTML,
      startTool,
      runAction,
      featureStyle
    };
  };
})();
