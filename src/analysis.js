/* analysis.js — Surface analysis: stats, graph-graph intersections, axis intersections */

function runAnalysis() {
  const panel   = document.getElementById('analysis-panel');
  const content = document.getElementById('analysis-content');
  const list    = document.getElementById('intersection-list');

  if (State.graphs.length === 0) {
    panel.classList.remove('visible');
    list.innerHTML = '<div class="result-empty">No functions to analyse.</div>';
    return;
  }

  const xR  = parseFloat(document.getElementById('xRange').value);
  const yR  = parseFloat(document.getElementById('yRange').value);
  const seg = 100;
  const dx  = (2 * xR) / seg;
  const dy  = (2 * yR) / seg;
  const compiled = State.graphs.filter(g => g.compiled);

  // ── Per-graph stats ──────────────────────────────────────────────────────
  const stats = compiled.map(g => {
    let zMin = Infinity, zMax = -Infinity, zSum = 0, count = 0, surfaceArea = 0;
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j <= seg; j++) {
        const x = -xR + i * dx, y = -yR + j * dy;
        let z = 0;
        try { z = g.compiled.evaluate({ x, y }); } catch {}
        if (!isFinite(z) || isNaN(z)) z = 0;
        if (z < zMin) zMin = z; if (z > zMax) zMax = z;
        zSum += z; count++;
        if (i < seg && j < seg) {
          let z1 = 0, z2 = 0;
          try { z1 = g.compiled.evaluate({ x: x + dx, y }); } catch {}
          try { z2 = g.compiled.evaluate({ x, y: y + dy }); } catch {}
          if (!isFinite(z1)) z1 = z; if (!isFinite(z2)) z2 = z;
          const nx = -(z1 - z), nz = -(z2 - z), ny = 1;
          const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
          surfaceArea += dx * dy * len;
        }
      }
    }
    return {
      expr: g.expr, color: g.color,
      zMin: zMin.toFixed(4), zMax: zMax.toFixed(4),
      zMean: (zSum / count).toFixed(4),
      surfaceArea: surfaceArea.toFixed(3),
    };
  });

  // ── Graph-graph intersections ────────────────────────────────────────────
  let graphIntersections = [];
  if (compiled.length >= 2) {
    const thr = Math.max(dx, dy) * 0.9;
    for (let a = 0; a < compiled.length - 1; a++) {
      for (let b = a + 1; b < compiled.length; b++) {
        const g1 = compiled[a], g2 = compiled[b];
        const seen = new Set();
        for (let i = 0; i <= seg; i++) {
          for (let j = 0; j <= seg; j++) {
            const x = -xR + i * dx, y = -yR + j * dy;
            let z1 = 0, z2 = 0;
            try { z1 = g1.compiled.evaluate({ x, y }); } catch {}
            try { z2 = g2.compiled.evaluate({ x, y }); } catch {}
            if (!isFinite(z1)) z1 = 0; if (!isFinite(z2)) z2 = 0;
            if (Math.abs(z1 - z2) < thr) {
              const key = `${Math.round(x)},${Math.round(y)}`;
              if (!seen.has(key)) {
                seen.add(key);
                graphIntersections.push({ x: x.toFixed(2), y: y.toFixed(2), z: ((z1+z2)/2).toFixed(2), label: `f${a+1} ∩ f${b+1}` });
              }
            }
          }
        }
      }
    }
    graphIntersections = graphIntersections.slice(0, 24);
  }

  // ── Axis intersections ───────────────────────────────────────────────────
  let axisIntersections = [];
  const axisThr = Math.max(dx, dy) * 0.7;

  compiled.forEach((g, gi) => {
    const seenX = new Set(), seenY = new Set(), seenZ = new Set();

    // f ∩ XZ-plane (y=0 strip) → "X-axis crossings"
    for (let i = 0; i <= seg; i++) {
      const x = -xR + i * dx;
      let z = 0; try { z = g.compiled.evaluate({ x, y: 0 }); } catch {}
      if (!isFinite(z) || isNaN(z)) continue;
      if (Math.abs(z) < axisThr) {
        const key = `${Math.round(x*2)}`;
        if (!seenX.has(key)) { seenX.add(key); axisIntersections.push({ x: x.toFixed(2), y: '0.00', z: z.toFixed(2), label: `f${gi+1} ∩ X-axis` }); }
      }
    }

    // f ∩ YZ-plane (x=0 strip) → "Y-axis crossings"
    for (let j = 0; j <= seg; j++) {
      const y = -yR + j * dy;
      let z = 0; try { z = g.compiled.evaluate({ x: 0, y }); } catch {}
      if (!isFinite(z) || isNaN(z)) continue;
      if (Math.abs(z) < axisThr) {
        const key = `${Math.round(y*2)}`;
        if (!seenY.has(key)) { seenY.add(key); axisIntersections.push({ x: '0.00', y: y.toFixed(2), z: z.toFixed(2), label: `f${gi+1} ∩ Y-axis` }); }
      }
    }

    // f ∩ Z=0 plane (zero surface)
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j <= seg; j++) {
        const x = -xR + i * dx, y = -yR + j * dy;
        let z = 0; try { z = g.compiled.evaluate({ x, y }); } catch {}
        if (!isFinite(z) || isNaN(z)) continue;
        if (Math.abs(z) < axisThr * 0.6) {
          const key = `${Math.round(x)},${Math.round(y)}`;
          if (!seenZ.has(key)) { seenZ.add(key); axisIntersections.push({ x: x.toFixed(2), y: y.toFixed(2), z: '0.00', label: `f${gi+1} ∩ Z=0` }); }
        }
      }
    }
  });

  axisIntersections = axisIntersections.slice(0, 40);

  const allIntersections = [
    ...graphIntersections.map(p => ({ ...p, type: 'graph' })),
    ...axisIntersections.map(p => ({ ...p, type: 'axis' })),
  ];

  // ── Render analysis panel ────────────────────────────────────────────────
  panel.classList.add('visible');
  document.getElementById('analysis-title').textContent =
    stats.length === 1 ? `f(x,y) = ${stats[0].expr}` : 'Analysis Results';

  content.innerHTML = stats.map(s => `
    <div style="margin-bottom:0.5rem;">
      ${stats.length > 1 ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
        <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted);">${s.expr}</span>
      </div>` : ''}
      <div class="analysis-row"><span class="analysis-label">Z min</span><span class="analysis-value">${s.zMin}</span></div>
      <div class="analysis-row"><span class="analysis-label">Z max</span><span class="analysis-value">${s.zMax}</span></div>
      <div class="analysis-row"><span class="analysis-label">Z mean</span><span class="analysis-value">${s.zMean}</span></div>
      <div class="analysis-row"><span class="analysis-label">Surface area</span><span class="analysis-value">${s.surfaceArea} u²</span></div>
    </div>
  `).join('<hr style="border:none;border-top:1px solid var(--color-divider);margin:0.4rem 0;"/>');

  // ── Render intersection list ─────────────────────────────────────────────
  if (allIntersections.length === 0) {
    list.innerHTML = '<div class="result-empty">No intersections found in range.</div>';
  } else {
    const grouped = {};
    allIntersections.forEach(pt => {
      if (!grouped[pt.label]) grouped[pt.label] = [];
      grouped[pt.label].push(pt);
    });
    list.innerHTML = Object.entries(grouped).map(([label, pts]) => `
      <div style="margin-bottom:6px;">
        <div style="font-size:var(--text-xs);font-weight:700;color:#000;margin-bottom:3px;">${label} — ${pts.length} point${pts.length!==1?'s':''}</div>
        ${pts.slice(0, 8).map((pt, i) => `
          <div class="intersection-item">
            <span class="int-label">P${i+1}</span>
            <span>x=${pt.x}</span><span>y=${pt.y}</span><span>z=${pt.z}</span>
          </div>
        `).join('')}
        ${pts.length > 8 ? `<div class="result-empty">+${pts.length-8} more…</div>` : ''}
      </div>
    `).join('');
  }

  // ── Visualise markers ────────────────────────────────────────────────────
  clearIntersectionMarkers();
  allIntersections.slice(0, 80).forEach(pt => {
    const isAxis = pt.type === 'axis';
    const geo = new THREE.SphereGeometry(isAxis ? 0.07 : 0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: isAxis ? 0xff3333 : 0xffd700 });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(parseFloat(pt.x), parseFloat(pt.z), parseFloat(pt.y));
    State.scene.add(sphere);
    State.intersectionMarkers.push(sphere);
  });
}

function clearAnalysis() {
  document.getElementById('analysis-panel').classList.remove('visible');
  document.getElementById('intersection-list').innerHTML = '';
  clearIntersectionMarkers();
}

function clearIntersectionMarkers() {
  State.intersectionMarkers.forEach(m => {
    State.scene.remove(m);
    m.geometry.dispose();
    m.material.dispose();
  });
  State.intersectionMarkers = [];
}
