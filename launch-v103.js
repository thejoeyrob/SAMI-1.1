(() => {
  'use strict';

  const query = new URLSearchParams(location.search);
  const embedded = query.get('embedded') === '1';
  const closing = query.get('closing') === '1';
  const reducedMotion = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const $ = id => document.getElementById(id);

  const film = $('launchFilm');
  const problem = $('problemScene');
  const matrix = $('matrixField');
  const rootCanvas = $('rootCanvas');
  const rootCtx = rootCanvas.getContext('2d', { alpha: true });
  const focal = $('focalWord');
  const pinStage = $('pinStage');
  const pin = $('mapPin');
  const impact = $('impactBloom');
  const flash = $('overloadFlash');
  const answer = $('answerCopy');
  const resolve = $('resolveScene');
  const cadCanvas = $('cadCanvas');
  const cadCtx = cadCanvas.getContext('2d', { alpha: true });
  const fragments = $('letterFlight');
  const brand = $('brandResolve');
  const wordmarkFrame = $('wordmarkFrame');
  const wordmark = $('finalWordmark');
  const progress = $('filmProgress').firstElementChild;
  const sound = $('launchSound');
  const skip = $('launchSkip');
  const enter = $('enterSami');
  const why = $('whySami');
  const bed = $('launchBed');

  const PROCESS_TERMS = [
    'SITE VISIT', 'PHOTOGRAPHS', 'NOTES', 'SERVICE INFORMATION',
    'UTILITY PLANS', 'MEASUREMENTS', 'ON-SITE VERIFICATION',
    'COMMUNICATION', 'DRAFT INFORMATION', 'CAD', 'REVIEW',
    'AMENDMENT', 'RE-REVIEW', 'APPROVAL', 'PROJECT CHANGE',
    'UPDATES', 'TIME', 'COST', 'TRAVEL', 'DUPLICATION',
    'ENVIRONMENTAL IMPACT', 'ACCESS', 'ROUTE TO SITE',
    'CLIENT CHANGES', 'SURVEY', 'DRAWING ISSUE', 'REVISION',
    'SIGN-OFF', 'MULTIPLE SOURCES', 'MULTIPLE PEOPLE', 'REWORK'
  ];

  const FOCAL_TERMS = [
    ['SITE VISITS', .23, .24],
    ['PHOTOGRAPHS', .76, .24],
    ['NOTES', .22, .38],
    ['SERVICE INFORMATION', .73, .39],
    ['UTILITY PLANS', .25, .68],
    ['MEASUREMENTS', .76, .66],
    ['VERIFICATION', .33, .81],
    ['COMMUNICATION', .70, .80],
    ['CAD', .50, .22],
    ['REVIEW', .48, .76],
    ['AMENDMENT', .35, .33],
    ['RE-REVIEW', .66, .31],
    ['APPROVAL', .52, .69],
    ['PROJECT CHANGE', .50, .28],
    ['MORE TIME', .27, .51],
    ['MORE COST', .74, .51],
    ['MORE TRAVEL', .50, .78],
    ['MORE DUPLICATION', .50, .31],
    ['MORE ENVIRONMENTAL IMPACT', .50, .72]
  ];

  const COPY_LINES = [
    ['WHAT IF THERE WAS A BETTER WAY?', 22550, 24750],
    ['ONE SOURCE OF INFORMATION', 25800, 27750],
    ['ONE TEAM', 28250, 29850],
    ['ONE TOOL', 30300, 31900],
    ['IT’S TIME TO WORK SMARTER', 32400, 34450],
    ['IT’S TIME TO ASK', 35000, 38200, true]
  ];

  const TOTAL_DURATION = 42800;
  const timers = [];
  let raf = 0;
  let runStarted = 0;
  let soundOn = false;
  let roots = [];
  let cadLines = [];
  let rootPhase = 'idle';
  let rootPhaseAt = 0;
  let cadPhase = 'idle';
  let cadPhaseAt = 0;
  let runToken = 0;

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const easeInOut = t => {
    t = clamp(t);
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const seeded = seed => {
    const x = Math.sin(seed * 913.73 + 41.17) * 43758.5453123;
    return x - Math.floor(x);
  };
  const at = (ms, fn, token = runToken) => timers.push(setTimeout(() => {
    if (token === runToken) fn();
  }, ms));

  function clearRun() {
    runToken += 1;
    timers.splice(0).forEach(clearTimeout);
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * density));
    canvas.height = Math.max(1, Math.round(rect.height * density));
    ctx.setTransform(density, 0, 0, density, 0, 0);
  }

  function resize() {
    resizeCanvas(rootCanvas, rootCtx);
    resizeCanvas(cadCanvas, cadCtx);
    buildRoots();
    buildCadLines();
  }

  function impactPoint(canvas) {
    const rect = canvas.getBoundingClientRect();
    const yRatio = innerWidth >= 1200 ? .55 : innerHeight > innerWidth ? .51 : .54;
    return { w: rect.width, h: rect.height, x: rect.width / 2, y: rect.height * yRatio };
  }

  function buildRoots() {
    const { w, h, x: cx, y: cy } = impactPoint(rootCanvas);
    const count = innerWidth < 680 ? 43 : 66;
    roots = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + (seeded(i + 3) - .5) * .17;
      const radial = (.28 + seeded(i + 19) * .64) * Math.min(w * .62, h * 1.18);
      const xScale = innerHeight > innerWidth ? .86 : 1.14;
      const yScale = innerHeight > innerWidth ? .31 : .24;
      const segments = 5 + Math.floor(seeded(i + 33) * 6);
      const points = [[cx, cy]];
      let px = cx;
      let py = cy;
      for (let s = 1; s <= segments; s += 1) {
        const p = s / segments;
        const baseX = cx + Math.cos(angle) * radial * p * xScale;
        const baseY = cy + Math.sin(angle) * radial * p * yScale;
        const normalX = -Math.sin(angle);
        const normalY = Math.cos(angle) * .32;
        const jag = (seeded(i * 97 + s * 17) - .5) * (12 + radial * .028) * (s === segments ? .55 : 1);
        px = baseX + normalX * jag;
        py = baseY + normalY * jag;
        points.push([px, py]);
      }
      const branches = [];
      if (i % 2 === 0) {
        const branchAt = 2 + Math.floor(seeded(i + 55) * Math.max(1, segments - 3));
        const origin = points[Math.min(branchAt, points.length - 2)];
        const branchAngle = angle + (seeded(i + 71) > .5 ? 1 : -1) * (.35 + seeded(i + 72) * .48);
        const branchLength = radial * (.14 + seeded(i + 81) * .19);
        const branch = [origin];
        for (let s = 1; s <= 3; s += 1) {
          const p = s / 3;
          branch.push([
            origin[0] + Math.cos(branchAngle) * branchLength * p * xScale + (seeded(i * 13 + s) - .5) * 7,
            origin[1] + Math.sin(branchAngle) * branchLength * p * yScale + (seeded(i * 29 + s) - .5) * 3
          ]);
        }
        branches.push({ points: branch, start: branchAt / segments });
      }
      roots.push({ points, branches, weight: i % 9 === 0 ? 1.75 : i % 4 === 0 ? 1.15 : .72, tint: i % 7 === 0 });
    }
  }

  function buildCadLines() {
    const { w, h, x: cx, y: cy } = impactPoint(cadCanvas);
    cadLines = [];
    const count = innerWidth < 680 ? 34 : 54;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + (seeded(i + 201) - .5) * .12;
      const length = (.22 + seeded(i + 211) * .69) * Math.min(w * .61, h * 1.12);
      const ex = cx + Math.cos(angle) * length * (innerHeight > innerWidth ? .82 : 1.12);
      const ey = cy + Math.sin(angle) * length * (innerHeight > innerWidth ? .30 : .23);
      const bend = .22 + seeded(i + 217) * .44;
      const mx = cx + (ex - cx) * bend;
      const my = cy + (ey - cy) * bend;
      const horizontalFirst = i % 2 === 0;
      cadLines.push({
        points: horizontalFirst ? [[cx, cy], [mx, cy], [mx, my], [ex, my], [ex, ey]] : [[cx, cy], [cx, my], [mx, my], [mx, ey], [ex, ey]],
        box: i % 4 === 0 ? [ex, ey, 22 + seeded(i + 229) * 42, 12 + seeded(i + 231) * 28] : null,
        weight: i % 8 === 0 ? 1.55 : .76,
        tint: i % 6 === 0
      });
    }
  }

  function pathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i += 1) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    return length;
  }

  function drawPartialPath(ctx, points, amount) {
    const full = pathLength(points);
    let remaining = full * clamp(amount);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length && remaining > 0; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (remaining >= length) {
        ctx.lineTo(b[0], b[1]);
        remaining -= length;
      } else {
        const t = length ? remaining / length : 0;
        ctx.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
        remaining = 0;
      }
    }
    ctx.stroke();
  }

  function drawRoots(now) {
    const { w, h, x: cx, y: cy } = impactPoint(rootCanvas);
    rootCtx.clearRect(0, 0, w, h);
    if (rootPhase === 'idle' || rootPhase === 'dead') return;
    let amount = 0;
    if (rootPhase === 'grow') {
      const raw = clamp((now - rootPhaseAt) / 17100);
      const stepped = Math.floor(raw * 54) / 54;
      amount = clamp(easeOut(stepped) + Math.sin(now * .0032) * .004);
    } else if (rootPhase === 'overload') {
      amount = 1;
    } else if (rootPhase === 'retract') {
      amount = 1 - easeInOut((now - rootPhaseAt) / 1050);
    }
    const pulse = rootPhase === 'overload' ? .70 + .30 * Math.sin(now * .038) : .56 + .16 * Math.sin(now * .005);
    rootCtx.save();
    rootCtx.lineCap = 'square';
    rootCtx.lineJoin = 'miter';
    for (let i = 0; i < roots.length; i += 1) {
      const root = roots[i];
      const stagger = i / roots.length * .20;
      const local = clamp((amount - stagger) / (1 - stagger));
      if (local <= 0) continue;
      rootCtx.strokeStyle = root.tint ? `rgba(143,255,191,${.28 + pulse * .46})` : `rgba(41,223,132,${.19 + pulse * .40})`;
      rootCtx.lineWidth = root.weight * (rootPhase === 'overload' ? 1.35 : 1);
      rootCtx.shadowColor = root.tint ? 'rgba(121,255,181,.72)' : 'rgba(40,234,137,.54)';
      rootCtx.shadowBlur = rootPhase === 'overload' ? 13 : 6;
      drawPartialPath(rootCtx, root.points, local);
      for (const branch of root.branches) {
        const branchAmount = clamp((local - branch.start) / Math.max(.08, 1 - branch.start));
        if (branchAmount > 0) drawPartialPath(rootCtx, branch.points, branchAmount);
      }
    }
    rootCtx.shadowBlur = 0;
    const ringAmount = rootPhase === 'retract' ? amount : clamp((now - rootPhaseAt) / 1500);
    for (let i = 0; i < 5; i += 1) {
      rootCtx.globalAlpha = (.12 + i * .025) * ringAmount;
      rootCtx.strokeStyle = i % 2 ? '#4bff9b' : '#8dffc0';
      rootCtx.lineWidth = .8;
      rootCtx.beginPath();
      rootCtx.ellipse(cx, cy, 18 + i * 17, 5 + i * 4.4, 0, 0, Math.PI * 2);
      rootCtx.stroke();
    }
    rootCtx.restore();
  }

  function drawCad(now) {
    const { w, h, x: cx, y: cy } = impactPoint(cadCanvas);
    cadCtx.clearRect(0, 0, w, h);
    if (cadPhase === 'idle' || cadPhase === 'done') return;
    const elapsed = now - cadPhaseAt;
    let amount = cadPhase === 'expand' ? easeOut(elapsed / 2550) : 1 - easeInOut(elapsed / 950);
    amount = clamp(amount);
    const pulse = .68 + .26 * Math.sin(now * .006);
    cadCtx.save();
    cadCtx.lineJoin = 'miter';
    for (let i = 0; i < cadLines.length; i += 1) {
      const line = cadLines[i];
      const stagger = i / cadLines.length * .18;
      const local = clamp((amount - stagger) / (1 - stagger));
      if (!local) continue;
      cadCtx.strokeStyle = line.tint ? `rgba(190,255,218,${.28 + pulse * .46})` : `rgba(52,236,145,${.18 + pulse * .43})`;
      cadCtx.lineWidth = line.weight;
      cadCtx.shadowColor = line.tint ? 'rgba(177,255,211,.72)' : 'rgba(55,241,147,.52)';
      cadCtx.shadowBlur = 7;
      drawPartialPath(cadCtx, line.points, local);
      if (line.box && local > .92) {
        const [x, y, bw, bh] = line.box;
        cadCtx.globalAlpha = .14 * amount;
        cadCtx.strokeRect(x - bw / 2, y - bh / 2, bw, bh);
        cadCtx.globalAlpha = 1;
      }
    }
    cadCtx.shadowBlur = 0;
    for (let i = 0; i < 7; i += 1) {
      cadCtx.globalAlpha = (.08 + i * .015) * amount;
      cadCtx.strokeStyle = '#8effba';
      cadCtx.lineWidth = .75;
      cadCtx.beginPath();
      cadCtx.ellipse(cx, cy, 19 + i * 14, 5 + i * 3.8, 0, 0, Math.PI * 2);
      cadCtx.stroke();
    }
    cadCtx.restore();
    if (cadPhase === 'retract' && elapsed > 970) cadPhase = 'done';
  }

  function frame(now) {
    drawRoots(now);
    drawCad(now);
    if (!film.classList.contains('is-ready') && runStarted) {
      const elapsed = now - runStarted;
      progress.style.width = `${clamp(elapsed / TOTAL_DURATION) * 100}%`;
    }
    raf = requestAnimationFrame(frame);
  }

  function buildMatrix() {
    matrix.replaceChildren();
    const area = Math.max(1, innerWidth * innerHeight);
    const count = Math.max(155, Math.min(285, Math.round(area / 4800)));
    const aspect = innerWidth / Math.max(1, innerHeight);
    const cols = Math.max(10, Math.ceil(Math.sqrt(count * aspect)));
    const rows = Math.ceil(count / cols);
    const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => seeded(a + 400) - seeded(b + 400));
    order.forEach((gridIndex, orderIndex) => {
      const column = gridIndex % cols;
      const row = Math.floor(gridIndex / cols);
      const binary = gridIndex % 4 === 0 || gridIndex % 11 === 0;
      const token = document.createElement('span');
      token.className = `matrix-token${binary ? ' is-binary' : ''}`;
      token.textContent = binary
        ? Array.from({ length: 9 + (gridIndex % 17) }, (_, i) => seeded(gridIndex * 31 + i + 500) > .5 ? '1' : '0').join('')
        : PROCESS_TERMS[gridIndex % PROCESS_TERMS.length];
      const jitterX = (seeded(gridIndex + 601) - .5) * (86 / cols);
      const jitterY = (seeded(gridIndex + 701) - .5) * (74 / rows);
      token.style.left = `${3 + (column + .08) / cols * 94 + jitterX}%`;
      token.style.top = `${4 + (row + .12) / rows * 91 + jitterY}%`;
      token.style.setProperty('--token-opacity', String(binary ? .36 + seeded(gridIndex + 801) * .18 : .46 + seeded(gridIndex + 802) * .36));
      token.style.setProperty('--break-x', `${(seeded(gridIndex + 901) - .5) * 12}px`);
      token.style.setProperty('--break-y', `${(seeded(gridIndex + 902) - .5) * 8}px`);
      matrix.appendChild(token);
      const arrival = 2250 + (orderIndex / Math.max(1, count - 1)) * 15700 + seeded(gridIndex + 1001) * 620;
      at(arrival, () => token.classList.add('is-on'));
    });
  }

  function showFocal(text, x, y) {
    focal.className = 'focal-word';
    focal.style.left = `${x * 100}%`;
    focal.style.top = `${y * 100}%`;
    focal.textContent = text;
    requestAnimationFrame(() => focal.classList.add('is-on'));
  }

  function hideFocal() {
    focal.classList.remove('is-on');
    focal.classList.add('is-leaving');
  }

  function scheduleFocals() {
    let cursor = 3050;
    FOCAL_TERMS.forEach(([text, x, y], index) => {
      const portrait = innerHeight > innerWidth;
      const safeX = portrait ? clamp(x, .28, .72) : x;
      const safeY = portrait ? clamp(y, .20, .82) : y;
      const hold = 480 + seeded(index + 1201) * 280;
      const gap = 90 + seeded(index + 1301) * 160;
      at(cursor, () => showFocal(text, safeX, safeY));
      at(cursor + hold, hideFocal);
      cursor += hold + gap;
    });
  }

  function overload() {
    rootPhase = 'overload';
    rootPhaseAt = performance.now();
    matrix.classList.add('is-overloaded');
    const tokens = [...matrix.children];
    tokens.forEach((token, index) => {
      if (index % 3 === 0 || index % 11 === 0) token.classList.add('is-hot');
    });
    pinStage.classList.add('is-impacting');
    at(520, () => {
      rootPhase = 'retract';
      rootPhaseAt = performance.now();
      flash.classList.add('is-on');
    });
    at(1180, () => {
      problem.classList.add('is-dead');
      pinStage.classList.add('is-grey');
      tokens.forEach(token => token.classList.add('is-broken'));
    });
    at(1750, () => {
      matrix.style.opacity = '.10';
      rootPhase = 'dead';
      rootCtx.clearRect(0, 0, rootCanvas.clientWidth, rootCanvas.clientHeight);
      hideFocal();
    });
  }

  function setCopy(text, final = false) {
    answer.className = 'answer-copy';
    answer.replaceChildren();
    if (!final) {
      answer.textContent = text;
    } else {
      const chars = [...text];
      const picks = { 3: 'S', 6: 'I', 7: 'M', 13: 'A' };
      chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = picks[index] ? 'sami-source-letter' : 'plain-letter';
        if (picks[index]) {
          span.dataset.sami = picks[index];
          span.dataset.order = String({ S: 0, A: 1, M: 2, I: 3 }[picks[index]]);
        }
        answer.appendChild(span);
      });
    }
    requestAnimationFrame(() => answer.classList.add('is-on'));
  }

  function hideCopy() {
    answer.classList.remove('is-on');
    answer.classList.add('is-leaving');
  }

  function scheduleCopy() {
    COPY_LINES.forEach(([text, start, end, final], index) => {
      at(start, () => setCopy(text, final));
      if (!final) at(end, hideCopy);
      if (index === 0) at(start - 650, () => pinStage.classList.add('is-charging'));
    });
  }

  function fragmentMasks() {
    return {
      S: 'inset(0 70.5% 0 0)',
      A: 'inset(0 43.2% 0 25.2%)',
      M: 'inset(0 7.2% 0 56.2%)',
      I: 'inset(0 0 0 92.0%)'
    };
  }

  function fragmentTargets(rect) {
    return {
      S: [rect.left + rect.width * .145, rect.top + rect.height * .50],
      A: [rect.left + rect.width * .425, rect.top + rect.height * .50],
      M: [rect.left + rect.width * .720, rect.top + rect.height * .50],
      I: [rect.left + rect.width * .955, rect.top + rect.height * .50]
    };
  }

  function movePinToLogo(rect) {
    const targetX = rect.left + rect.width * .425;
    const targetY = rect.top + rect.height * .704;
    pinStage.style.transition = 'left 1.9s cubic-bezier(.16,.82,.18,1), top 1.9s cubic-bezier(.16,.82,.18,1), transform 1.9s cubic-bezier(.16,.82,.18,1), opacity .55s ease';
    pinStage.style.left = `${targetX}px`;
    pinStage.style.top = `${targetY}px`;
    pinStage.style.transform = 'translate(-50%,-71%) scale(.255)';
    pinStage.classList.remove('is-grey');
  }

  function morphLetters() {
    const sources = [...answer.querySelectorAll('[data-sami]')].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
    if (sources.length !== 4) {
      showWelcome(false);
      return;
    }
    resolve.classList.add('is-on');
    resolve.setAttribute('aria-hidden', 'false');
    answer.classList.add('is-extracting');
    cadPhase = 'expand';
    cadPhaseAt = performance.now();
    fragments.replaceChildren();
    const rect = wordmarkFrame.getBoundingClientRect();
    const targets = fragmentTargets(rect);
    const masks = fragmentMasks();
    const letters = ['S', 'A', 'M', 'I'];
    sources.forEach((source, index) => {
      const sourceRect = source.getBoundingClientRect();
      const letter = letters[index];
      const target = targets[letter];
      const image = document.createElement('img');
      image.className = 'letter-fragment';
      image.src = wordmark.src;
      image.alt = '';
      image.style.left = `${rect.left}px`;
      image.style.top = `${rect.top}px`;
      image.style.width = `${rect.width}px`;
      image.style.height = `${rect.height}px`;
      image.style.clipPath = masks[letter];
      image.style.transformOrigin = `${(target[0] - rect.left) / rect.width * 100}% 50%`;
      fragments.appendChild(image);
      const sourceX = sourceRect.left + sourceRect.width / 2;
      const sourceY = sourceRect.top + sourceRect.height / 2;
      const dx = sourceX - target[0];
      const dy = sourceY - target[1];
      const scale = clamp(sourceRect.height / Math.max(1, rect.height * .67), .19, .72);
      const angle = [-4.5, 3.2, -2.6, 4.0][index];
      image.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${angle}deg)`, opacity: 1, offset: 0 },
        { transform: `translate(${dx * .68}px, ${dy * .62}px) scale(${scale * 1.08}) rotate(${angle * .58}deg)`, opacity: 1, offset: .24 },
        { transform: `translate(${dx * .18}px, ${dy * .12}px) scale(${.82 + scale * .10}) rotate(${angle * .12}deg)`, opacity: 1, offset: .76 },
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 1 }
      ], {
        duration: 2250,
        delay: index * 85,
        easing: 'cubic-bezier(.16,.82,.18,1)',
        fill: 'forwards'
      });
    });
    at(520, () => movePinToLogo(rect));
    at(1840, () => brand.classList.add('is-on'));
    at(2390, () => {
      fragments.querySelectorAll('.letter-fragment').forEach((fragment, index) => fragment.animate([
        { opacity: 1, filter: 'brightness(1.9) saturate(1.25) drop-shadow(0 0 12px rgba(112,255,176,.72))' },
        { opacity: 0, filter: 'brightness(3.2) saturate(1.5) drop-shadow(0 0 30px rgba(112,255,176,.95))' }
      ], { duration: 520, delay: index * 35, easing: 'ease-out', fill: 'forwards' }));
      brand.classList.add('is-tracing');
      pinStage.style.opacity = '0';
      cadPhase = 'retract';
      cadPhaseAt = performance.now();
    });
    at(3450, () => showWelcome(false));
  }

  function showWelcome(immediate = true) {
    clearRun();
    problem.classList.add('is-gone');
    matrix.style.opacity = '0';
    answer.className = 'answer-copy';
    answer.replaceChildren();
    rootPhase = 'dead';
    cadPhase = 'done';
    rootCtx.clearRect(0, 0, rootCanvas.clientWidth, rootCanvas.clientHeight);
    cadCtx.clearRect(0, 0, cadCanvas.clientWidth, cadCanvas.clientHeight);
    pinStage.style.opacity = '0';
    resolve.classList.add('is-on');
    resolve.setAttribute('aria-hidden', 'false');
    brand.classList.add('is-on', 'is-tracing', 'is-ready');
    film.classList.add('is-ready');
    progress.style.width = '100%';
    fragments.replaceChildren();
  }

  function resetVisuals() {
    film.className = 'launch-film';
    problem.className = 'scene problem-scene';
    matrix.className = 'matrix-field';
    matrix.style.opacity = '';
    focal.className = 'focal-word';
    focal.textContent = '';
    answer.className = 'answer-copy';
    answer.replaceChildren();
    resolve.className = 'scene resolve-scene';
    resolve.setAttribute('aria-hidden', 'true');
    brand.className = 'brand-resolve';
    pinStage.className = 'pin-stage';
    pinStage.removeAttribute('style');
    pin.removeAttribute('style');
    impact.className = 'impact-bloom';
    flash.className = 'overload-flash';
    fragments.replaceChildren();
    progress.style.width = '0%';
    rootPhase = 'idle';
    cadPhase = 'idle';
    resize();
  }

  function run() {
    clearRun();
    const token = runToken;
    resetVisuals();
    buildMatrix();
    scheduleFocals();
    scheduleCopy();
    runStarted = performance.now();
    rootPhase = 'grow';
    rootPhaseAt = runStarted + 1670;
    pinStage.classList.add('is-dropping');
    at(1670, () => {
      pinStage.classList.add('is-impacting');
      impact.classList.add('is-on');
    }, token);
    at(19850, overload, token);
    at(38250, morphLetters, token);
    if (soundOn) {
      bed.currentTime = 0;
      bed.volume = .22;
      bed.play().catch(() => {});
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function enterWorkspace() {
    try { sessionStorage.setItem('sami.launch.seen', '1'); } catch {}
    if (embedded && parent !== window) {
      parent.postMessage({ type: 'sami:sales-intro-done' }, location.origin);
      return;
    }
    location.href = './index.html?from=meet';
  }

  function runClosing() {
    clearRun();
    const token = runToken;
    resetVisuals();
    film.classList.add('is-ready', 'is-closing');
    problem.classList.add('is-gone');
    resolve.classList.add('is-on');
    brand.classList.add('is-on', 'is-ready');
    progress.style.width = '100%';
    const rect = wordmarkFrame.getBoundingClientRect();
    const targetX = rect.left + rect.width * .425;
    const targetY = rect.top + rect.height * .704;
    pinStage.style.left = `${targetX}px`;
    pinStage.style.top = `${targetY}px`;
    pinStage.style.transform = 'translate(-50%,-71%) scale(.255)';
    pinStage.style.opacity = '1';
    pin.style.opacity = '1';
    pin.style.transform = 'translate3d(0,-13px,0) scale(1.02)';
    pinStage.classList.add('is-outro');
    cadPhase = 'expand';
    cadPhaseAt = performance.now();
    runStarted = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    at(1380, () => {
      cadPhase = 'retract';
      cadPhaseAt = performance.now();
      pinStage.classList.add('is-outro-retract');
    }, token);
    at(3500, () => {
      if (embedded && parent !== window) parent.postMessage({ type: 'sami:close-ready' }, location.origin);
      else {
        try { window.close(); } catch {}
      }
    }, token);
  }

  sound.addEventListener('click', async () => {
    soundOn = !soundOn;
    sound.setAttribute('aria-pressed', String(soundOn));
    sound.textContent = soundOn ? 'Sound on' : 'Sound';
    if (soundOn) {
      bed.currentTime = 0;
      bed.volume = .22;
      await bed.play().catch(() => {});
    } else {
      bed.pause();
    }
  });

  skip.addEventListener('click', () => showWelcome(true));
  enter.addEventListener('click', enterWorkspace);
  why.addEventListener('click', run);
  addEventListener('resize', resize, { passive: true });
  addEventListener('message', event => {
    if (event.origin !== location.origin) return;
    if (event.data?.type === 'sami:sales-intro-skip') showWelcome(true);
  });

  resize();
  if (closing) runClosing();
  else if (reducedMotion) showWelcome(true);
  else run();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
