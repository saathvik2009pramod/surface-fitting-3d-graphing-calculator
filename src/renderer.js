/* renderer.js — Three.js scene, camera, lights, axes, grid, render loop */

function initThree() {
  const canvas = document.getElementById('three-canvas');
  const wrap   = document.getElementById('canvas-wrap');

  State.camTarget = new THREE.Vector3(0, 0, 0);

  State.renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, preserveDrawingBuffer: true
  });
  State.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  State.scene = new THREE.Scene();

  const { clientWidth: w, clientHeight: h } = wrap;
  State.camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 100000);
  updateCameraPosition();

  // Lights
  State.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.75);
  d1.position.set(10, 20, 10);
  State.scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x9999cc, 0.25);
  d2.position.set(-10, -5, -10);
  State.scene.add(d2);

  // Infinite axes — rendered as a single LineSegments group
  State.axesGroup = buildInfiniteAxes();
  State.scene.add(State.axesGroup);

  // Infinite grid — large plane with a grid pattern via shader material
  State.gridHelper = buildInfiniteGrid();
  State.scene.add(State.gridHelper);

  // Resize observer
  new ResizeObserver(onResize).observe(wrap);
  onResize();

  renderLoop();
}

function buildInfiniteAxes() {
  const group = new THREE.Group();
  const FAR = 50000;

  const axisData = [
    { points: [new THREE.Vector3(-FAR, 0, 0), new THREE.Vector3(FAR, 0, 0)], color: 0xcc4444 },
    { points: [new THREE.Vector3(0, -FAR, 0), new THREE.Vector3(0, FAR, 0)], color: 0x44aa55 },
    { points: [new THREE.Vector3(0, 0, -FAR), new THREE.Vector3(0, 0, FAR)], color: 0x4466cc },
  ];

  axisData.forEach(({ points, color }) => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 1.5 });
    group.add(new THREE.Line(geo, mat));
  });

  return group;
}

function buildInfiniteGrid() {
  // Large grid plane — big enough to appear infinite at any zoom
  const SIZE = 100000;
  const DIVISIONS = 500; // gives 200-unit grid spacing

  // Use GridHelper but huge
  const grid = new THREE.GridHelper(SIZE, DIVISIONS, 0xcccccc, 0xe0e0e0);
  grid.position.y = -0.01;

  // Fade grid lines far from centre using fog
  State.scene.fog = new THREE.FogExp2(0xffffff, 0.00015);

  return grid;
}

function onResize() {
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth, h = wrap.clientHeight;
  State.renderer.setSize(w, h, false);
  State.camera.aspect = w / h;
  State.camera.updateProjectionMatrix();
}

function updateCameraPosition() {
  const { camRadius, camTheta, camPhi, camTarget, camera } = State;
  camera.position.set(
    camTarget.x + camRadius * Math.sin(camPhi) * Math.cos(camTheta),
    camTarget.y + camRadius * Math.cos(camPhi),
    camTarget.z + camRadius * Math.sin(camPhi) * Math.sin(camTheta)
  );
  camera.lookAt(camTarget);
}

function getBgColor() {
  // Always white background
  return 0xffffff;
}

function renderLoop() {
  requestAnimationFrame(renderLoop);
  if (document.getElementById('autoRotate').checked) {
    State.camTheta += 0.004;
    updateCameraPosition();
  }
  State.renderer.setClearColor(getBgColor(), 1);
  State.renderer.render(State.scene, State.camera);
}
