/* state.js — Single shared mutable state object for the app */

const State = {
  // Camera
  camRadius: 20,
  camTheta:  Math.PI / 4,
  camPhi:    Math.PI / 3.5,
  camTarget: null,   // set to THREE.Vector3 in initThree()

  // Three.js objects (populated by renderer.js)
  renderer:   null,
  scene:      null,
  camera:     null,
  axesGroup:  null,
  gridHelper: null,

  // Graphs
  graphId:    0,      // auto-increment id counter
  graphs:     [],     // array of { id, expr, color, compiled, mesh }
  graphMeshes: {},    // id → THREE.Mesh

  // Analysis
  intersectionMarkers: [],

  // Debounce handle for mesh rebuilding
  rebuildTimer: null,
};
