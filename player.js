import * as THREE from './three/build/three.module.js';
import { capsuleIntersectionWithCollection } from './engine.js';

const height = 2;
const radius = 0.5;
const speed = 0.15;
const gravity = 30;
const jumpVel = 10;
const terminalVelocity = 15;
const maxSlopeAngle = 45;

var verticalVelocity = 0;
var grounded;

const player = createMesh(
    new THREE.CylinderGeometry(radius, radius, height),
    new THREE.MeshStandardMaterial({color: 0x00FFFF, flatShading: true}),
    new THREE.Vector3(0, height/2 + 1, 0),
);

window.player = {
    active: false,
    model: player
};

uiButtonMap = {
    mobileA: "Space",
    mobileB: "KeyZ"
};

window.addEventListener("update", e => {
    if (!window.player.active) return;
    
    // Limit delta to < 1 so that velocity doesn't build up when tab loses focus
    const delta = Math.min(e.detail.delta, 0.02);

    // Camera-based movement
    const move = cameraRelativeMovement();
    if (move.length() > 0) tryMove(move.add(new THREE.Vector3(0, delta / gravity, 0)));

    // Calculate gravity
    verticalVelocity -= gravity * delta;
    verticalVelocity = Math.max(verticalVelocity, -terminalVelocity);

    grounded = false;
    tryMove(new THREE.Vector3(0, verticalVelocity * delta, 0));
    
    // Jump
    if (grounded && (getKeyDown('Space') || getKeyDown('mobileA'))) verticalVelocity = jumpVel;

    // Change color
    
    const step = 1 / 6;
    const quantized = Math.floor(e.detail.time / step) * step;
    player.material.color.setHSL((quantized / 10) % 1, 1, 0.5);
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
    if (getKey('KeyW')) move.add(dir);
    if (getKey('KeyS')) move.sub(dir);
    if (getKey('KeyD')) move.add(right);
    if (getKey('KeyA')) move.sub(right);

    if (joystick) {
        move.add(right.multiplyScalar(joystick.x));
        move.add(dir.multiplyScalar(joystick.y));
    }

    // Normalize to prevent diagonal speed boost
    if (move.length() > 0) {
        if (joystick) move.multiplyScalar(speed);
        else move.normalize().multiplyScalar(speed);
    }

    return move;
}

function tryMove(offset) {
    const maxIter = 4;
    let remaining = offset.clone();
    for (let iter = 0; iter < maxIter; iter++) {
        player.position.add(remaining);
        const hit = capsuleIntersectionWithCollection(player.position, height, radius, collisionObjects);
        if (!hit) break;

        // Push out along normal by depth + epsilon
        const push = hit.normal.clone().multiplyScalar(hit.depth);
        player.position.add(push);

        // If we collided with downward motion, mark grounded if normal points up enough
        if (remaining.y < 0 && hit.normal.y >= Math.cos(THREE.MathUtils.degToRad(maxSlopeAngle))) {
            grounded = true;
            verticalVelocity = 0;
        }
        else if (remaining.y > 0) remaining.multiplyScalar(0.1);

        // Remove component of remaining motion into the normal (so we slide)
        const into = hit.normal.clone().multiplyScalar(remaining.dot(hit.normal));
        remaining.sub(into);

        // If remaining is tiny, stop
        if (remaining.lengthSq() < 1e-8) break;
        // Otherwise loop and try to move the remaining vector
    }
}