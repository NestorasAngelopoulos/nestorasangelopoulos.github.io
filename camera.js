import * as THREE from './three/build/three.module.js';

const desiredLookOffset = new THREE.Vector3(0, -1.5, 0);
const smoothing = 0.08;

let spline;
let splinePoints = [];
let splineProgress = 0.5; // Start in middle of spline for better visuals on spawn
let currentPosition = camera.position.clone();
let smoothedLookTarget = player.model.position.clone();

// Straight track
//splinePoints = [new THREE.Vector3(-10, 10, 10), new THREE.Vector3(10, 10, 10)];
//spline = new THREE.CatmullRomCurve3(splinePoints);

// Semi-circular track
const center = new THREE.Vector3(0, 10, 0);
const radius = 10;
const segments = 16;
for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = Math.PI * t;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    const y = center.y;
    splinePoints.push(new THREE.Vector3(x, y, z));
}
spline = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal');

// Add spline visualizer gizmo on layer 1
const splinePointsForLine = spline.getPoints(splinePoints.length * 5);
const splineGeometry = new THREE.BufferGeometry().setFromPoints(splinePointsForLine);
const splineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
const splineLine = new THREE.Line(splineGeometry, splineMaterial);
splineLine.layers.set(1); // Set to layer 1 so it doesn't interfere with raycasting for interactivity
scene.add(splineLine); // Add spline to scene

cameraControls.enabled = false;
window.addEventListener("lateUpdate", () => {
    if (cameraControls.enabled) return; // Don't override freecam
    if (!window.player?.model) return;

    const playerPos = window.player.model.position;

    // Smoothly move splineProgress toward the closest t to playerPos
    splineProgress = THREE.MathUtils.lerp(splineProgress, findClosestTToPoint(playerPos), 0.1);

    // Smooth camera movement along spline
    currentPosition.lerp(spline.getPointAt(splineProgress), smoothing);
    camera.position.copy(currentPosition);

    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);

    // Smooth look-at
    const desiredLookTarget = playerPos.clone().add(desiredLookOffset);
    smoothedLookTarget.lerp(desiredLookTarget, smoothing);

    camera.lookAt(smoothedLookTarget);
    cameraControls.target.copy(smoothedLookTarget); // Update cameraControls target for consistency when toggling freecam
});

function findClosestTToPoint(point) {    
    const searchRadius = 0.1;
    const start = Math.max(0, splineProgress - searchRadius);
    const end = Math.min(1, splineProgress + searchRadius);
    
    const tempPoint = new THREE.Vector3();
    let minDistSq = Infinity;
    let bestT = splineProgress;
    
    let sampleCount = 15; // Number of samples to take within the search radius
    for (let i = 0; i <= sampleCount; i++) {
        // Remap i to [start, end]
        const t = start + (i / sampleCount) * (end - start);
        spline.getPointAt(t, tempPoint);
        
        const distSq = tempPoint.distanceToSquared(point);
        if (distSq < minDistSq) {
            minDistSq = distSq;
            bestT = t;
        }
    }
    return bestT;
}