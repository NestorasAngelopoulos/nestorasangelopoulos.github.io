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
window.camera = camera;
camera.position.z = 5;
camera.position.y = 5;
camera.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0, -45))

const controls = new OrbitControls(camera, renderer.domElement);
if (isMobile()) controls.rotateSpeed = 0.75;
window.controls = controls;

// Scene

// updates canvas when window is rescaled
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererCSS3D.setSize(window.innerWidth, window.innerHeight);
    resizeUI();
    camera.updateProjectionMatrix();
});

const scene = new THREE.Scene();
renderer.setClearColor(0xA020F0);
window.scene = scene;

// Interactivity

var occlusionObjects = []; // all "transparent" objects on top of which CSS3D objects are rendered.
window.occlusionObjects = occlusionObjects;
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

var lastTick = 0;
// this is the basic "update" or "game" loop (t is increased with time)
function animate(t = 0) {

    var delta = (t - lastTick) / 100;
    lastTick = t;

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
    controls.update();
    renderer.render(scene, camera);
    rendererCSS3D.render(scene, camera);
    
    // propagate update to any subscribers
    window.dispatchEvent(new CustomEvent("update", { detail: { time: t, delta: delta } }));
    window.dispatchEvent(new CustomEvent("lateUpdate", { detail: { time: t, delta: delta } }));
    lastPressedKeys = new Set(pressedKeys);
}
renderer.setAnimationLoop(animate);

// ======================================================== HELPERS ========================================================

function isMobile() {
        const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    
    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });

    //return navigator.maxTouchPoints > 0;
}
window.isMobile = isMobile;

// Builders

function createMesh(geo, mat, position = new THREE.Vector3(), rotation = new THREE.Vector3(), scale = new THREE.Vector3(1, 1, 1)) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
    mesh.scale.set(scale.x, scale.y, scale.z);

    scene.add(mesh);

    return mesh;
}
window.createMesh = createMesh;

async function createText(content, size = 1, depth = 0.5, position = new THREE.Vector3(), rotation = new THREE.Vector3() , font = 'three/examples/fonts/ttf/kenpixel.ttf') {
    const fontLoader = new FontLoader();
    const ttfLoader = new TTFLoader();

    return new Promise((resolve) => {
        ttfLoader.load(font, (json) => {
            const parsedFont = fontLoader.parse(json);
            const textGeometry = new TextGeometry(content, {
                height: 1,
                depth: depth,
                size: size,
                font: parsedFont,
            });
            const textMaterial = new THREE.MeshNormalMaterial();
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.copy(position);
            textMesh.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
            scene.add(textMesh);

            resolve(textMesh);
        });
    });
};
window.createText = createText;

// create add html elements to be rendered by the css3drenderer.
//(with help from: https://youtu.be/0ZW3xrFhY3w)
function createPanel(source, width = 4.8, height = 2.7, position = new THREE.Vector3(), rotation = new THREE.Vector3()) {
    const iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.style.width = `${width*100}px`;
    iframe.style.height = `${height*100}px`;
    //rendererCSS3D.domElement.style.mixBlendMode = 'multiply';
    const iframe3D = new CSS3DObject(iframe);
    iframe3D.scale.set(0.01, 0.01, 0.01); // (each 3D unit is equivalent to a pixel in length)
    iframe3D.position.copy(position);
    iframe3D.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
    scene.add(iframe3D);
    // occlusion
    //(very usefull: https://gotoo.co/demo/elizabeth/gotoo5th3D/HtmlWith3D)
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
    iframe3D.add(occlusionMesh);
    
    return iframe3D;
}
window.createPanel = createPanel;

// Input Handling

let lastPressedKeys = new Set();
const pressedKeys = new Set();
window.addEventListener("keydown", (e) => pressedKeys.add(e.code));
window.addEventListener("keyup", (e) => pressedKeys.delete(e.code));
const GetKey = (code) => pressedKeys.has(code);
window.GetKey = GetKey;
const GetKeyDown = (code) => pressedKeys.has(code) && !lastPressedKeys.has(code);
window.GetKeyDown = GetKeyDown;
const GetKeyUp = (code) => !pressedKeys.has(code) && lastPressedKeys.has(code);
window.GetKeyUp = GetKeyUp;

// Physics

var collisionObjects = [];
window.collisionObjects = collisionObjects;

//(with help from: https://wickedengine.net/2020/04/capsule-collision-detection)
export function CapsuleIntersectionWithCollection(center, height, radius, collection = scene.children) {
    let best = null; // Deepest penetration
    
    ExecuteOnEachTriangle((p0, p1, p2, mesh) => {
        const intersection = CapsuleTriangleIntersection(center, height, radius, p0, p1, p2);
        if (intersection && (!best || intersection.depth > best.depth)) best = intersection;
    }, collection);

    return best;
}

function CapsuleTriangleIntersection(center, height, radius, p0, p1, p2) {
    const closest = ClosestPointOnTriangle(center, p0, p1, p2);
    // The center of the best sphere candidate:
    const A = new THREE.Vector3(center.x, center.y - (height * 0.5 - radius), center.z);
    const B = new THREE.Vector3(center.x, center.y + (height * 0.5 - radius), center.z);
    const sphereCenter = ClosestPointOnLineSegment(A, B, closest);
    return SphereTriangleIntersection(sphereCenter, radius, p0, p1, p2);
}

function ExecuteOnEachTriangle(callback, collection = scene.children) {
    const _v0 = new THREE.Vector3();
    const _v1 = new THREE.Vector3();
    const _v2 = new THREE.Vector3();

    for (let i = 0; i < collection.length; i++) {
        const mesh = collection[i];
        if (!mesh.isMesh || !mesh.geometry) continue;

        const geom = mesh.geometry;
        const posAttr = geom.attributes.position;
        if (!posAttr) continue;

        const posArr = posAttr.array;
        const idxArr = geom.index ? geom.index.array : null;
        const m = mesh.matrixWorld;

        if (idxArr) {
            for (let t = 0; t < idxArr.length; t += 3) {
                const i0 = idxArr[t] * 3;
                const i1 = idxArr[t + 1] * 3;
                const i2 = idxArr[t + 2] * 3;

                _v0.set(posArr[i0], posArr[i0 + 1], posArr[i0 + 2]).applyMatrix4(m);
                _v1.set(posArr[i1], posArr[i1 + 1], posArr[i1 + 2]).applyMatrix4(m);
                _v2.set(posArr[i2], posArr[i2 + 1], posArr[i2 + 2]).applyMatrix4(m);

                callback(_v0, _v1, _v2, mesh);
            }
        }
        else {
            for (let j = 0; j < posArr.length; j += 9) {
                _v0.set(posArr[j],     posArr[j+1], posArr[j+2]).applyMatrix4(m);
                _v1.set(posArr[j+3],   posArr[j+4], posArr[j+5]).applyMatrix4(m);
                _v2.set(posArr[j+6],   posArr[j+7], posArr[j+8]).applyMatrix4(m);

                callback(_v0, _v1, _v2, mesh);
            }
        }
    }
}

function SphereTriangleIntersection(center, radius, p0, p1, p2){
    // Plane normal
    const N = new THREE.Vector3().crossVectors(
            new THREE.Vector3().subVectors(p1, p0),
            new THREE.Vector3().subVectors(p2, p0)
        ).normalize();
    // Signed distance between sphere and plane
    const dist = new THREE.Vector3().subVectors(center, p0).dot(N);
    if (dist < -radius || dist > radius) return null; // No intersection with plane
    
    const closest = ClosestPointOnTriangle(center, p0, p1, p2);
    const v = new THREE.Vector3().subVectors(center, closest);
    const distsq = v.lengthSq();
    const radiussq  = radius * radius;
    if (distsq > radiussq ) return null; // No intersection with triangle
    
    const d = Math.sqrt(distsq);
    const penetration_normal = d > 1e-6 ? v.clone().divideScalar(d) : N.clone(); // Fallback to tri normal
    const penetration_depth = radius - d;
    return { normal: penetration_normal, depth: penetration_depth, point: closest};
}

function ClosestPointOnTriangle(queryPoint, p0, p1, p2){
    // Plane normal
    const N = new THREE.Vector3().crossVectors(
            new THREE.Vector3().subVectors(p1, p0),
            new THREE.Vector3().subVectors(p2, p0)
        ).normalize();
    // Signed distance between queryPoint and plane
    const dist = new THREE.Vector3().subVectors(queryPoint, p0).dot(N);
    // Projected queryPoint on triangle plane
    const point0 = new THREE.Vector3().copy(queryPoint).addScaledVector(N, -dist);

    // Now determine whether point0 is inside all triangle edges: 
    const c0 = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(point0, p0),
        new THREE.Vector3().subVectors(p1, p0)
    );
    const c1 = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(point0, p1),
        new THREE.Vector3().subVectors(p2, p1)
    );
    const c2 = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(point0, p2),
        new THREE.Vector3().subVectors(p0, p2)
    );
    const inside = c0.dot(N) <= 0 && c1.dot(N) <= 0 && c2.dot(N) <= 0;
    if (inside) return point0;
    
    // Edge 1:
    const point1 = ClosestPointOnLineSegment(p0, p1, point0);
    let best_point = point1.clone();
    let best_distsq = new THREE.Vector3().subVectors(point0, point1).lengthSq();
    
    // Edge 2:
    const point2 = ClosestPointOnLineSegment(p1, p2, point0);
    const d2 = new THREE.Vector3().subVectors(point0, point2).lengthSq();
    if (d2 < best_distsq) {
        best_distsq = d2;
        best_point.copy(point2);
    }

    // Edge 3:
    const point3 = ClosestPointOnLineSegment(p2, p0, point0);
    const d3 = new THREE.Vector3().subVectors(point0, point3).lengthSq();
    if (d3 < best_distsq) {
        best_distsq = d3;
        best_point.copy(point3);
    }

    return best_point;
}

function ClosestPointOnLineSegment(A, B, P){
    const AB = new THREE.Vector3().subVectors(B, A);
    const t = new THREE.Vector3().subVectors(P, A).dot(AB) / AB.lengthSq();
    return new THREE.Vector3().addVectors(A, AB.multiplyScalar(Math.min(Math.max(t, 0), 1)));
}