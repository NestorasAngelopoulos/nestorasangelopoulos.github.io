import * as THREE from './three/build/three.module.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { TTFLoader } from 'jsm/loaders/TTFLoader.js';
import { FontLoader } from 'jsm/loaders/FontLoader.js';
import { TextGeometry } from 'jsm/geometries/TextGeometry.js';
import { CSS3DRenderer, CSS3DObject } from 'jsm/renderers/CSS3DRenderer.js';

const rendererHTML = new CSS3DRenderer();
rendererHTML.setSize(window.innerWidth, window.innerHeight);
rendererHTML.domElement.style.position = 'absolute';
rendererHTML.domElement.style.top = '0px';
rendererHTML.domElement.style.left = '0px';
rendererHTML.domElement.style.pointerEvents = 'none';
document.getElementById('css3D').appendChild(rendererHTML.domElement);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.getElementById('webGL').appendChild(renderer.domElement);

const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 30;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

// updates canvas when window is rescaled
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererHTML.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
});

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.03;

const scene = new THREE.Scene();
renderer.setClearColor(0xA020F0);

// handle clicks on 3D objects
var mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
window.addEventListener('mouseup', function(e) {
    if (e.button != 0) return; // mouse buttons: 0=left, 1=middle, 2=right, 4=back, 5=forward 

    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    try { intersects[0].object.onClick(); } catch {} // for a 3D object to become a button, use `myobject`.onClick = function() { //code };
});

var occlusionObjects = []; // all "transparent" objects on which CSS3D objects are rendered.

document.addEventListener('mousemove', function(e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;
});

// this is the basic "update" or "game" loop (t is increased with time)
function animate(t = 0){
    mesh.rotation.y = t * 0.0001;

    orbitControls.update();
    renderer.render(scene, camera);
    rendererHTML.render(scene, camera);

    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(occlusionObjects, true);
    if (intersects.length > 0) {
        document.getElementById('webGL').style.pointerEvents = 'none';
    }
    else{
        document.getElementById('webGL').style.pointerEvents = 'auto';
    }
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
//wireMesh.onClick = function () { submitGuestBook(); }; // document is no longer in this document (loaded with iframe)
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
    //textMesh.onClick = function() { document.getElementById('guestbook-message-field').focus(); }; // document is no longer in this document (loaded with iframe)
    scene.add(textMesh);
});

//TODO: create 3d html elements using data from the guestbook.
//TODO: streamline webGL pointer event toggle on mobile (drag events don't recalculate the "focus" of the user) 

// Create add html elements to be rendered by the css3drenderer.
//(with help from: https://youtu.be/0ZW3xrFhY3w?feature=shared)
const iframe = document.createElement('iframe');
iframe.src = 'guestbook.html';
iframe.style.width = '480px';
iframe.style.height = '270px';
//rendererHTML.domElement.style.mixBlendMode = 'multiply';
const iframe3D = new CSS3DObject(iframe);
iframe3D.scale.set(0.01, 0.01, 0.01); // (each 3D unit is equivalent to a pixel in length)
iframe3D.position.set(0, 0.75, -5);
scene.add(iframe3D);
// Occlusion
//(very usefull: https://gotoo.co/demo/elizabeth/gotoo5th3D/HtmlWith3D/)
const geometry = new THREE.PlaneGeometry(4.8, 2.7);
const material = new THREE.MeshBasicMaterial({
    blending: THREE.NoBlending,
    opacity: 0,
    side: THREE.DoubleSide,
    color: 0x000000,
});
const occlusionMesh = new THREE.Mesh(geometry, material);
occlusionMesh.position.copy(iframe3D.position);
occlusionObjects.push(occlusionMesh);
scene.add(occlusionMesh); // add to array so that raycaster can know to disable the webGL PointerEvents





