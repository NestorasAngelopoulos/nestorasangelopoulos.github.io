import * as THREE from './three/build/three.module.js';
import { scene, collisionObjects, createMesh, createPanel, createText } from './engine.js';

// gizmos
const axesHelper = new THREE.AxesHelper(1);
axesHelper.position.y = 0.0001;
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper();
gridHelper.position.y = -0.0001;
scene.add(gridHelper);

const ground = createMesh(
    new THREE.BoxGeometry(10, 0.1, 10), new THREE.MeshStandardMaterial({
        color: 0x888888,
        flatShading: true
    }),
    new THREE.Vector3(0, -0.05, 0)
);
collisionObjects.push(ground);

// icosphere
const ico = createMesh(
    new THREE.IcosahedronGeometry(1.0, 2),
    new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        flatShading: true
    }),
    new THREE.Vector3(-3, 1, 0),
);
collisionObjects.push(ico);
window.addEventListener("update", e => {
    const t = e.detail.time;
    
    // animation
    ico.rotation.y = t * 0.0001;
});

const icoWireframe = createMesh(ico.geometry,
    new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: true
    }),
);
icoWireframe.scale.setScalar(1.001);
icoWireframe.parent = ico;
icoWireframe.onClick = function () { alert("I'm an icosphere!"); };

// lighting
const hemiLight = new THREE.HemisphereLight(0x5BCEFA, 0xF5A9B8, 3);
scene.add(hemiLight);

const lightHelper = new THREE.HemisphereLightHelper(hemiLight);
scene.add(lightHelper);

const ambientLight = new THREE.AmbientLight(0xA020F0);
scene.add(ambientLight);

// text
const helloWorld = await createText('Hello, world!', 0.5, 0.5, new THREE.Vector3(2, 0, -3), new THREE.Vector3(0, -75, 0), 'three/examples/fonts/ttf/kenpixel.ttf');
collisionObjects.push(helloWorld);

// panel
// panels that overlap don't work too well.
// if you MUST have overlapping panels, make sure to create them in reverse order (background -> foreground) so that interactions work as intended.
const guestbook = createPanel('./guestbook/guestbook.html', 4.8, 2.7, new THREE.Vector3(0, 0.75, -5));
collisionObjects.push(guestbook);

//TODO: create 3d html elements using data from the guestbook.