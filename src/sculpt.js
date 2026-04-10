/* sculpt.js — Shape Sculptor: interactive 3D shape builder */

const SCULPT_SHAPES = [
  {
    id: 'sphere',
    label: 'Sphere',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="4"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
    params: [
      { id: 'rx', label: 'Radius X', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'ry', label: 'Radius Y', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'rz', label: 'Radius Z', min: 0.5, max: 8, step: 0.1, default: 3 },
    ],
    // Returns z = f(x,y) on upper hemisphere — approximate via sqrt
    // For graphing we use: z = rz * sqrt(max(0, 1 - (x/rx)^2 - (y/ry)^2))
    graphExpr: (p) =>
      `${p.rz.toFixed(2)} * sqrt(max(0, 1 - (x/${p.rx.toFixed(2)})^2 - (y/${p.ry.toFixed(2)})^2))`,
    equationTeX: (p) =>
      `(x/${p.rx.toFixed(2)})² + (y/${p.ry.toFixed(2)})² + (z/${p.rz.toFixed(2)})² = 1`,
    // Three.js geometry builder for preview
    previewMesh: (p, THREE) => {
      const geo = new THREE.SphereGeometry(1, 48, 32);
      geo.scale(p.rx, p.rz, p.ry);
      return geo;
    },
  },
  {
    id: 'cube',
    label: 'Cube / Box',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="14" height="14" rx="1"/><polyline points="3,7 10,2 21,2 21,16 17,21"/><line x1="10" y1="2" x2="10" y2="7"/><line x1="21" y1="2" x2="17" y2="7"/></svg>`,
    params: [
      { id: 'w', label: 'Width (X)', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'd', label: 'Depth (Y)',  min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'h', label: 'Height (Z)', min: 0.5, max: 8, step: 0.1, default: 3 },
    ],
    graphExpr: (p) =>
      // Top face as flat plane within bounds — we represent as min of top surface
      `(abs(x) <= ${(p.w/2).toFixed(2)} and abs(y) <= ${(p.d/2).toFixed(2)}) * ${p.h.toFixed(2)}`,
    equationTeX: (p) =>
      `|x| ≤ ${(p.w/2).toFixed(2)},  |y| ≤ ${(p.d/2).toFixed(2)},  |z| ≤ ${(p.h/2).toFixed(2)}`,
    previewMesh: (p, THREE) => new THREE.BoxGeometry(p.w, p.h, p.d),
  },
  {
    id: 'cylinder',
    label: 'Cylinder',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><ellipse cx="12" cy="19" rx="8" ry="3"/><line x1="4" y1="5" x2="4" y2="19"/><line x1="20" y1="5" x2="20" y2="19"/></svg>`,
    params: [
      { id: 'rx', label: 'Radius X', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'ry', label: 'Radius Y', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'h',  label: 'Height Z', min: 0.5, max: 10, step: 0.1, default: 4 },
    ],
    graphExpr: (p) =>
      `((x/${p.rx.toFixed(2)})^2 + (y/${p.ry.toFixed(2)})^2 <= 1) * ${p.h.toFixed(2)}`,
    equationTeX: (p) =>
      `(x/${p.rx.toFixed(2)})² + (y/${p.ry.toFixed(2)})² ≤ 1,  0 ≤ z ≤ ${p.h.toFixed(2)}`,
    previewMesh: (p, THREE) => {
      const geo = new THREE.CylinderGeometry(1, 1, p.h, 48);
      geo.scale(p.rx, 1, p.ry);
      return geo;
    },
  },
  {
    id: 'cone',
    label: 'Cone',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="19" rx="8" ry="3"/><line x1="4" y1="19" x2="12" y2="3"/><line x1="20" y1="19" x2="12" y2="3"/></svg>`,
    params: [
      { id: 'rx', label: 'Base Radius X', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'ry', label: 'Base Radius Y', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'h',  label: 'Height',        min: 0.5, max: 10, step: 0.1, default: 5 },
    ],
    graphExpr: (p) => {
      const H = p.h.toFixed(2), RX = p.rx.toFixed(2), RY = p.ry.toFixed(2);
      return `${H} * (1 - sqrt((x/${RX})^2 + (y/${RY})^2)) * ((x/${RX})^2 + (y/${RY})^2 <= 1)`;
    },
    equationTeX: (p) =>
      `z = ${p.h.toFixed(2)}(1 - √((x/${p.rx.toFixed(2)})² + (y/${p.ry.toFixed(2)})²))`,
    previewMesh: (p, THREE) => {
      const geo = new THREE.ConeGeometry(1, p.h, 48);
      geo.scale(p.rx, 1, p.ry);
      return geo;
    },
  },
  {
    id: 'pyramid',
    label: 'Pyramid',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12,3 22,20 2,20"/><line x1="12" y1="3" x2="17" y2="20"/></svg>`,
    params: [
      { id: 'w', label: 'Base Width X',  min: 0.5, max: 8, step: 0.1, default: 4 },
      { id: 'd', label: 'Base Depth Y',  min: 0.5, max: 8, step: 0.1, default: 4 },
      { id: 'h', label: 'Height Z',      min: 0.5, max: 10, step: 0.1, default: 5 },
    ],
    graphExpr: (p) => {
      const W = (p.w/2).toFixed(2), D = (p.d/2).toFixed(2), H = p.h.toFixed(2);
      return `${H} * (1 - max(abs(x)/${W}, abs(y)/${D})) * (max(abs(x)/${W}, abs(y)/${D}) <= 1)`;
    },
    equationTeX: (p) =>
      `z = ${p.h.toFixed(2)}·(1 − max(|x|/${(p.w/2).toFixed(2)}, |y|/${(p.d/2).toFixed(2)}))`,
    previewMesh: (p, THREE) => {
      // Build pyramid manually
      const W = p.w/2, D = p.d/2, H = p.h;
      const verts = new Float32Array([
        0,H,0,  -W,0,-D,   W,0,-D,
        0,H,0,   W,0,-D,   W,0, D,
        0,H,0,   W,0, D,  -W,0, D,
        0,H,0,  -W,0, D,  -W,0,-D,
        -W,0,-D,  W,0,-D,  W,0, D,
        -W,0,-D,  W,0, D, -W,0, D,
      ]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.computeVertexNormals();
      return geo;
    },
  },
  {
    id: 'prism',
    label: 'Prism',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12,3 2,20 22,20"/><polygon points="12,3 22,20 22,12 12,3"/></svg>`,
    params: [
      { id: 'w', label: 'Width X',   min: 0.5, max: 8, step: 0.1, default: 4 },
      { id: 'l', label: 'Length Y',  min: 0.5, max: 10, step: 0.1, default: 5 },
      { id: 'h', label: 'Height Z',  min: 0.5, max: 8, step: 0.1, default: 3 },
    ],
    graphExpr: (p) => {
      const W = (p.w/2).toFixed(2), L = (p.l/2).toFixed(2), H = p.h.toFixed(2);
      return `(abs(y) <= ${L} and abs(x) <= ${W}) * ${H} * (1 - abs(x)/${W})`;
    },
    equationTeX: (p) =>
      `Triangular prism: W=${p.w.toFixed(2)}, L=${p.l.toFixed(2)}, H=${p.h.toFixed(2)}`,
    previewMesh: (p, THREE) => {
      const W = p.w/2, L = p.l/2, H = p.h;
      const shape = new THREE.Shape();
      shape.moveTo(-W, 0); shape.lineTo(W, 0); shape.lineTo(0, H); shape.lineTo(-W, 0);
      const extSettings = { depth: p.l, bevelEnabled: false };
      const geo = new THREE.ExtrudeGeometry(shape, extSettings);
      geo.translate(0, 0, -L);
      return geo;
    },
  },
  {
    id: 'torus',
    label: 'Torus',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="5" ry="2"/></svg>`,
    params: [
      { id: 'R', label: 'Major Radius', min: 1, max: 8, step: 0.1, default: 4 },
      { id: 'r', label: 'Tube Radius',  min: 0.2, max: 4, step: 0.1, default: 1.2 },
    ],
    graphExpr: (p) => {
      const R = p.R.toFixed(2), r = p.r.toFixed(2);
      return `sqrt(max(0, ${r}^2 - (sqrt(x^2 + y^2) - ${R})^2))`;
    },
    equationTeX: (p) =>
      `(√(x²+y²) − ${p.R.toFixed(2)})² + z² = ${p.r.toFixed(2)}²`,
    previewMesh: (p, THREE) => new THREE.TorusGeometry(p.R, p.r, 32, 64),
  },
  {
    id: 'ellipsoid',
    label: 'Ellipsoid',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="12" rx="9" ry="5"/><ellipse cx="12" cy="12" rx="9" ry="2"/></svg>`,
    params: [
      { id: 'rx', label: 'Radius X', min: 0.5, max: 8, step: 0.1, default: 5 },
      { id: 'ry', label: 'Radius Y', min: 0.5, max: 8, step: 0.1, default: 3 },
      { id: 'rz', label: 'Radius Z', min: 0.5, max: 8, step: 0.1, default: 2 },
    ],
    graphExpr: (p) =>
      `${p.rz.toFixed(2)} * sqrt(max(0, 1 - (x/${p.rx.toFixed(2)})^2 - (y/${p.ry.toFixed(2)})^2))`,
    equationTeX: (p) =>
      `(x/${p.rx.toFixed(2)})² + (y/${p.ry.toFixed(2)})² + (z/${p.rz.toFixed(2)})² = 1`,
    previewMesh: (p, THREE) => {
      const geo = new THREE.SphereGeometry(1, 48, 32);
      geo.scale(p.rx, p.rz, p.ry);
      return geo;
    },
  },
];

// ── Sculptor state ──────────────────────────────────────────────────────────
const SculptState = {
  activeShapeId: 'sphere',
  params: {},         // id → value
  previewRenderer: null,
  previewScene: null,
  previewCamera: null,
  previewMesh: null,
  previewAngle: 0,
  previewAF: null,
  isDragging: false,
  lastX: 0,
  lastY: 0,
  theta: 0.6,
  phi: 1.1,
};

// ── Init sculpt defaults ────────────────────────────────────────────────────
function initSculptDefaults(shapeId) {
  const shape = SCULPT_SHAPES.find(s => s.id === shapeId);
  if (!shape) return;
  shape.params.forEach(p => {
    SculptState.params[p.id] = p.default;
  });
}

// ── Open/close sculptor overlay ─────────────────────────────────────────────
function openSculptor() {
  const overlay = document.getElementById('sculpt-overlay');
  overlay.classList.add('open');

  // Init the active shape if not yet done
  if (!SculptState.params[SCULPT_SHAPES[0].params[0].id]) {
    initSculptDefaults(SculptState.activeShapeId);
  }

  renderShapePicker();
  renderSliders();
  renderEquationBox();
  initSculptPreview();
  updateSculptPreviewMesh();
}

function closeSculptor() {
  document.getElementById('sculpt-overlay').classList.remove('open');
  if (SculptState.previewAF) {
    cancelAnimationFrame(SculptState.previewAF);
    SculptState.previewAF = null;
  }
}

// ── Shape picker ────────────────────────────────────────────────────────────
function renderShapePicker() {
  const grid = document.getElementById('sculpt-shape-grid');
  grid.innerHTML = '';
  SCULPT_SHAPES.forEach(shape => {
    const btn = document.createElement('button');
    btn.className = 'sculpt-shape-btn' + (shape.id === SculptState.activeShapeId ? ' active' : '');
    btn.innerHTML = `${shape.icon}<span>${shape.label}</span>`;
    btn.addEventListener('click', () => selectSculptShape(shape.id));
    grid.appendChild(btn);
  });
}

function selectSculptShape(id) {
  SculptState.activeShapeId = id;
  initSculptDefaults(id);
  renderShapePicker();
  renderSliders();
  renderEquationBox();
  updateSculptPreviewMesh();
}

// ── Sliders ──────────────────────────────────────────────────────────────────
function renderSliders() {
  const shape = SCULPT_SHAPES.find(s => s.id === SculptState.activeShapeId);
  const container = document.getElementById('sculpt-sliders');
  container.innerHTML = '';

  shape.params.forEach(p => {
    const val = SculptState.params[p.id] ?? p.default;
    const div = document.createElement('div');
    div.className = 'sculpt-param';
    div.innerHTML = `
      <div class="sculpt-param-row">
        <span class="sculpt-param-label">${p.label}</span>
        <span class="sculpt-param-value" id="sv-${p.id}">${val.toFixed(1)}</span>
      </div>
      <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}" data-pid="${p.id}"/>
    `;
    container.appendChild(div);

    div.querySelector('input').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      SculptState.params[p.id] = v;
      document.getElementById(`sv-${p.id}`).textContent = v.toFixed(1);
      renderEquationBox();
      updateSculptPreviewMesh();
    });
  });
}

// ── Equation box ─────────────────────────────────────────────────────────────
function renderEquationBox() {
  const shape = SCULPT_SHAPES.find(s => s.id === SculptState.activeShapeId);
  const box = document.getElementById('sculpt-equation-box');
  box.innerHTML = `
    <div class="eq-label">Equation</div>
    ${shape.equationTeX(SculptState.params)}
    <div class="eq-label" style="margin-top:8px;">f(x,y) injected as</div>
    <span style="color:var(--color-primary)">${shape.graphExpr(SculptState.params)}</span>
  `;
}

// ── Three.js preview ─────────────────────────────────────────────────────────
function initSculptPreview() {
  const canvas = document.getElementById('sculpt-canvas');
  if (SculptState.previewRenderer) {
    SculptState.previewRenderer.dispose();
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-surface').trim() || '#f9f8f5'
  );

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.9); d1.position.set(8, 12, 8); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x88aaff, 0.3); d2.position.set(-8, -4, -8); scene.add(d2);

  // Grid
  const grid = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
  grid.position.y = -4;
  scene.add(grid);

  const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
  const camera = new THREE.PerspectiveCamera(44, w / h, 0.01, 1000);
  camera.position.set(0, 5, 14);
  camera.lookAt(0, 0, 0);
  renderer.setSize(w, h, false);

  SculptState.previewRenderer = renderer;
  SculptState.previewScene    = scene;
  SculptState.previewCamera   = camera;

  // Mouse drag to orbit preview
  canvas.addEventListener('mousedown', e => {
    SculptState.isDragging = true;
    SculptState.lastX = e.clientX;
    SculptState.lastY = e.clientY;
  });
  window.addEventListener('mousemove', e => {
    if (!SculptState.isDragging) return;
    const dx = e.clientX - SculptState.lastX;
    const dy = e.clientY - SculptState.lastY;
    SculptState.lastX = e.clientX;
    SculptState.lastY = e.clientY;
    SculptState.theta += dx * 0.01;
    SculptState.phi   = Math.max(0.15, Math.min(Math.PI - 0.15, SculptState.phi + dy * 0.01));
    const R = 14;
    camera.position.set(
      R * Math.sin(SculptState.phi) * Math.cos(SculptState.theta),
      R * Math.cos(SculptState.phi),
      R * Math.sin(SculptState.phi) * Math.sin(SculptState.theta)
    );
    camera.lookAt(0, 0, 0);
  });
  window.addEventListener('mouseup', () => { SculptState.isDragging = false; });

  // Resize observer
  new ResizeObserver(() => {
    const w2 = canvas.parentElement.clientWidth, h2 = canvas.parentElement.clientHeight;
    renderer.setSize(w2, h2, false);
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
  }).observe(canvas.parentElement);

  // Render loop
  function loop() {
    SculptState.previewAF = requestAnimationFrame(loop);
    if (!SculptState.isDragging) {
      SculptState.theta += 0.004;
      const R = 14;
      camera.position.set(
        R * Math.sin(SculptState.phi) * Math.cos(SculptState.theta),
        R * Math.cos(SculptState.phi),
        R * Math.sin(SculptState.phi) * Math.sin(SculptState.theta)
      );
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  }
  loop();
}

function updateSculptPreviewMesh() {
  const scene = SculptState.previewScene;
  if (!scene) return;

  // Remove old mesh
  if (SculptState.previewMesh) {
    scene.remove(SculptState.previewMesh);
    SculptState.previewMesh.geometry.dispose();
    SculptState.previewMesh.material.dispose();
    SculptState.previewMesh = null;
  }

  const shape = SCULPT_SHAPES.find(s => s.id === SculptState.activeShapeId);
  const geo   = shape.previewMesh(SculptState.params, THREE);
  const mat   = new THREE.MeshPhongMaterial({
    color:     0x4f98a3,
    emissive:  0x1a3d40,
    specular:  0xffffff,
    shininess: 60,
    transparent: true,
    opacity:   0.88,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;
  scene.add(mesh);
  SculptState.previewMesh = mesh;
}

// ── Commit sculpt to main graph ──────────────────────────────────────────────
function commitSculptedShape() {
  const shape = SCULPT_SHAPES.find(s => s.id === SculptState.activeShapeId);
  const expr  = shape.graphExpr(SculptState.params);

  // Clear existing and add the sculpted shape
  // (or just add it without clearing — let user decide via existing remove buttons)
  addGraph(expr);

  // After brief delay, run analysis
  setTimeout(() => runAnalysis(), 400);

  closeSculptor();
}

// ── DOM wiring ───────────────────────────────────────────────────────────────
function initSculptUI() {
  document.getElementById('btn-open-sculptor').addEventListener('click', openSculptor);
  document.getElementById('btn-sculpt-close').addEventListener('click', closeSculptor);
  document.getElementById('btn-sculpt-add').addEventListener('click', commitSculptedShape);

  // Init default params on startup
  SCULPT_SHAPES.forEach(s => initSculptDefaults(s.id));
}
