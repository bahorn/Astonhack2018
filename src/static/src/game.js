/* eslint no-undef: 0, no-console: 0, function-paren-newline: 0, operator-linebreak: 0 */
/* Define the initial game state */
let state = {
  playerId: null,
  camera: {
    x: 0,
    y: 5,
    z: 10,
  },
  lastUpdate: 0.0,
  objects: [],
  keyboard: {},
  mouse: {},
  effects: {
    bloom: {
      exposure: 1,
      strength: 0.5,
      threshold: 0,
      radius: 0,
    },
  },
  players: {},
  scores: {
    dinosaurs: 0,
    unicorns: 0,
  },
};

let socket;

/* Setup Scene */
let scene;
let camera;
const setupScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color().setHSL(0.6, 0, 1);
  scene.fog = new THREE.Fog(scene.background, 1, 5000);
  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000);
};

/* Light */
let directionalLight;
let ambientLight;
const setupLight = () => {
  const ambiColor = '#1c2020';
  const pointColor = '#ff5808';
  /* Ambient */
  ambientLight = new THREE.AmbientLight(ambiColor);
  scene.add(ambientLight);
  /* Directional */
  directionalLight = new THREE.DirectionalLight(pointColor);
  directionalLight.position.set(-40, 60, -10);
  directionalLight.castShadow = true;
  directionalLight.shadowCameraNear = 2;
  directionalLight.shadowCameraFar = 200;
  directionalLight.shadowCameraLeft = -50;
  directionalLight.shadowCameraRight = 50;
  directionalLight.shadowCameraTop = 50;
  directionalLight.shadowCameraBottom = -50;
  directionalLight.distance = 0;
  directionalLight.intensity = 0.5;
  directionalLight.shadowMapHeight = 1024;
  directionalLight.shadowMapWidth = 1024;
  scene.add(directionalLight);
};

/* Renderer */
let renderer;
const setupRenderer = () => {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
};

/* Initialize our Input handlers */

const keyDownListener = (event) => {
  state.keyboard[event.which] = true;
};

const keyUpListener = (event) => {
  state.keyboard[event.which] = false;
};

const setupInput = () => {
  /* Add event listeners */
  document.addEventListener('keydown', keyDownListener, false);
  document.addEventListener('keyup', keyUpListener, false);
};


/* Effects */
let composer;

const setupEffects = () => {
  const renderScene = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.renderToScreen = true;
  bloomPass.threshold = state.effects.bloom.threshold;
  bloomPass.strength = state.effects.bloom.strength;
  bloomPass.radius = state.effects.bloom.radius;
  composer = new THREE.EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
};

const updateLocalPosition = (dx, dz) => {
  state.players[state.playerId].position.x += dx;
  state.players[state.playerId].position.z += dz;
  if ((state.players[state.playerId].position.x < -25) ||
    (state.players[state.playerId].position.x > 25)) {
    state.players[state.playerId].position.x = 0;
    state.players[state.playerId].position.z = 0;
  }
  if ((state.players[state.playerId].position.z < -25) ||
    (state.players[state.playerId].position.z > 25)) {
    state.players[state.playerId].position.x = 0;
    state.players[state.playerId].position.z = 0;
  }
};

/* Socket message handlers */

const setState = (data) => {
  state = Object.assign(state, data);
  document.getElementById('info').innerHTML = `Dinosaurs: ${state.scores.dinosaurs} - Unicorns: ${state.scores.unicorns}`;
};

const updatePositions = (data) => {
  const pId = Object.keys(data)[0];
  if (!state.players[pId]) {
    console.log(pId);
    state.players[pId] = data[pId];
  }
  state.players[pId].position = data[pId].position;
};

const updateScores = (data) => {
  state.scores = data;
  document.getElementById('info').innerHTML = `Dinosaurs: ${state.scores.dinosaurs} - Unicorns: ${state.scores.unicorns}`;
};

const disconnectedUser = (data) => {
  if (state.players[data.playerId] && state.players[data.playerId].displayObject) {
    scene.remove(state.players[data.playerId].displayObject);
  }
};

/* Networking */

const setupNetwork = () => {
  socket = io();
  socket.on('state', setState);
  socket.on('position', updatePositions);
  socket.on('disconnectedUser', disconnectedUser);
  socket.on('scores', updateScores);
};

/* Initial Objects */

const setupObjects = () => {
  const geometry = new THREE.BoxGeometry(50, 1, 50);
  const material = new THREE.MeshLambertMaterial();
  material.color = new THREE.Color().setHSL(0.6, 0, 1);
  const obj = new THREE.Mesh(geometry, material);
  obj.position.y = -1;
  scene.add(obj);
  /* check point */

  const goalGeometry = new THREE.SphereGeometry(5, 32, 32);
  const obj2 = new THREE.Mesh(goalGeometry, material);
  scene.add(obj2);
  obj2.position.x = state.point.position.x;
  obj2.position.z = state.point.position.z;
  state.point.displayObject = obj2;
};

const updateFrame = (time) => {
  if (!state.playerId) return;
  // Handle keyboard input
  if (state.keyboard[37]) {
    updateLocalPosition(-0.05, 0);
  }
  if (state.keyboard[39]) {
    updateLocalPosition(0.05, 0);
  }
  if (state.keyboard[38]) {
    updateLocalPosition(0, -0.05);
  }
  if (state.keyboard[40]) {
    updateLocalPosition(0, 0.05);
  }

  const positionUpdate = {};
  positionUpdate[state.playerId] = state.players[state.playerId];
  if ((state.lastUpdate + 100.0) < time) {
    socket.emit('position', positionUpdate);
    state.lastUpdate = time;
  }

  /* Add all objects to scene. */
  const players = Object.values(state.players);
  for (i = 0; i < players.length; i += 1) {
    const pId = players[i].name;

    if (!state.players[pId].displayObject) {
      // add the player to the scene
      let geometry;
      if (state.players[pId].type === 'dinosaur') {
        geometry = new THREE.DodecahedronGeometry(
          (state.players[pId].score * 0.1) + 1,
          0,
        );
      } else {
        geometry = new THREE.ConeGeometry(
          (state.players[pId].score * 0.1) + 1,
          (state.players[pId].score * 0.1) + 1,
          32,
        );
      }
      const material = new THREE.MeshLambertMaterial();
      material.color = new THREE.Color(state.players[pId].color);
      state.players[pId].displayObject = new THREE.Mesh(geometry, material);
      scene.add(state.players[pId].displayObject);
    }
    state.players[pId].displayObject.position.x = state.players[pId].position.x;
    state.players[pId].displayObject.position.y = state.players[pId].score * 0.1 + 1;
    state.players[pId].displayObject.position.z = state.players[pId].position.z;
  }

  const geometry = new THREE.SphereGeometry(5, 32, 32);
  const material = new THREE.MeshLambertMaterial();
  material.color = new THREE.Color(state.players[pId].color);
};

const setCamera = () => {
  camera.position.x = state.players[state.playerId].displayObject.position.x;
  camera.position.z = state.players[state.playerId].displayObject.position.z + 25;
  camera.position.y = 15;
  camera.lookAt(state.players[state.playerId].displayObject.position);
};

const animate = (time) => {
  requestAnimationFrame(animate);
  updateFrame(time);
  setCamera();
  composer.render(scene, camera);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const initGame = () => {
  setupScene();
  setupLight();
  setupRenderer();
  setupEffects();
  setupInput();
  setupNetwork();
  setupObjects();
  window.addEventListener('resize', onWindowResize, false);
  animate();
};

initGame();
