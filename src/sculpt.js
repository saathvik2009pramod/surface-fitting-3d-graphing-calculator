/* sculpt.js — Shape Sculptor: interactive 3D shape builder */

const SCULPT_SHAPES = [
  {
    id: 'sphere',
    label: 'Sphere',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="4"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
    params: [
      { id: 'rx',    label: 'Radius X',      min: 0.5, max: 8,  step: 0.1, default: 3 },
      { id: 'ry',    label: 'Radius Y',      min: 0.5, max: 8,  step: 0.1, default: 3 },
      { id: 'rz',    label: 'Radius Z',      min: 0.5, max: 8,  step: 0.1, default: 3 },
      { id: 'pinch', label: 'Pinch (poles)', min: 0,   max: 2,  step: 0.05, default: 0 },
      { id: 'twist', label: 'Twist',         min: 0,   max: 3,  step: 0.05, default: 0 },
      { id: 'bump',  label: 'Surface Bumps', min: 0,   max: 1,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) => {
      const base = `${p.rz.toFixed(2)} * sqrt(max(0, 1 - (x/${p.rx.toFixed(2)})^2 - (y/${p.ry.toFixed(2)})^2))`;
      if (p.bump > 0.01) return `${base} + ${p.bump.toFixed(2)} * sin(${(3).toFixed(1)}*x) * cos(${(3).toFixed(1)}*y)`;
      return base;
    },
    equationTeX: (p) => `(x/${p.rx.toFixed(2)})² + (y/${p.ry.toFixed(2)})² + (z/${p.rz.toFixed(2)})² = 1` +
      (p.pinch > 0.01 ? `  [pinch=${p.pinch.toFixed(2)}]` : '') +
      (p.twist > 0.01 ? `  [twist=${p.twist.toFixed(2)}]` : '') +
      (p.bump  > 0.01 ? `  [bump=${p.bump.toFixed(2)}]`   : ''),
    previewMesh: (p, THREE) => {
      const geo = new THREE.SphereGeometry(1, 64, 48);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        // scale
        x *= p.rx; y *= p.rz; z *= p.ry;
        // pinch poles
        if (p.pinch > 0.01) {
          const t = Math.abs(y / (p.rz || 1));
          x *= (1 - p.pinch * t * t);
          z *= (1 - p.pinch * t * t);
        }
        // twist
        if (p.twist > 0.01) {
          const angle = p.twist * (y / (p.rz || 1));
          const nx = x * Math.cos(angle) - z * Math.sin(angle);
          const nz = x * Math.sin(angle) + z * Math.cos(angle);
          x = nx; z = nz;
        }
        // bump
        if (p.bump > 0.01) {
          const bumpAmt = p.bump * Math.sin(3 * x) * Math.cos(3 * z);
          const len = Math.sqrt(x*x + y*y + z*z) || 1;
          x += bumpAmt * x/len; y += bumpAmt * y/len; z += bumpAmt * z/len;
        }
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'cube',
    label: 'Cube / Box',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="14" height="14" rx="1"/><polyline points="3,7 10,2 21,2 21,16 17,21"/><line x1="10" y1="2" x2="10" y2="7"/><line x1="21" y1="2" x2="17" y2="7"/></svg>`,
    params: [
      { id: 'w',      label: 'Width X',        min: 0.5, max: 8,  step: 0.1, default: 3 },
      { id: 'd',      label: 'Depth Y',         min: 0.5, max: 8,  step: 0.1, default: 3 },
      { id: 'h',      label: 'Height Z',        min: 0.5, max: 8,  step: 0.1, default: 3 },
      { id: 'bevel',  label: 'Edge Roundness',  min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'taper',  label: 'Taper (top)',     min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'shear',  label: 'Shear / Lean',    min: -1,  max: 1,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) => {
      const W = (p.w/2).toFixed(2), D = (p.d/2).toFixed(2);
      return `(abs(x) <= ${W} and abs(y) <= ${D}) * ${p.h.toFixed(2)}`;
    },
    equationTeX: (p) =>
      `|x|≤${(p.w/2).toFixed(2)}, |y|≤${(p.d/2).toFixed(2)}, |z|≤${(p.h/2).toFixed(2)}` +
      (p.taper > 0.01 ? `  [taper=${p.taper.toFixed(2)}]` : '') +
      (p.shear !== 0   ? `  [shear=${p.shear.toFixed(2)}]` : ''),
    previewMesh: (p, THREE) => {
      const geo = new THREE.BoxGeometry(p.w, p.h, p.d, 16, 16, 16);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        // taper: shrink x/z as y increases
        if (p.taper > 0.01) {
          const t = (y / (p.h / 2) + 1) / 2; // 0 at bottom, 1 at top
          const scale = 1 - p.taper * t;
          x *= scale; z *= scale;
        }
        // shear: lean in x
        if (Math.abs(p.shear) > 0.01) {
          x += p.shear * (y / (p.h / 2)) * (p.w / 2);
        }
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'cylinder',
    label: 'Cylinder',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><ellipse cx="12" cy="19" rx="8" ry="3"/><line x1="4" y1="5" x2="4" y2="19"/><line x1="20" y1="5" x2="20" y2="19"/></svg>`,
    params: [
      { id: 'rx',    label: 'Radius X',       min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'ry',    label: 'Radius Y',       min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'h',     label: 'Height Z',       min: 0.5, max: 10, step: 0.1,  default: 4 },
      { id: 'taper', label: 'Taper (top)',    min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'twist', label: 'Twist',          min: 0,   max: 5,  step: 0.1,  default: 0 },
      { id: 'wave',  label: 'Wavy Profile',   min: 0,   max: 1,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) => {
      const RX = p.rx.toFixed(2), RY = p.ry.toFixed(2), H = p.h.toFixed(2);
      return `((x/${RX})^2 + (y/${RY})^2 <= 1) * ${H}`;
    },
    equationTeX: (p) =>
      `(x/${p.rx.toFixed(2)})² + (y/${p.ry.toFixed(2)})² ≤ 1,  0 ≤ z ≤ ${p.h.toFixed(2)}` +
      (p.taper > 0.01 ? `  [taper=${p.taper.toFixed(2)}]` : '') +
      (p.twist > 0.01 ? `  [twist=${p.twist.toFixed(2)}]` : '') +
      (p.wave  > 0.01 ? `  [wave=${p.wave.toFixed(2)}]`   : ''),
    previewMesh: (p, THREE) => {
      const geo = new THREE.CylinderGeometry(1, 1, p.h, 64, 32);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const t = (y / (p.h / 2) + 1) / 2; // 0=bottom 1=top
        // taper
        const tScale = 1 - p.taper * t;
        // wave: oscillate radius with height
        const waveR = 1 + (p.wave > 0.01 ? p.wave * Math.sin(Math.PI * 4 * t) : 0);
        const r = tScale * waveR;
        x *= r; z *= r;
        // scale ellipse
        x *= p.rx; z *= p.ry;
        // twist
        if (p.twist > 0.01) {
          const angle = p.twist * t;
          const nx = x * Math.cos(angle) - z * Math.sin(angle);
          const nz = x * Math.sin(angle) + z * Math.cos(angle);
          x = nx; z = nz;
        }
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'cone',
    label: 'Cone',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="19" rx="8" ry="3"/><line x1="4" y1="19" x2="12" y2="3"/><line x1="20" y1="19" x2="12" y2="3"/></svg>`,
    params: [
      { id: 'rx',    label: 'Base Radius X',  min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'ry',    label: 'Base Radius Y',  min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'h',     label: 'Height',         min: 0.5, max: 10, step: 0.1,  default: 5 },
      { id: 'curve', label: 'Profile Curve',  min: -1,  max: 1,  step: 0.05, default: 0 },
      { id: 'twist', label: 'Twist',          min: 0,   max: 5,  step: 0.1,  default: 0 },
      { id: 'sides', label: 'Facets (0=round)',min: 0,  max: 1,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) => {
      const H = p.h.toFixed(2), RX = p.rx.toFixed(2), RY = p.ry.toFixed(2);
      return `${H} * (1 - sqrt((x/${RX})^2 + (y/${RY})^2)) * ((x/${RX})^2 + (y/${RY})^2 <= 1)`;
    },
    equationTeX: (p) =>
      `z = ${p.h.toFixed(2)}(1 − √((x/${p.rx.toFixed(2)})²+(y/${p.ry.toFixed(2)})²))` +
      (p.curve !== 0   ? `  [curve=${p.curve.toFixed(2)}]` : '') +
      (p.twist > 0.01  ? `  [twist=${p.twist.toFixed(2)}]` : ''),
    previewMesh: (p, THREE) => {
      const segs = 64;
      const geo = new THREE.ConeGeometry(1, p.h, segs, 32);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const t = (y / (p.h / 2) + 1) / 2; // 0=bottom 1=top
        // profile curve: convex/concave sides
        const r = 1 - t + (p.curve !== 0 ? p.curve * 4 * t * (1 - t) : 0);
        x *= Math.max(0, r) * p.rx;
        z *= Math.max(0, r) * p.ry;
        // twist
        if (p.twist > 0.01) {
          const angle = p.twist * t;
          const nx = x * Math.cos(angle) - z * Math.sin(angle);
          const nz = x * Math.sin(angle) + z * Math.cos(angle);
          x = nx; z = nz;
        }
        // facets: snap angle to nearest N
        if (p.sides > 0.05) {
          const numFacets = Math.round(3 + p.sides * 9);
          const angle2 = Math.atan2(z, x);
          const snapped = Math.round(angle2 / (2 * Math.PI / numFacets)) * (2 * Math.PI / numFacets);
          const rLen = Math.sqrt(x*x + z*z);
          const blend = p.sides;
          x = x * (1 - blend) + rLen * Math.cos(snapped) * blend;
          z = z * (1 - blend) + rLen * Math.sin(snapped) * blend;
        }
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'pyramid',
    label: 'Pyramid',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12,3 22,20 2,20"/><line x1="12" y1="3" x2="17" y2="20"/></svg>`,
    params: [
      { id: 'w',     label: 'Base Width X',   min: 0.5, max: 8,  step: 0.1,  default: 4 },
      { id: 'd',     label: 'Base Depth Y',   min: 0.5, max: 8,  step: 0.1,  default: 4 },
      { id: 'h',     label: 'Height Z',       min: 0.5, max: 10, step: 0.1,  default: 5 },
      { id: 'offset',label: 'Apex Offset X',  min: -3,  max: 3,  step: 0.1,  default: 0 },
      { id: 'steps', label: 'Stepped Levels', min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'twist', label: 'Twist',          min: 0,   max: 3,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) => {
      const W = (p.w/2).toFixed(2), D = (p.d/2).toFixed(2), H = p.h.toFixed(2);
      return `${H} * (1 - max(abs(x)/${W}, abs(y)/${D})) * (max(abs(x)/${W}, abs(y)/${D}) <= 1)`;
    },
    equationTeX: (p) =>
      `z = ${p.h.toFixed(2)}·(1−max(|x|/${(p.w/2).toFixed(2)}, |y|/${(p.d/2).toFixed(2)}))` +
      (Math.abs(p.offset) > 0.05 ? `  [apex offset=${p.offset.toFixed(2)}]` : '') +
      (p.steps  > 0.05 ? `  [steps=${p.steps.toFixed(2)}]`  : '') +
      (p.twist  > 0.05 ? `  [twist=${p.twist.toFixed(2)}]`  : ''),
    previewMesh: (p, THREE) => {
      const W = p.w/2, D = p.d/2, H = p.h;
      const segs = 32;
      // Build as displaced cone-like mesh for smooth deformations
      const geo = new THREE.ConeGeometry(1, H, 4, segs);
      // snap to square base
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const t = (y / (H / 2) + 1) / 2;
        const r = 1 - t;
        // square cross-section: scale by W,D
        const angle = Math.atan2(z, x);
        // squircle blend toward square
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const squareR = Math.min(1 / (Math.abs(cosA) || 0.001), 1 / (Math.abs(sinA) || 0.001));
        const bx = r * W * cosA * squareR;
        const bz = r * D * sinA * squareR;
        x = bx; z = bz;
        // apex offset
        if (Math.abs(p.offset) > 0.01) x += p.offset * t;
        // steps
        if (p.steps > 0.05) {
          const numSteps = Math.max(2, Math.round(p.steps * 6));
          const stepped = Math.floor(t * numSteps) / numSteps;
          const blended = t * (1 - p.steps) + stepped * p.steps;
          const rescale = (1 - blended) / (Math.max(0.001, 1 - t));
          x *= rescale; z *= rescale;
        }
        // twist
        if (p.twist > 0.01) {
          const ang = p.twist * t;
          const nx = x * Math.cos(ang) - z * Math.sin(ang);
          const nz = x * Math.sin(ang) + z * Math.cos(ang);
          x = nx; z = nz;
        }
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'torus',
    label: 'Torus',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="5" ry="2"/></svg>`,
    params: [
      { id: 'R',      label: 'Major Radius',   min: 1,   max: 8,  step: 0.1,  default: 4 },
      { id: 'r',      label: 'Tube Radius',    min: 0.2, max: 4,  step: 0.1,  default: 1.2 },
      { id: 'squeeze',label: 'Squeeze',        min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'bump',   label: 'Tube Bumps',     min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'twist',  label: 'Tube Twist',     min: 0,   max: 5,  step: 0.1,  default: 0 },
      { id: 'knot',   label: 'Knot (p)',       min: 1,   max: 4,  step: 1,    default: 1 },
    ],
    graphExpr: (p) => {
      const R = p.R.toFixed(2), r = p.r.toFixed(2);
      return `sqrt(max(0, ${r}^2 - (sqrt(x^2 + y^2) - ${R})^2))`;
    },
    equationTeX: (p) =>
      `(√(x²+y²)−${p.R.toFixed(2)})²+z²=${p.r.toFixed(2)}²` +
      (p.squeeze > 0.01 ? `  [squeeze=${p.squeeze.toFixed(2)}]` : '') +
      (p.bump    > 0.01 ? `  [bump=${p.bump.toFixed(2)}]`       : '') +
      (p.knot    > 1    ? `  [knot p=${p.knot.toFixed(0)}]`     : ''),
    previewMesh: (p, THREE) => {
      const tubeSegs = 128, radSegs = 32;
      const knotP = Math.round(p.knot);
      // Torus knot path if knot>1, else standard torus
      if (knotP > 1) {
        const geo = new THREE.TorusKnotGeometry(p.R, p.r, tubeSegs, radSegs, knotP, 2);
        return geo;
      }
      const geo = new THREE.TorusGeometry(p.R, p.r, radSegs, tubeSegs);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        // squeeze: flatten vertically
        if (p.squeeze > 0.01) y *= (1 - p.squeeze * 0.85);
        // bump tube
        if (p.bump > 0.01) {
          const theta = Math.atan2(z, x);
          const bumpAmt = p.bump * 0.4 * Math.sin(8 * theta);
          const rLen = Math.sqrt(x*x + z*z);
          if (rLen > 0) { x += bumpAmt * x/rLen; z += bumpAmt * z/rLen; }
        }
        pos.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'wave',
    label: 'Wave / Shell',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12 Q6 4 10 12 Q14 20 18 12 Q22 4 26 12"/><path d="M2 17 Q6 9 10 17 Q14 25 18 17"/></svg>`,
    params: [
      { id: 'amp',   label: 'Amplitude',      min: 0.1, max: 5,  step: 0.1,  default: 2 },
      { id: 'freqX', label: 'Frequency X',    min: 0.5, max: 6,  step: 0.1,  default: 2 },
      { id: 'freqY', label: 'Frequency Y',    min: 0.5, max: 6,  step: 0.1,  default: 2 },
      { id: 'phase', label: 'Phase Shift',    min: 0,   max: 6.3, step: 0.1, default: 0 },
      { id: 'decay', label: 'Radial Decay',   min: 0,   max: 1,  step: 0.05, default: 0 },
      { id: 'mode',  label: 'Mode (1=sin 2=ripple 3=shell)', min: 1, max: 3, step: 1, default: 1 },
    ],
    graphExpr: (p) => {
      const A = p.amp.toFixed(2), FX = p.freqX.toFixed(2), FY = p.freqY.toFixed(2), PH = p.phase.toFixed(2);
      if (Math.round(p.mode) === 2) return `${A} * sin(sqrt(x^2 + y^2) * ${FX} + ${PH})`;
      if (Math.round(p.mode) === 3) return `${A} * sin(${FX}*x + ${PH}) * e^(-0.1*(x^2+y^2))`;
      return `${A} * sin(${FX}*x + ${PH}) * cos(${FY}*y)`;
    },
    equationTeX: (p) => {
      if (Math.round(p.mode) === 2) return `z = ${p.amp.toFixed(2)}·sin(√(x²+y²)·${p.freqX.toFixed(2)})`;
      if (Math.round(p.mode) === 3) return `z = ${p.amp.toFixed(2)}·sin(${p.freqX.toFixed(2)}x)·e^(−0.1r²)  [shell]`;
      return `z = ${p.amp.toFixed(2)}·sin(${p.freqX.toFixed(2)}x)·cos(${p.freqY.toFixed(2)}y)`;
    },
    previewMesh: (p, THREE) => {
      const size = 8, segs = 80;
      const geo = new THREE.PlaneGeometry(size*2, size*2, segs, segs);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      const mode = Math.round(p.mode);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        let y = 0;
        const r = Math.sqrt(x*x + z*z);
        const decay = p.decay > 0.01 ? Math.exp(-p.decay * 0.08 * r * r) : 1;
        if (mode === 2) y = p.amp * Math.sin(r * p.freqX + p.phase) * decay;
        else if (mode === 3) y = p.amp * Math.sin(p.freqX * x + p.phase) * Math.exp(-0.04 * r * r) * decay;
        else y = p.amp * Math.sin(p.freqX * x + p.phase) * Math.cos(p.freqY * z) * decay;
        pos.setY(i, y);
      }
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'mobius',
    label: 'Möbius / Ribbon',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12 Q8 4 12 12 Q16 20 20 12"/><path d="M20 12 Q16 4 12 12 Q8 20 4 12"/></svg>`,
    params: [
      { id: 'R',     label: 'Ring Radius',     min: 1,   max: 8,  step: 0.1,  default: 4 },
      { id: 'w',     label: 'Strip Width',     min: 0.2, max: 4,  step: 0.1,  default: 1.5 },
      { id: 'turns', label: 'Half-Twists',     min: 1,   max: 6,  step: 1,    default: 1 },
      { id: 'thick', label: 'Thickness',       min: 0,   max: 1,  step: 0.05, default: 0.1 },
      { id: 'warp',  label: 'Warp',            min: 0,   max: 2,  step: 0.05, default: 0 },
      { id: 'ruffles',label:'Ruffles',         min: 0,   max: 1,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) =>
      `${p.R.toFixed(2)} * sin(x) + ${p.w.toFixed(2)} * cos(x/2) * cos(y)`,
    equationTeX: (p) =>
      `Möbius strip: R=${p.R.toFixed(2)}, width=${p.w.toFixed(2)}, twists=${Math.round(p.turns)}` +
      (p.warp    > 0.01 ? `  [warp=${p.warp.toFixed(2)}]`       : '') +
      (p.ruffles > 0.01 ? `  [ruffles=${p.ruffles.toFixed(2)}]` : ''),
    previewMesh: (p, THREE) => {
      const uSegs = 128, vSegs = 16;
      const positions = [], indices = [], normals = [];
      const halfTwists = Math.round(p.turns);
      for (let iu = 0; iu <= uSegs; iu++) {
        for (let iv = 0; iv <= vSegs; iv++) {
          const u = (iu / uSegs) * 2 * Math.PI;
          const v = (iv / vSegs - 0.5) * p.w;
          const twist = (halfTwists * u) / 2;
          // ruffle
          const ruf = p.ruffles > 0.01 ? p.ruffles * 0.5 * Math.sin(8 * u) : 0;
          const vv = v + ruf;
          // warp ring
          const warp = p.warp > 0.01 ? p.warp * Math.sin(2 * u) : 0;
          const R2 = p.R + warp;
          const x = (R2 + vv * Math.cos(twist)) * Math.cos(u);
          const y = (R2 + vv * Math.cos(twist)) * Math.sin(u);
          const z = vv * Math.sin(twist) + p.thick * Math.cos(twist);
          positions.push(x, z, y); // swap y/z for Three.js coord
        }
      }
      for (let iu = 0; iu < uSegs; iu++) {
        for (let iv = 0; iv < vSegs; iv++) {
          const a = iu * (vSegs + 1) + iv;
          const b = a + vSegs + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    },
  },

  {
    id: 'superellipsoid',
    label: 'Super-shape',
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 Q20 3 21 12 Q20 21 12 21 Q4 21 3 12 Q4 3 12 3Z"/></svg>`,
    params: [
      { id: 'rx',   label: 'Scale X',       min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'ry',   label: 'Scale Y',       min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'rz',   label: 'Scale Z',       min: 0.5, max: 8,  step: 0.1,  default: 3 },
      { id: 'e1',   label: 'Roundness E-W', min: 0.1, max: 4,  step: 0.05, default: 1 },
      { id: 'e2',   label: 'Roundness N-S', min: 0.1, max: 4,  step: 0.05, default: 1 },
      { id: 'twist',label: 'Twist',         min: 0,   max: 3,  step: 0.05, default: 0 },
    ],
    graphExpr: (p) =>
      `${p.rz.toFixed(2)} * (1 - ((x/${p.rx.toFixed(2)})^2 + (y/${p.ry.toFixed(2)})^2)^${(p.e1/2).toFixed(2)})^${(1/p.e2).toFixed(2)}`,
    equationTeX: (p) =>
      `(x/${p.rx.toFixed(2)})^${(2/p.e1).toFixed(1)} + (y/${p.ry.toFixed(2)})^${(2/p.e1).toFixed(1)} + (z/${p.rz.toFixed(2)})^${(2/p.e2).toFixed(1)} = 1`,
    previewMesh: (p, THREE) => {
      // Superellipsoid parametric surface
      const uSegs = 64, vSegs = 48;
      const positions = [], indices = [];
      function sgn(x) { return x >= 0 ? 1 : -1; }
      function cpow(x, e) { return sgn(x) * Math.pow(Math.abs(x), e); }
      for (let iu = 0; iu <= uSegs; iu++) {
        for (let iv = 0; iv <= vSegs; iv++) {
          const u = -Math.PI / 2 + (iu / uSegs) * Math.PI;
          const v = -Math.PI + (iv / vSegs) * 2 * Math.PI;
          let x = p.rx * cpow(Math.cos(u), p.e1) * cpow(Math.cos(v), p.e1);
          let y = p.rz * cpow(Math.sin(u), p.e2);
          let z = p.ry * cpow(Math.cos(u), p.e1) * cpow(Math.sin(v), p.e1);
          // twist
          if (p.twist > 0.01) {
            const t = (y / (p.rz || 1) + 1) / 2;
            const ang = p.twist * t;
            const nx = x * Math.cos(ang) - z * Math.sin(ang);
            const nz = x * Math.sin(ang) + z * Math.cos(ang);
            x = nx; z = nz;
          }
          positions.push(x, y, z);
        }
      }
      for (let iu = 0; iu < uSegs; iu++) {
        for (let iv = 0; iv < vSegs; iv++) {
          const a = iu * (vSegs + 1) + iv;
          const b = a + vSegs + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    },
  },
];

// ── Sculptor state ──────────────────────────────────────────────────────────
const SculptState = {
  activeShapeId: 'sphere',
  params: {},
  previewRenderer: null,
  previewScene: null,
  previewCamera: null,
  previewMesh: null,
  isDragging: false,
  lastX: 0,
  lastY: 0,
  theta: 0.6,
  phi: 1.1,
  previewAF: null,
};

function initSculptDefaults(shapeId) {
  const shape = SCULPT_SHAPES.find(s => s.id === shapeId);
  if (!shape) return;
  shape.params.forEach(p => {
    SculptState.params[p.id] = p.default;
  });
}

// ── Open / close ─────────────────────────────────────────────────────────────
function openSculptor() {
  const overlay = document.getElementById('sculpt-overlay');
  overlay.classList.add('open');
  initSculptDefaults(SculptState.activeShapeId);
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

// ── Shape picker ──────────────────────────────────────────────────────────────
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

// ── Sliders ───────────────────────────────────────────────────────────────────
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
        <span class="sculpt-param-value" id="sv-${p.id}">${val.toFixed(2)}</span>
      </div>
      <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}" data-pid="${p.id}"/>
    `;
    container.appendChild(div);
    div.querySelector('input').addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      SculptState.params[p.id] = v;
      document.getElementById(`sv-${p.id}`).textContent = v.toFixed(2);
      renderEquationBox();
      updateSculptPreviewMesh();
    });
  });
}

// ── Equation box ──────────────────────────────────────────────────────────────
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

// ── Three.js preview ──────────────────────────────────────────────────────────
function initSculptPreview() {
  const canvas = document.getElementById('sculpt-canvas');
  if (SculptState.previewRenderer) {
    SculptState.previewRenderer.dispose();
  }
  if (SculptState.previewAF) {
    cancelAnimationFrame(SculptState.previewAF);
    SculptState.previewAF = null;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xf9f8f5);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.9); d1.position.set(8, 12, 8); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x88aaff, 0.3); d2.position.set(-8, -4, -8); scene.add(d2);

  const grid = new THREE.GridHelper(24, 24, 0xcccccc, 0xe8e8e8);
  grid.position.y = -5;
  scene.add(grid);

  const w = canvas.parentElement.clientWidth || 600;
  const h = canvas.parentElement.clientHeight || 500;
  const camera = new THREE.PerspectiveCamera(44, w / h, 0.01, 1000);
  camera.position.set(0, 5, 14);
  camera.lookAt(0, 0, 0);
  renderer.setSize(w, h, false);

  SculptState.previewRenderer = renderer;
  SculptState.previewScene    = scene;
  SculptState.previewCamera   = camera;

  // Mouse orbit
  canvas.addEventListener('mousedown', e => {
    SculptState.isDragging = true;
    SculptState.lastX = e.clientX;
    SculptState.lastY = e.clientY;
  });
  window.addEventListener('mousemove', e => {
    if (!SculptState.isDragging) return;
    SculptState.theta += (e.clientX - SculptState.lastX) * 0.01;
    SculptState.phi    = Math.max(0.15, Math.min(Math.PI - 0.15, SculptState.phi + (e.clientY - SculptState.lastY) * 0.01));
    SculptState.lastX  = e.clientX;
    SculptState.lastY  = e.clientY;
  });
  window.addEventListener('mouseup', () => { SculptState.isDragging = false; });

  new ResizeObserver(() => {
    const w2 = canvas.parentElement.clientWidth;
    const h2 = canvas.parentElement.clientHeight;
    if (!w2 || !h2) return;
    renderer.setSize(w2, h2, false);
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
  }).observe(canvas.parentElement);

  function loop() {
    SculptState.previewAF = requestAnimationFrame(loop);
    if (!SculptState.isDragging) SculptState.theta += 0.004;
    const R = 14;
    camera.position.set(
      R * Math.sin(SculptState.phi) * Math.cos(SculptState.theta),
      R * Math.cos(SculptState.phi),
      R * Math.sin(SculptState.phi) * Math.sin(SculptState.theta)
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();
}

function updateSculptPreviewMesh() {
  const scene = SculptState.previewScene;
  if (!scene) return;
  if (SculptState.previewMesh) {
    scene.remove(SculptState.previewMesh);
    SculptState.previewMesh.geometry.dispose();
    SculptState.previewMesh.material.dispose();
    SculptState.previewMesh = null;
  }
  const shape = SCULPT_SHAPES.find(s => s.id === SculptState.activeShapeId);
  const geo   = shape.previewMesh(SculptState.params, THREE);
  const mat   = new THREE.MeshPhongMaterial({
    color: 0x4f98a3, emissive: 0x1a3d40,
    specular: 0xffffff, shininess: 60,
    transparent: true, opacity: 0.88,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  SculptState.previewMesh = mesh;
}

// ── Commit sculpt to main graph ───────────────────────────────────────────────
function commitSculptedShape() {
  const shape = SCULPT_SHAPES.find(s => s.id === SculptState.activeShapeId);
  addGraph(shape.graphExpr(SculptState.params));
  setTimeout(() => runAnalysis(), 400);
  closeSculptor();
}

// ── DOM wiring ────────────────────────────────────────────────────────────────
function initSculptUI() {
  document.getElementById('btn-open-sculptor').addEventListener('click', openSculptor);
  document.getElementById('btn-sculpt-close').addEventListener('click', closeSculptor);
  document.getElementById('btn-sculpt-add').addEventListener('click', commitSculptedShape);
  SCULPT_SHAPES.forEach(s => initSculptDefaults(s.id));
}
