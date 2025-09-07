import * as THREE from './three/build/three.module.js';
import { scene, collisionObjects, camera, createMesh, isMobile, GetKey, GetKeyDown, GetKeyUp, CapsuleIntersectionWithCollection } from './engine.js';

export var active = false;

const height = 2;
const radius = 0.5;
const speed = 0.05;
const gravity = 0.981;
const jumpVel = 2;
const terminalVelocity = 2;

var verticalVelocity = 0;
var grounded;

export const player = createMesh(
    new THREE.CylinderGeometry(radius, radius, height),
    new THREE.MeshStandardMaterial({color: 0x00FFFF, flatShading: true}),
    new THREE.Vector3(0, height/2 + 1, 0),
);

window.addEventListener("update", e => {
    if (!active) return;

    // Camera-based movement
    const move = cameraRelativeMovement();
    if (move.length() > 0) tryMove(move);

    // Limit delta to < 1 so that velocity doesn't build up when tab loses focus
    const delta = Math.min(e.detail.delta, 0.2);
    // Calculate gravity
    verticalVelocity -= gravity * delta;
    verticalVelocity = Math.max(verticalVelocity, -terminalVelocity);

    grounded = false;
    tryMove(new THREE.Vector3(0, verticalVelocity * delta, 0));
    
    // Jump
    if (grounded && GetKeyDown('Space')) verticalVelocity = jumpVel;
});

function cameraRelativeMovement() {
    const dir = new THREE.Vector3();
    const right = new THREE.Vector3();
    const move = new THREE.Vector3();

    // Forward (camera look direction, flattened)
    camera.getWorldDirection(dir);
    dir.y = 0; // ignore vertical tilt
    dir.normalize();

    // Right (perpendicular to forward)
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

    // Build movement vector from keys
    if (GetKey('KeyW')) move.add(dir);
    if (GetKey('KeyS')) move.sub(dir);
    if (GetKey('KeyD')) move.add(right);
    if (GetKey('KeyA')) move.sub(right);

    // Normalize to prevent diagonal speed boost
    if (move.length() > 0) move.normalize().multiplyScalar(speed);

    return move;
}


function tryMove(offset) {
    const maxIter = 4;
    let remaining = offset.clone();

    for (let iter = 0; iter < maxIter; iter++) {
        player.position.add(remaining);
        // find collision
        const hit = CapsuleIntersectionWithCollection(player.position, height, radius, collisionObjects);
        if (!hit) break;

        // push out along normal by depth + epsilon
        const push = hit.normal.clone().multiplyScalar(hit.depth);
        player.position.add(push);

        // If we collided with downward motion, mark grounded if normal points up enough
        if (remaining.y < 0 && hit.normal.y > 0.5) {
            grounded = true;
            verticalVelocity = 0;
        }

        // Remove component of remaining motion into the normal (so we slide)
        const into = hit.normal.clone().multiplyScalar(remaining.dot(hit.normal));
        remaining.sub(into);

        // if remaining is tiny, stop
        if (remaining.lengthSq() < 1e-8) break;
        // otherwise loop and try to move the remaining vector
    }
}

window.player = player;


setTimeout(function() { active = true; }, 500);