/* controls.js — Mouse and touch orbit/zoom/pan + camera helpers */

let _dragging  = false;
let _lastMouse = { x: 0, y: 0 };
let _button    = 0;
let _touchDist = null;

function initControls() {
  const canvas = document.getElementById('three-canvas');
  canvas.addEventListener('mousedown',  onMouseDown);
  window.addEventListener('mousemove',  onMouseMove);
  window.addEventListener('mouseup',    () => { _dragging = false; });
  canvas.addEventListener('wheel',      onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
  canvas.addEventListener('touchend',   () => { _dragging = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  document.getElementById('btn-autoscale').addEventListener('click', autoScaleZoom);
  document.getElementById('btn-reset').addEventListener('click', resetCamera);
  document.getElementById('btn-topview').addEventListener('click', setTopView);
  document.getElementById('btn-screenshot').addEventListener('click', takeScreenshot);
  document.getElementById('mobile-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

function onMouseDown(e) {
  _dragging  = true;
  _button    = e.button;
  _lastMouse = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
  if (!_dragging) return;
  const dx = e.clientX - _lastMouse.x;
  const dy = e.clientY - _lastMouse.y;
  if (_button === 2) {
    const right = new THREE.Vector3();
    right.crossVectors(
      State.camera.getWorldDirection(new THREE.Vector3()),
      State.camera.up
    ).normalize();
    State.camTarget.addScaledVector(right, -dx * 0.014);
    State.camTarget.addScaledVector(State.camera.up, dy * 0.014);
  } else {
    State.camTheta -= dx * 0.007;
    State.camPhi = Math.max(0.05, Math.min(Math.PI - 0.05, State.camPhi + dy * 0.007));
  }
  updateCameraPosition();
  _lastMouse = { x: e.clientX, y: e.clientY };
}

function onWheel(e) {
  e.preventDefault();
  State.camRadius = Math.max(3, Math.min(60000, State.camRadius + e.deltaY * 0.025 * (State.camRadius / 20)));
  updateCameraPosition();
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    _dragging  = true;
    _lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    _touchDist = null;
  } else if (e.touches.length === 2) {
    _touchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1 && _dragging) {
    const dx = e.touches[0].clientX - _lastMouse.x;
    const dy = e.touches[0].clientY - _lastMouse.y;
    State.camTheta -= dx * 0.007;
    State.camPhi = Math.max(0.05, Math.min(Math.PI - 0.05, State.camPhi + dy * 0.007));
    updateCameraPosition();
    _lastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2 && _touchDist !== null) {
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    State.camRadius = Math.max(3, Math.min(60000, State.camRadius * (_touchDist / d)));
    _touchDist = d;
    updateCameraPosition();
  }
}

function autoScaleZoom() {
  if (Object.keys(State.graphMeshes).length === 0) { resetCamera(); return; }
  const box = new THREE.Box3();
  Object.values(State.graphMeshes).forEach(mesh => {
    mesh.geometry.computeBoundingBox();
    const mb = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    box.union(mb);
  });
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = (State.camera.fov * Math.PI) / 180;
  const fitRadius = (maxDim / 2) / Math.tan(fovRad / 2) * 1.6;
  State.camTarget.copy(center);
  State.camRadius = Math.max(5, fitRadius);
  updateCameraPosition();
}

function resetCamera() {
  State.camTheta  = Math.PI / 4;
  State.camPhi    = Math.PI / 3.5;
  State.camRadius = 20;
  State.camTarget.set(0, 0, 0);
  updateCameraPosition();
}

function setTopView() {
  State.camTheta = -Math.PI / 2;
  State.camPhi   = 0.07;
  updateCameraPosition();
}

function takeScreenshot() {
  State.renderer.render(State.scene, State.camera);
  const a = document.createElement('a');
  a.href = State.renderer.domElement.toDataURL('image/png');
  a.download = '3dgraph.png';
  a.click();
}
