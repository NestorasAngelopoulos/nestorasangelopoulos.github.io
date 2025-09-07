import * as THREE from './three/build/three.module.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'jsm/renderers/CSS3DRenderer.js';
import { TTFLoader } from 'jsm/loaders/TTFLoader.js';
import { FontLoader } from 'jsm/loaders/FontLoader.js';
import { TextGeometry } from 'jsm/geometries/TextGeometry.js';

// Renderers

const rendererCSS3D = new CSS3DRenderer();
rendererCSS3D.setSize(window.innerWidth, window.innerHeight);
rendererCSS3D.domElement.style.position = 'absolute';
rendererCSS3D.domElement.style.top = '0px';
rendererCSS3D.domElement.style.left = '0px';
rendererCSS3D.domElement.style.pointerEvents = 'none';
document.getElementById('css3D').appendChild(rendererCSS3D.domElement);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.getElementById('webGL').appendChild(renderer.domElement);

// Camera

const fov = 75;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 30;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.03;

// Scene

// updates canvas when window is rescaled
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererCSS3D.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
});

export const scene = new THREE.Scene();
renderer.setClearColor(0xA020F0);

// Interactivity

export var occlusionObjects = []; // all "transparent" objects on top of which CSS3D objects are rendered.
var mousePosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function setMousePos(clientX, clientY){
    mousePosition.x = (clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = - (clientY / window.innerHeight) * 2 + 1;
}

document.addEventListener('mousemove', function(e) { setMousePos(e.clientX, e.clientY); });

// Propagate mouse event from iframe and remap mouse position to root document coordinates
const trustedIFrameSources = [window.location.hostname.toString()];
window.addEventListener('message', (event) => {
    // Security check: Ensure the message comes from a trusted source
    var trusted = false;
    trustedIFrameSources.forEach(source => { if(event.origin.includes(source)) trusted = true;})
    if (!trusted) return;

    if (event.data && (event.data.type === 'mousemove')) {
        const iframes = document.querySelectorAll('iframe');

        iframes.forEach(iframe => {
            try {
                // Get iframe bounding box relative to the main document
                const rect = iframe.getBoundingClientRect();

                // Check if the mouse is inside this iframe
                if (event.source === iframe.contentWindow && event.data.x >= 0 && event.data.y >= 0 && event.data.x <= rect.width && event.data.y <= rect.height) {
                    // Remap coordinates to the root document
                    const remappedX = rect.left + event.data.x;
                    const remappedY = rect.top + event.data.y;

                    setMousePos(remappedX, remappedY);
                }
            } catch (error) { console.warn('Cannot access iframe:', error); }
        });
    }
});

// handle clicks on 3D objects
window.addEventListener('mouseup', function(e) {
    if (e.button != 0) return; // mouse buttons: 0=left, 1=middle, 2=right, 4=back, 5=forward 

    setMousePos(e.clientX, e.clientY);

    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    try { intersects[0].object.onClick(); } catch {} // for a 3D object to become a button, use `myobject`.onClick = function() { //code };
});

// Update

// this is the basic "update" or "game" loop (t is increased with time)
function animate(t = 0) {

    // interactivity toggle (WebGL / CSS3D)
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0){
        var hit = false;
        occlusionObjects.forEach(o => {
            if(o == intersects[0].object) hit = true;
        });
        document.getElementById('webGL').style.pointerEvents = hit ? 'none' : 'auto';
    }
    else document.getElementById('webGL').style.pointerEvents = 'auto';

    // rendering
    orbitControls.update();
    renderer.render(scene, camera);
    rendererCSS3D.render(scene, camera);
    
    // propagate update to any subscribers
    window.dispatchEvent(new CustomEvent("update", { detail: { time: t } }));
}
renderer.setAnimationLoop(animate);

// ======================================================== HELPERS ========================================================

export function isMobile() {
    return navigator.maxTouchPoints > 0;
}

export async function createText(content, size = 1, depth = 0.5, position = new THREE.Vector3(0,0,0), rotation = new THREE.Vector3(0,0,0) , font = 'three/examples/fonts/ttf/kenpixel.ttf') {
    const fontLoader = new FontLoader();
    const ttfLoader = new TTFLoader();

    return new Promise((resolve) => {
        ttfLoader.load(font, (json) => {
            const kenpixel = fontLoader.parse(json);
            const textGeometry = new TextGeometry(content, {
                height: 1,
                depth: depth,
                size: size,
                font: kenpixel,
            });
            const textMaterial = new THREE.MeshNormalMaterial();
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(position.x, position.y, position.z);
            textMesh.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
            scene.add(textMesh);

            resolve(textMesh);
        });
    });
};

// create add html elements to be rendered by the css3drenderer.
//(with help from: https://youtu.be/0ZW3xrFhY3w?feature=shared)
export function createPanel(source, width = 4.8, height = 2.7, position = new THREE.Vector3(0,0,0), rotation = new THREE.Vector3(0,0,0)) {
    const iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.style.width = `${width*100}px`;
    iframe.style.height = `${height*100}px`;
    //rendererCSS3D.domElement.style.mixBlendMode = 'multiply';
    const iframe3D = new CSS3DObject(iframe);
    iframe3D.scale.set(0.01, 0.01, 0.01); // (each 3D unit is equivalent to a pixel in length)
    iframe3D.position.set(position.x, position.y, position.z);
    iframe3D.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
    scene.add(iframe3D);
    // occlusion
    //(very usefull: https://gotoo.co/demo/elizabeth/gotoo5th3D/HtmlWith3D/)
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
        blending: THREE.NoBlending,
        opacity: 0,
        side: THREE.DoubleSide,
        color: 0x000000,
    });
    const occlusionMesh = new THREE.Mesh(geometry, material);
    occlusionMesh.scale.set(100, 100, 100);
    occlusionObjects.push(occlusionMesh); // add to array so that raycaster can know to disable the webGL PointerEvents
    scene.add(occlusionMesh);
    occlusionMesh.parent = iframe3D;
    
    return iframe3D;
}