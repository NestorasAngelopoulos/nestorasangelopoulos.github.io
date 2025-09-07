import * as THREE from './three/build/three.module.js';
import { scene, createPanel, createText } from './initThree.js';

// gizmos
const axesHelper = new THREE.AxesHelper(1);
axesHelper.position.y = 0.0001;
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper();
gridHelper.position.y = -0.0001;
scene.add(gridHelper);

// icosphere
const geo = new THREE.IcosahedronGeometry(1.0, 2);
const mat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    flatShading: true
});
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(-3, 1, 0);
scene.add(mesh);

window.addEventListener("update", e => {
    const { time } = e.detail;
    
    // animations
    mesh.rotation.y = time * 0.0001;
});

const wireMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    wireframe: true
});
const wireMesh = new THREE.Mesh(geo, wireMat);
wireMesh.scale.setScalar(1.001);
wireMesh.onClick = function () { alert("I'm an icosphere!"); };
mesh.add(wireMesh);

// lighting
const hemiLight = new THREE.HemisphereLight(0x5BCEFA, 0xF5A9B8, 3);
scene.add(hemiLight);

const lightHelper = new THREE.HemisphereLightHelper(hemiLight);
scene.add(lightHelper);

const ambientLight = new THREE.AmbientLight(0xA020F0);
scene.add(ambientLight);

// text
const helloWorld = await createText('Hello, world!', 0.5, 0.5, new THREE.Vector3(2, 0, -3), new THREE.Vector3(0, -75, 0), 'three/examples/fonts/ttf/kenpixel.ttf');


// panel
// panels that overlap don't work too well.
// if you MUST have overlapping panels, make sure to create them in reverse order (background -> foreground) so that interactions work as intended.
const guestbook = createPanel('guestbook.html', 4.8, 2.7, new THREE.Vector3(0, 0.75, -5));

//TODO: create 3d html elements using data from the guestbook.