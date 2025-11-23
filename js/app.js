/* app.js — Button Style Maker Pro
   Self-contained; no external libs.
*/

(() => {
  // ---------------------------
  // Utilities
  // ---------------------------
  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const elCreate = (t, props = {}) => Object.assign(document.createElement(t), props);

  function toast(msg, t = 1500) {
    const node = $('toast');
    node.textContent = msg;
    node.classList.add('show');
    setTimeout(() => node.classList.remove('show'), t);
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // simple hex shade (percent -100..100)
  function shade(hex, percent) {
    if (!hex) return hex;
    const h = hex.replace('#','');
    const num = parseInt(h,16);
    let r = (num >> 16);
    let g = (num >> 8) & 0xff;
    let b = (num) & 0xff;
    if (percent < 0) {
      const p = 1 + percent/100;
      r=Math.round(r * p); g=Math.round(g*p); b=Math.round(b*p);
    } else {
      r = Math.round(r + (255 - r) * (percent/100));
      g = Math.round(g + (255 - g) * (percent/100));
      b = Math.round(b + (255 - b) * (percent/100));
    }
    return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  // serialize/deserialize state to shareable base64
  function encodeState(obj) {
    try { return btoa(encodeURIComponent(JSON.stringify(obj))); } catch(e){return '';}
  }
  function decodeState(b64) {
    try { return JSON.parse(decodeURIComponent(atob(b64))); } catch(e){return null;}
  }

  // Download helper
  function download(filename, text) {
    const a = elCreate('a');
    a.href = URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // copy to clipboard
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied ✓'); } catch (e) { toast('Copy failed'); }
  }

  // ---------------------------
  // Default state
  // ---------------------------
  const DEFAULT = {
    text: 'Like',
    icon: '', // can be inline SVG str
    iconPos: 'left',
    iconSize: 18,
    fontSize: 16,
    padY: 10,
    padX: 18,
    radius: 12,
    borderW: 0,
    borderColor: '#ffffff',
    textColor: '#ffffff',
    textAlt: '#022a2f',
    bgType: 'gradient',
    bg1: '#06b6d4',
    bg2: '#3b82f6',
    angle: 135,
    shadowX: 0,
    shadowY: 6,
    shadowBlur: 18,
    shadowColor: '#06384a',
    widthType: 'auto',
    fixedWidth: 160,
    hoverShade: -10,
    hoverY: -3,
    disabled: false,
    uppercase: false,
    pill: false,
    animation: 'none',
    animSpeed: 300,
    animIntensity: 3,
    cssVars: '',
  };

  let state = JSON.parse(JSON.stringify(DEFAULT));

  // ---------------------------
  // Icon library (inline SVGs)
  // ---------------------------
  // We'll populate the <select> with these. You can extend.
  const ICONS = {
    heart: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M12 21s-7-4.35-9-7.2C-1.3 8.6 4 3 7.5 5.5 9 6.8 12 10 12 10s3-3.2 4.5-4.5C20 3 23.3 8.6 21 13.8 19 16.65 12 21 12 21z"/></svg>`,
    thumbs: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M2 21h4V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 2 7.59 7.59C7.22 7.95 7 8.45 7 9v9c0 1.1.9 2 2 2h7c.83 0 1.54-.5 1.84-1.22L22 10.5c.09-.23.14-.47.14-.72z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M12 17.3l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.76L5.82 21z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V10a6 6 0 1 0-12 0v6l-2 2v1h16v-1l-2-2z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>`,
    like: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h1.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
  };

  // Populate icon select
  const iconSelect = $('iconSelect');
  (function populateIcons(){
    for (const key in ICONS){
      const opt = elCreate('option');
      opt.value = key;
      opt.textContent = key;
      iconSelect.appendChild(opt);
    }
  })();

  // ---------------------------
  // Elements
  // ---------------------------
  const nodes = {
    btnText: $('btnText'),
    iconSelect,
    uploadSvg: $('uploadSvg'),
    pasteSvg: $('pasteSvg'),
    iconSize: $('iconSize'),
    iconPos: $('iconPos'),
    widthType: $('widthType'),
    fixedWidth: $('fixedWidth'),
    fontSize: $('fontSize'),
    padY: $('padY'),
    padX: $('padX'),
    radius: $('radius'),
    borderW: $('borderW'),
    borderColor: $('borderColor'),
    textColor: $('textColor'),
    textAlt: $('textAlt'),
    bgType: $('bgType'),
    bg1: $('bg1'),
    bg2: $('bg2'),
    angle: $('angle'),
    shadowX: $('shadowX'),
    shadowY: $('shadowY'),
    shadowBlur: $('shadowBlur'),
    shadowColor: $('shadowColor'),
    disabled: $('disabled'),
    uppercase: $('uppercase'),
    pill: $('pill'),
    hoverShade: $('hoverShade'),
    hoverY: $('hoverY'),
    animationSelect: $('animationSelect'),
    animSpeed: $('animSpeed'),
    animIntensity: $('animIntensity'),
    presetGrid: $('presetGrid'),
    aiPrompt: $('aiPrompt'),
    aiGenerate: $('aiGenerate'),
    cssVars: $('cssVars'),
    exportTailwind: $('exportTailwind'),
    exportBootstrap: $('exportBootstrap'),
    exportReact: $('exportReact'),
    exportVue: $('exportVue'),
    addToPlayground: $('addToPlayground'),
    clearPlayground: $('clearPlayground'),
    // preview
    previewArea: $('previewArea'),
    respSelect: $('respSelect'),
    stateMode: $('stateMode'),
    htmlCode: $('htmlCode'),
    cssCode: $('cssCode'),
    copyHTMLBtn: $('copyHTMLBtn'),
    copyCSSBtn: $('copyCSSBtn'),
    downloadCSSBtn: $('downloadCSSBtn'),
    exportInline: $('exportInline'),
    saveProject: $('saveProject'),
    loadProject: $('loadProject'),
    shareBtn: $('shareBtn'),
    themeSelect: $('themeSelect'),
    playButtons: $('playButtons'),
    addToPlaygroundBtn: $('addToPlayground'),
    clearPlaygroundBtn: $('clearPlayground'),
    copyHTMLSnippet: $('copyHTMLSnippet'),
    copyCSSSnippet: $('copyCSSSnippet'),
  };

  // preview viewport sizing
  const previewViewport = $('previewViewport');
  function setViewport(size){
    if(size === 'mobile'){ previewViewport.style.maxWidth = '360px'; }
    else if(size === 'tablet'){ previewViewport.style.maxWidth = '768px'; }
    else previewViewport.style.maxWidth = '100%';
  }

  // ---------------------------
  // Presets (gallery)
  // ---------------------------
  const PRESETS = {
    like: { text:'Like', bgType:'gradient', bg1:'#06b6d4', bg2:'#3b82f6', angle:135, textColor:'#fff', radius:14, shadowY:10, animation:'none', icon:'heart'},
    neon: { text:'Notify', bgType:'gradient', bg1:'#ff007f', bg2:'#7c3aed', angle:120, textColor:'#fff', radius:999, shadowY:6, shadowColor:'#ff007f', animation:'pulse', icon:'star'},
    glass:{ text:'Subscribe', bgType:'transparent', bg1:'#ffffff22', textColor:'#eaffff', radius:12, borderW:1, borderColor:'#ffffff55', shadowY:2, animation:'none', icon:'bell'},
    danger:{ text:'Delete', bgType:'solid', bg1:'#ef4444', textColor:'#fff', radius:10, shadowY:8, animation:'shake', icon:'like'},
    ghost:{ text:'More', bgType:'transparent', textColor:'#cfeffb', borderW:1, borderColor:'#5b7286', radius:8, animation:'none', icon:''},
    neumorphic:{ text:'Like', bgType:'solid', bg1:'#e6f3f7', textColor:'#032230', radius:28, shadowX:-8, shadowY:10, shadowBlur:24, animation:'none', pill:true, icon:'thumbs'}
  };

  // render preset grid
  (function renderPresets(){
    for (const k in PRESETS){
      const c = elCreate('button', {className:'preset-card', innerText:k});
      c.addEventListener('click', ()=> applyPreset(PRESETS[k]));
      nodes.presetGrid.appendChild(c);
    }
  })();

  function applyPreset(p){
    state = Object.assign({}, state, p);
    // merge defaults for skipped keys
    state = Object.assign({}, DEFAULT, state);
    syncUI();
    render();
    toast('Preset applied');
  }

  // ---------------------------
  // UI <-> State sync
  // ---------------------------
  function syncStateFromUI(){
    state.text = nodes.btnText.value;
    const iconKey = nodes.iconSelect.value;
    state.icon = ICONS[iconKey] || (state.icon && state.icon.startsWith('<svg') ? state.icon : '');
    state.iconPos = nodes.iconPos.value;
    state.iconSize = +nodes.iconSize.value;
    state.fontSize = +nodes.fontSize.value;
    state.padY = +nodes.padY.value;
    state.padX = +nodes.padX.value;
    state.radius = +nodes.radius.value;
    state.borderW = +nodes.borderW.value;
    state.borderColor = nodes.borderColor.value;
    state.textColor = nodes.textColor.value;
    state.textAlt = nodes.textAlt.value;
    state.bgType = nodes.bgType.value;
    state.bg1 = nodes.bg1.value;
    state.bg2 = nodes.bg2.value;
    state.angle = +nodes.angle.value;
    state.shadowX = +nodes.shadowX.value;
    state.shadowY = +nodes.shadowY.value;
    state.shadowBlur = +nodes.shadowBlur.value;
    state.shadowColor = nodes.shadowColor.value;
    state.widthType = nodes.widthType.value;
    state.fixedWidth = +nodes.fixedWidth.value;
    state.hoverShade = +nodes.hoverShade.value;
    state.hoverY = +nodes.hoverY.value;
    state.disabled = nodes.disabled.checked;
    state.uppercase = nodes.uppercase.checked;
    state.pill = nodes.pill.checked;
    state.animation = nodes.animationSelect.value;
    state.animSpeed = +nodes.animSpeed.value;
    state.animIntensity = +nodes.animIntensity.value;
    state.cssVars = nodes.cssVars.value;
  }

  function syncUI(){
    nodes.btnText.value = state.text;
    // find icon key
    const iconKey = Object.keys(ICONS).find(k=>ICONS[k]===state.icon) || '';
    nodes.iconSelect.value = iconKey;
    nodes.iconSize.value = state.iconSize;
    nodes.iconPos.value = state.iconPos;
    nodes.fontSize.value = state.fontSize;
    nodes.padY.value = state.padY;
    nodes.padX.value = state.padX;
    nodes.radius.value = state.radius;
    nodes.borderW.value = state.borderW || 0;
    nodes.borderColor.value = state.borderColor;
    nodes.textColor.value = state.textColor;
    nodes.textAlt.value = state.textAlt;
    nodes.bgType.value = state.bgType;
    nodes.bg1.value = state.bg1;
    nodes.bg2.value = state.bg2;
    nodes.angle.value = state.angle;
    nodes.shadowX.value = state.shadowX;
    nodes.shadowY.value = state.shadowY;
    nodes.shadowBlur.value = state.shadowBlur;
    nodes.shadowColor.value = state.shadowColor;
    nodes.widthType.value = state.widthType;
    nodes.fixedWidth.value = state.fixedWidth;
    nodes.hoverShade.value = state.hoverShade;
    nodes.hoverY.value = state.hoverY;
    nodes.disabled.checked = !!state.disabled;
    nodes.uppercase.checked = !!state.uppercase;
    nodes.pill.checked = !!state.pill;
    nodes.animationSelect.value = state.animation || 'none';
    nodes.animSpeed.value = state.animSpeed || 300;
    nodes.animIntensity.value = state.animIntensity || 3;
    nodes.cssVars.value = state.cssVars || '';
  }

  // ---------------------------
  // SVG upload / paste
  // ---------------------------
  nodes.uploadSvg.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    try {
      const txt = await f.text();
      if(txt.includes('<svg')) {
        state.icon = txt;
        nodes.iconSelect.value = ''; // custom
        syncUI();
        render();
        toast('SVG uploaded');
      } else toast('Not a valid SVG');
    } catch(e){ toast('Upload failed'); }
  });

  nodes.pasteSvg.addEventListener('click', async ()=> {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt && txt.includes('<svg')) {
        state.icon = txt;
        nodes.iconSelect.value = '';
        syncUI();
        render();
        toast('SVG pasted');
      } else toast('Clipboard has no SVG markup');
    } catch(e){ toast('Paste failed'); }
  });

  // ---------------------------
  // Generate CSS string
  // ---------------------------
  function buildCSS(className='.btn-like'){
    // apply css-vars if present
    let varBlock = '';
    if (state.cssVars && state.cssVars.trim()) {
      const lines = state.cssVars.split('\n').map(l=>l.trim()).filter(Boolean);
      varBlock = `:root{\n  ${lines.join('\n  ')}\n}\n`;
    }

    // background
    let bg = 'transparent';
    if(state.bgType==='solid') bg = state.bg1;
    else if(state.bgType==='gradient') bg = `linear-gradient(${state.angle}deg, ${state.bg1}, ${state.bg2})`;
    else bg = 'transparent';

    const textColor = state.textColor;
    const radius = state.pill ? '999px' : state.radius + 'px';
    const border = state.borderW ? `${state.borderW}px solid ${state.borderColor}` : 'none';

    const widthRule = state.widthType==='full' ? 'width:100%;' : state.widthType==='fixed' ? `width:${state.fixedWidth}px;` : '';

    const boxShadow = `${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${hexToRgba(state.shadowColor, 0.34)}`;

    const hoverBg = (state.bgType==='solid') ? shade(state.bg1, state.hoverShade) : (state.bgType==='gradient' ? `linear-gradient(${state.angle}deg, ${shade(state.bg1, state.hoverShade)}, ${shade(state.bg2, state.hoverShade)})` : 'rgba(255,255,255,0.03)');
    const hoverShadow = `${state.shadowX}px ${state.shadowY+4}px ${Math.max(0, state.shadowBlur+6)}px ${hexToRgba(state.shadowColor, 0.56)}`;

    const transformHover = `transform: translateY(${state.hoverY}px);`;

    const animClass = animationToCss(state.animation, state.animSpeed, state.animIntensity);

    const css = `${varBlock}
${className} {
  ${widthRule}
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap: .5rem;
  padding: ${state.padY}px ${state.padX}px;
  font-size: ${state.fontSize}px;
  border-radius: ${radius};
  border: ${border};
  color: ${textColor};
  background: ${bg};
  box-shadow: ${boxShadow};
  cursor: pointer;
  text-transform: ${state.uppercase ? 'uppercase' : 'none'};
  transition: all ${state.animSpeed}ms cubic-bezier(.2,.9,.2,1);
  ${animClass.base || ''}
}
${className}:hover {
  background: ${hoverBg};
  ${transformHover}
  box-shadow: ${hoverShadow};
  ${animClass.hover || ''}
}
${className}:active { transform: translateY(${state.hoverY+2}px) scale(.996) }
${className}.disabled, ${className}[disabled] { opacity: .45; cursor: not-allowed; transform:none; }`;

    return css;
  }

  function hexToRgba(hex, a=1){
    const h = (hex || '#000').replace('#','');
    const num = parseInt(h,16);
    const r = (num >> 16);
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `rgba(${r},${g},${b},${a})`;
  }

  // animations mapping -> produce small inline css additions
  function animationToCss(name, speed = 300, intensity = 3){
    const res = {base: '', hover: ''};
    if(name === 'bounce') res.base = '', res.hover = `animation: bounce ${Math.max(200,speed)}ms;`;
    if(name === 'glow') res.base = `--glow-color: ${state.bg1};`, res.hover = `box-shadow: 0 6px ${8*intensity}px var(--glow-color);`;
    if(name === 'pulse') res.hover = `animation: pulse ${Math.max(400,speed)}ms infinite;`;
    if(name === 'flip') res.hover = `animation: flip ${Math.max(400,speed)}ms; transform-origin:center;`;
    if(name === 'shake') res.hover = `animation: shake ${Math.max(300,speed)}ms;`;
    if(name === 'rotate') res.hover = `animation: rotateAnim ${Math.max(500,speed)}ms linear;`;
    if(name === 'ripple') res.base = `position:relative; overflow:hidden;`, res.hover = ''; // ripple handled on click
    return res;
  }

  // ---------------------------
  // Build HTML snippet
  // ---------------------------
  function buildHTMLSnippet(className='btn-like'){
    const iconHtml = state.icon ? `<span class="icon" style="width:${state.iconSize}px;height:${state.iconSize}px">${state.icon}</span>` : '';
    const content = state.iconPos === 'right' ? `<span class="label">${escapeHtml(state.text)}</span>${iconHtml}` : state.iconPos === 'only' ? iconHtml : `${iconHtml}<span class="label">${escapeHtml(state.text)}</span>`;
    const disabledAttr = state.disabled ? ' disabled aria-disabled="true"' : '';
    return `<button class="${className}"${disabledAttr}>${content}</button>`;
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ---------------------------
  // Render preview area
  // ---------------------------
  function clearPreview(){ nodes.previewArea.innerHTML = ''; }

  function render(){
    syncStateFromUI();
    clearPreview();
    // create button
    const wrapper = elCreate('div');
    const btn = elCreate('button', {className:'btn-like', innerHTML: buildButtonInner(), title: state.text});
    // apply styles inline for accurate preview (plus CSS)
    applyInline(btn, false);
    // add ripple handler if animation is ripple
    if(state.animation === 'ripple') setupRipple(btn);

    // apply disabled
    if(state.disabled) btn.disabled = true;

    // if state mode is hover/active/focus, simulate
    const mode = nodes.stateMode.value;
    if(mode === 'hover') applyHoverSim(btn);
    if(mode === 'active') btn.style.transform = `translateY(${state.hoverY+2}px) scale(.996)`;
    if(mode === 'focus') btn.classList.add('focus-sim');
    if(mode === 'disabled') btn.disabled = true;

    wrapper.appendChild(btn);
    nodes.previewArea.appendChild(wrapper);

    // update code blocks
    nodes.cssCode.value = buildCSS('.btn-like');
    nodes.htmlCode.value = buildHTMLSnippet('btn-like');

    // update playground / save state
  }

  function buildButtonInner(){
    const icon = state.icon ? `<span class="icon" style="width:${state.iconSize}px;height:${state.iconSize}px">${state.icon}</span>` : '';
    if(state.iconPos === 'only') return icon;
    if(state.iconPos === 'right') return `<span class="label">${escapeHtml(state.text)}</span>${icon}`;
    return `${icon}<span class="label">${escapeHtml(state.text)}</span>`;
  }

  function applyInline(btn, hover = false){
    btn.style.padding = `${state.padY}px ${state.padX}px`;
    btn.style.fontSize = state.fontSize + 'px';
    btn.style.borderRadius = state.pill ? '999px' : state.radius + 'px';
    btn.style.border = state.borderW ? `${state.borderW}px solid ${state.borderColor}` : 'none';
    btn.style.color = state.textColor;
    if(state.widthType === 'full') btn.style.width = '100%';
    else if(state.widthType === 'fixed') btn.style.width = state.fixedWidth + 'px';
    else btn.style.width = 'auto';
    if(state.bgType === 'solid') btn.style.background = state.bg1;
    else if(state.bgType === 'gradient') btn.style.background = `linear-gradient(${state.angle}deg, ${state.bg1}, ${state.bg2})`;
    else btn.style.background = 'transparent';

    btn.style.boxShadow = `${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${hexToRgba(state.shadowColor, 0.34)}`;
    btn.style.transition = `all ${state.animSpeed}ms cubic-bezier(.2,.9,.2,1)`;
    if(hover){ // simulate hover
      const hoverBg = (state.bgType==='solid') ? shade(state.bg1, state.hoverShade) : (state.bgType==='gradient' ? `linear-gradient(${state.angle}deg, ${shade(state.bg1, state.hoverShade)}, ${shade(state.bg2, state.hoverShade)})` : 'rgba(255,255,255,0.03)');
      btn.style.background = hoverBg;
      btn.style.transform = `translateY(${state.hoverY}px)`;
      btn.style.boxShadow = `${state.shadowX}px ${state.shadowY+4}px ${Math.max(0,state.shadowBlur+6)}px ${hexToRgba(state.shadowColor, 0.56)}`;
    }
    if(state.uppercase) btn.style.textTransform = 'uppercase';
  }

  function applyHoverSim(btn){
    applyInline(btn, true);
  }

  // ripple effect
  function setupRipple(btn){
    btn.classList.add('ripple-effect');
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 2;
      const ripple = elCreate('span');
      ripple.style.position = 'absolute';
      ripple.style.left = (e.clientX - r.left - d/2) + 'px';
      ripple.style.top = (e.clientY - r.top - d/2) + 'px';
      ripple.style.width = ripple.style.height = d + 'px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = hexToRgba(state.textColor, 0.2);
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform 600ms ease-out, opacity 600ms ease-out';
      btn.appendChild(ripple);
      requestAnimationFrame(()=> {
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '0';
      });
      setTimeout(()=> ripple.remove(), 650);
    });
  }

  // ---------------------------
  // Exports
  // ---------------------------
  nodes.copyHTMLBtn.addEventListener('click', ()=> copy(nodes.htmlCode.value));
  nodes.copyCSSBtn.addEventListener('click', ()=> copy(nodes.cssCode.value));
  nodes.copyHTMLSnippet.addEventListener('click', ()=> copy(nodes.htmlCode.value));
  nodes.copyCSSSnippet.addEventListener('click', ()=> copy(nodes.cssCode.value));
  nodes.downloadCSSBtn.addEventListener('click', ()=> download('btn-like.css', nodes.cssCode.value));

  nodes.exportInline.addEventListener('click', ()=>{
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Exported Button</title><style>${nodes.cssCode.value}\n.btn-export{margin:40px;}</style></head><body><div class="btn-export">${nodes.htmlCode.value}</div><script>/* Optional: add ripple JS or interactions */</script></body></html>`;
    download('button-export.html', html);
  });

  // framework/export converters (basic)
  function toTailwindLike(){
    // Produce a heuristic tailwind-like utility string
    const classes = [];
    // background
    if(state.bgType==='solid') classes.push(`bg-[${state.bg1}]`);
    else if(state.bgType==='gradient') classes.push(`bg-gradient-to-r from-[${state.bg1}] to-[${state.bg2}]`);
    classes.push(`text-[${state.textColor}]`);
    classes.push(`px-[${state.padX}] py-[${state.padY}]`);
    classes.push(`rounded-[${state.pill?999:state.radius}]`);
    if(state.uppercase) classes.push('uppercase');
    return `<button class="${classes.join(' ')}">${escapeHtml(state.text)}</button>`;
  }

  function toBootstrap(){
    // map to bootstrap classes where possible
    if(state.bgType==='solid' && state.bg1.toLowerCase().includes('ef4444')) return `<button class="btn btn-danger">${escapeHtml(state.text)}</button>`;
    return `<button class="btn" style="background:${state.bgType==='gradient' ? `linear-gradient(${state.angle}deg, ${state.bg1}, ${state.bg2})` : state.bg1}; color:${state.textColor}; padding:${state.padY}px ${state.padX}px; border-radius:${state.pill?999:state.radius}px;">${escapeHtml(state.text)}</button>`;
  }

  function toReact(){
    const styles = {
      background: state.bgType==='gradient' ? `linear-gradient(${state.angle}deg, ${state.bg1}, ${state.bg2})` : state.bg1,
      color: state.textColor,
      padding: `${state.padY}px ${state.padX}px`,
      borderRadius: state.pill ? '999px' : state.radius + 'px'
    };
    const styleStr = JSON.stringify(styles).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'");
    return `function MyButton(){return (<button style={${styleStr}}>${state.text}</button>);}`;
  }

  function toVue(){
    return `<template><button :style="{ background: '${state.bgType==='gradient' ? `linear-gradient(${state.angle}deg, ${state.bg1}, ${state.bg2})` : state.bg1}', color:'${state.textColor}', padding:'${state.padY}px ${state.padX}px', borderRadius:'${state.pill?999:state.radius}px' }">${escapeHtml(state.text)}</button></template>`;
  }

  nodes.exportTailwind.addEventListener('click', ()=> copy(toTailwindLike()));
  nodes.exportBootstrap.addEventListener('click', ()=> copy(toBootstrap()));
  nodes.exportReact.addEventListener('click', ()=> copy(toReact()));
  nodes.exportVue.addEventListener('click', ()=> copy(toVue()));

  // ---------------------------
  // AI generator (rule-based)
  // ---------------------------
  nodes.aiGenerate.addEventListener('click', ()=>{
    const prompt = nodes.aiPrompt.value.trim().toLowerCase();
    if(!prompt) { toast('Write a short prompt'); return; }
    const s = JSON.parse(JSON.stringify(DEFAULT));
    // rules: check keywords
    if(prompt.includes('neon') || prompt.includes('futuristic') || prompt.includes('cyber')) {
      s.bgType='gradient'; s.bg1='#ff007f'; s.bg2='#7c3aed'; s.angle=120; s.textColor='#fff'; s.shadowColor='#ff007f'; s.animation='pulse'; s.pill=true;
    }
    if(prompt.includes('danger') || prompt.includes('delete') || prompt.includes('red')){
      s.bgType='solid'; s.bg1='#ef4444'; s.textColor='#fff'; s.animation='shake';
    }
    if(prompt.includes('glass') || prompt.includes('glassmorphism')) {
      s.bgType='transparent'; s.borderW=1; s.borderColor='rgba(255,255,255,0.12)'; s.shadowY=2; s.textColor='#eaf6ff';
    }
    if(prompt.includes('minimal') || prompt.includes('grey')) {
      s.bgType='solid'; s.bg1='#f3f4f6'; s.textColor='#111827'; s.radius=8; s.animation='none';
    }
    if(prompt.includes('like') || prompt.includes('heart')) { s.icon='heart'; }
    if(prompt.includes('bell') || prompt.includes('notify')) { s.icon='bell'; s.animation='glow'; }
    if(prompt.includes('glossy') || prompt.includes('shine')) { s.bgType='gradient'; s.bg1='#7dd3fc'; s.bg2='#0369a1'; s.animation='pulse'; }
    // merge
    state = Object.assign({}, state, s);
    syncUI(); render();
    toast('AI suggestion applied ✔️');
  });

  // ---------------------------
  // Save / Load / Share
  // ---------------------------
  nodes.saveProject.addEventListener('click', ()=>{
    const id = 'btnmaker_projects';
    const projects = JSON.parse(localStorage.getItem(id) || '[]');
    const name = prompt('Save name (optional)') || `project-${Date.now()}`;
    projects.push({name, state});
    localStorage.setItem(id, JSON.stringify(projects));
    toast('Saved to localStorage');
  });

  nodes.loadProject.addEventListener('click', ()=>{
    const id = 'btnmaker_projects';
    const projects = JSON.parse(localStorage.getItem(id) || '[]');
    if(!projects.length) { toast('No saved projects'); return; }
    const names = projects.map((p,i)=>`${i+1}) ${p.name}`).join('\n');
    const pick = prompt('Choose project number:\n' + names);
    const idx = Math.max(0, Math.min(projects.length-1, (parseInt(pick)-1)||0));
    if(projects[idx]) {
      state = projects[idx].state;
      syncUI(); render();
      toast('Project loaded');
    }
  });

  nodes.shareBtn.addEventListener('click', ()=>{
    const s = encodeState(state);
    if(!s) { toast('Share failed'); return; }
    const url = `${location.origin}${location.pathname}?style=${s}`;
    copy(url);
  });

  // parse state from URL if present
  (function loadFromUrl(){
    const params = new URLSearchParams(location.search);
    const style = params.get('style');
    if(style){
      const parsed = decodeState(style);
      if(parsed){ state = Object.assign({}, DEFAULT, parsed); syncUI(); render(); toast('Loaded from URL'); }
    }
  })();

  // ---------------------------
  // Playground (multi button)
  // ---------------------------
  function addToPlayground(){
    const id = 'btn_playground';
    const list = JSON.parse(localStorage.getItem(id) || '[]');
    list.push(state);
    localStorage.setItem(id, JSON.stringify(list));
    renderPlayground();
    toast('Added to playground');
  }
  function clearPlayground(){
    localStorage.removeItem('btn_playground');
    renderPlayground();
    toast('Playground cleared');
  }
  function renderPlayground(){
    const id = 'btn_playground';
    const list = JSON.parse(localStorage.getItem(id) || '[]');
    nodes.playButtons.innerHTML = '';
    list.forEach((s,i)=>{
      const card = elCreate('div', {className:'play-button-card'});
      const button = elCreate('button', {className:'btn-like', innerHTML: (s.icon? `<span class="icon" style="width:${s.iconSize||18}px;height:${s.iconSize||18}px">${s.icon}</span>` : '') + `<span class="label">${s.text}</span>`});
      // apply inline from s
      button.style.padding = `${s.padY}px ${s.padX}px`;
      button.style.fontSize = `${s.fontSize}px`;
      button.style.borderRadius = s.pill ? '999px' : s.radius + 'px';
      button.style.background = s.bgType==='gradient' ? `linear-gradient(${s.angle}deg, ${s.bg1}, ${s.bg2})` : s.bg1;
      button.style.color = s.textColor;
      const edit = elCreate('button', {innerText:'Edit', className:'small'});
      edit.addEventListener('click', ()=> {
        state = Object.assign({}, s);
        syncUI(); render();
        toast('Loaded to editor');
      });
      const remove = elCreate('button', {innerText:'Remove', className:'small'});
      remove.addEventListener('click', ()=> {
        const arr = JSON.parse(localStorage.getItem(id) || '[]');
        arr.splice(i,1);
        localStorage.setItem(id, JSON.stringify(arr));
        renderPlayground(); toast('Removed');
      });
      card.appendChild(button); card.appendChild(edit); card.appendChild(remove);
      nodes.playButtons.appendChild(card);
    });
  }

  nodes.addToPlayground.addEventListener('click', addToPlayground);
  nodes.clearPlayground.addEventListener('click', clearPlayground);

  // ---------------------------
  // Theme switch
  // ---------------------------
  nodes.themeSelect.addEventListener('change', (e)=>{
    const val = e.target.value;
    const app = document.querySelector('.app');
    app.className = 'app ' + val;
  });

  // ---------------------------
  // Events: inputs -> render
  // ---------------------------
  const inputs = document.querySelectorAll('input,select,textarea');
  inputs.forEach(inp => inp.addEventListener('input', ()=> {
    try{ syncStateFromUI(); render(); }catch(e){ console.error(e); }
  }));

  // initial sync & render
  syncUI();
  render();
  renderPlayground();

  // ---------------------------
  // Helpers: small but useful
  // ---------------------------
  function escapeHtmlAttr(s){ return String(s).replace(/"/g,'&quot;'); }

})();
