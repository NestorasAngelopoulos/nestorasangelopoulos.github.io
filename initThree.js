import * as THREE from './three/build/three.module.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { TTFLoader } from 'jsm/loaders/TTFLoader.js';
import { FontLoader } from 'jsm/loaders/FontLoader.js';
import { TextGeometry } from 'jsm/geometries/TextGeometry.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 30;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

// updates canvas when window is rescaled
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.03;

const scene = new THREE.Scene();
renderer.setClearColor(0xA020F0);

// handle clicks on 3D objects
const raycaster = new THREE.Raycaster();
const mousePosition = new THREE.Vector2();
window.addEventListener('mouseup', function(e) {
    if (e.button != 0) return; // mouse buttons: 0=left, 1=middle, 2=right, 4=back, 5=forward 

    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    try { intersects[0].object.onClick(); } catch {} // for an object to become a button, use `myobject`.onClick = function() { //code };
});

// this is the basic "update" or "game" loop (t is increased with time... somewhere???)
function animate(t = 0){
    mesh.rotation.y = t * 0.0001;

    orbitControls.update();
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
// === END OF INITIALIZATION ===

// gizmos
const axesHelper = new THREE.AxesHelper(1);
axesHelper.position.y = 0.0001;
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper();
gridHelper.position.y = -0.0001;
scene.add(gridHelper);

// geometry
const geo = new THREE.IcosahedronGeometry(1.0, 2);
const mat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    flatShading: true
});
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(-3, 1, 0);
scene.add(mesh);

const wireMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    wireframe: true
});
const wireMesh = new THREE.Mesh(geo, wireMat);
wireMesh.scale.setScalar(1.001);
wireMesh.onClick = function () { submitGuestBook(); };
mesh.add(wireMesh);

// lighting
const hemiLight = new THREE.HemisphereLight(0x5BCEFA, 0xF5A9B8, 3);
scene.add(hemiLight);

const lightHelper = new THREE.HemisphereLightHelper(hemiLight);
scene.add(lightHelper);

const ambientLight = new THREE.AmbientLight(0xA020F0);
scene.add(ambientLight);


// Text
const fontLoader = new FontLoader();
const ttfLoader = new TTFLoader();
ttfLoader.load('three/examples/fonts/ttf/kenpixel.ttf', (json) => {
    const kenpixel = fontLoader.parse(json);
    const textGeometry = new TextGeometry('Hello, world!', {
        heigt: 1,
        depth: 0.5,
        size: 0.5,
        font: kenpixel,
    });
    const textMaterial = new THREE.MeshNormalMaterial();
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.x = 2;
    textMesh.position.y = 0;
    textMesh.position.z = -3;
    textMesh.rotateY(-1.25);
    textMesh.onClick = function() { document.getElementById('guestbook-message-field').focus(); };
    scene.add(textMesh);
});

//TODO: update text based on field