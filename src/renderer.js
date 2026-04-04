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
  State.camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 500);
  updateCameraPosition();

  // Lights
  State.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.75);
  d1.position.set(10, 20, 10);
  State.scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x9999cc, 0.25);
  d2.position.set(-10, -5, -10);
  State.scene.add(d2);

  // Axes
  State.axesGroup = new THREE.Group();
  const axisData = [
    { dir: new THREE.Vector3(12, 0, 0),  color: 0xe06060 },
    { dir: new THREE.Vector3(0, 12, 0),  color: 0x50c070 },
    { dir: new THREE.Vector3(0, 0, 12),  color: 0x5080e0 },
  ];
  axisData.forEach(({ dir, color }) => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir]);
    const mat = new THREE.LineBasicMaterial({ color });
    State.axesGroup.add(new THREE.Line(geo, mat));
  });
  State.scene.add(State.axesGroup);

  // Grid
  State.gridHelper = new THREE.GridHelper(18, 18, 0x2a2a28, 0x222220);
  State.gridHelper.position.y = -0.01;
  State.scene.add(State.gridHelper);

  // Resize observer
  new ResizeObserver(onResize).observe(wrap);
  onResize();

  renderLoop();
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
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 0xf4f3ef : 0x0f0f0e;
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
