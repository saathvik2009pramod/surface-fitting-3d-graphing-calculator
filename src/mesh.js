/* mesh.js — Builds Three.js BufferGeometry from f(x,y) expressions */

function buildMesh(id) {
  const g = State.graphs.find(g => g.id === id);
  if (!g) return;
  const errEl = document.getElementById(`err-${id}`);

  if (!g.expr.trim()) {
    removeMesh(id);
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
    return;
  }

  let compiled;
  try {
    compiled = math.compile(g.expr);
    const test = compiled.evaluate({ x: 0, y: 0 });
    if (typeof test !== 'number') throw new Error('Must return a number');
  } catch (e) {
    if (errEl) { errEl.textContent = e.message; errEl.classList.add('visible'); }
    return;
  }
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
  g.compiled = compiled;

  const xR  = parseFloat(document.getElementById('xRange').value);
  const yR  = parseFloat(document.getElementById('yRange').value);
  const seg = parseInt(document.getElementById('resolution').value);
  const dx  = (2 * xR) / seg;
  const dy  = (2 * yR) / seg;

  // Build Z grid
  const zGrid = [];
  for (let i = 0; i <= seg; i++) {
    zGrid.push([]);
    for (let j = 0; j <= seg; j++) {
      const x = -xR + i * dx;
      const y = -yR + j * dy;
      let z;
      try {
        z = compiled.evaluate({ x, y });
        if (!isFinite(z) || isNaN(z)) z = 0;
        z = Math.max(-25, Math.min(25, z));
      } catch { z = 0; }
      zGrid[i].push(z);
    }
  }

  const positions = [], normals = [], indices = [];

  for (let i = 0; i <= seg; i++) {
    for (let j = 0; j <= seg; j++) {
      const x = -xR + i * dx;
      const y = -yR + j * dy;
      const z = zGrid[i][j];
      positions.push(x, z, y); // Three.js Y-up

      // Normals via central differences
      const zl = i > 0   ? zGrid[i-1][j] : z;
      const zr = i < seg ? zGrid[i+1][j] : z;
      const zb = j > 0   ? zGrid[i][j-1] : z;
      const zf = j < seg ? zGrid[i][j+1] : z;
      const nx = -(zr - zl) / (2 * dx);
      const nz = -(zf - zb) / (2 * dy);
      const ny = 1;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      normals.push(nx/len, ny/len, nz/len);
    }
  }

  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + 1;
      const c = (i + 1) * (seg + 1) + j;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setIndex(indices);

  const opacity   = parseFloat(document.getElementById('opacity').value);
  const wireframe = document.getElementById('wireframe').checked;
  const hexColor  = parseInt(g.color.replace('#', ''), 16);

  const mat = new THREE.MeshPhongMaterial({
    color: hexColor, emissive: hexColor, emissiveIntensity: 0.06,
    shininess: 70, opacity, transparent: opacity < 1,
    side: THREE.DoubleSide, wireframe,
  });

  removeMesh(id);
  const mesh = new THREE.Mesh(geo, mat);
  State.graphMeshes[id] = mesh;
  State.scene.add(mesh);
}

function removeMesh(id) {
  if (State.graphMeshes[id]) {
    State.scene.remove(State.graphMeshes[id]);
    State.graphMeshes[id].geometry.dispose();
    State.graphMeshes[id].material.dispose();
    delete State.graphMeshes[id];
  }
}

function rebuildAll() {
  State.graphs.forEach(g => buildMesh(g.id));
}

function scheduleRebuild(id, delay = 320) {
  clearTimeout(State.rebuildTimer);
  State.rebuildTimer = setTimeout(() => buildMesh(id), delay);
}

function scheduleRebuildAll(delay = 400) {
  clearTimeout(State.rebuildTimer);
  State.rebuildTimer = setTimeout(rebuildAll, delay);
}
