/* eslint no-undef: 0, max-len: 0 */

class Game {
  constructor() {
    /* Inital state */
    this.state = {
      camera: {
        x: 0,
        y: 0,
        z: 5,
      },
      objects: [],
    };
  }

  /* Sets up the camera and setups the render */
  start() {
    /* Scene */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    /* Renderer */
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    /* Create our camera */
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.2, 1000);

    //this.geometry = new THREE.BoxGeometry(1, 1, 1);
    // this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    //this.cube = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.cube);

    this.render(0);
    this.initGame();
  }

  /* Redraw our game screen */
  render(time) {
    const binded = this.render.bind(this);
    console.log(this.cube);
    requestAnimationFrame(binded);
    this.frame(time);
    this.setCamera();
    this.renderer.render(this.scene, this.camera);
  }

  setCamera() {
    this.camera.x = this.state.camera.x;
    this.camera.y = this.state.camera.y;
    this.camera.z = this.state.camera.z;
  }

  frame(time) {
    this.state.camera.y = 5 + 0.1 * time;
  }

  initGame() {
    // add all the initial objects
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }
}


const instance = new Game();

instance.start();
