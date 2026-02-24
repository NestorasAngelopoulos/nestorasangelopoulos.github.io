import * as THREE from './three/build/three.module.js';
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';
import { capsuleIntersectionWithCollection } from './engine.js';

const maxHealth = 100;
let health = maxHealth;

const height = 2;
const radius = 0.5;
const speed = 0.15;
const gravity = 30;
const jumpVel = 10;
const terminalVelocity = 15;
const maxSlopeAngle = 45;
const rotationSpeed = 0.1;

var verticalVelocity = 0;
var grounded;

const collider = createMesh(
    new THREE.CylinderGeometry(radius, radius, height),
    new THREE.MeshStandardMaterial({color: 0x00FFFF, flatShading: true, transparent: true}), // Can set opacity to 0 to hide the collider on spawn
    new THREE.Vector3(0, height/2 + 1, 0),
);

window.player = {
    active: false,
    collider: collider,
    model: null,
    health: health,
    damage: damage
};

uiButtonMap = {
    mobileA: "Space",
    mobileB: "Enter"
};

let targetQuaternion = new THREE.Quaternion();

window.addEventListener("update", e => {
    if (!player.active) return;
    
    // Limit delta to < 1 so that velocity doesn't build up when tab loses focus
    const delta = Math.min(e.detail.delta, 0.02);

    // Camera-based movement
    const move = cameraRelativeMovement();
    if (move.length() > 0) tryMove(move.add(new THREE.Vector3(0, delta / gravity, 0)));

    // Rotate model
    move.y = 0;
    if (move.lengthSq() > 0) {
        move.normalize();
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), move); // Z+ is forward
    }
    player.model.quaternion.slerp(targetQuaternion, rotationSpeed);

    // Calculate gravity
    verticalVelocity -= gravity * delta;
    verticalVelocity = Math.max(verticalVelocity, -terminalVelocity);

    grounded = false;
    tryMove(new THREE.Vector3(0, verticalVelocity * delta, 0));
    
    // Jump
    if (grounded && (getKeyDown('Space') || getKeyDown('mobileA'))) verticalVelocity = jumpVel;
    if (getKeyDown('Enter') || getKeyDown('mobileB')) {
        if (cameraControls.enabled) {
            cameraControls.enabled = false;
            camera.layers.disable(1);
        } else {
            cameraControls.enabled = true;
            camera.layers.enable(1);
        }
    }

    // Die when you fall out of the world
    if (window.player.model.position.y < -10) damage(maxHealth);

    // Update collider color every 1/6 second
    //const step = 1 / 6;
    //const quantized = Math.floor(e.detail.time / step) * step;
    //player.collider.material.color.setHSL((quantized / 10) % 1, 1, 0.5);
});

// MOVEMENT

function cameraRelativeMovement() {
    const dir = new THREE.Vector3();
    const right = new THREE.Vector3();
    const move = new THREE.Vector3();

    // Forward (camera look direction, flattened)
    camera.getWorldDirection(dir);
    dir.y = 0; // Ignore vertical tilt
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
        player.collider.position.add(remaining);
        const hit = capsuleIntersectionWithCollection(player.collider.position, height, radius, collisionObjects);
        if (!hit) break;

        // Push out along normal by depth + epsilon
        const push = hit.normal.clone().multiplyScalar(hit.depth);
        player.collider.position.add(push);

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

function damage(damage) {
    health -= damage;
    if (health <= 0) {
        window.player.active = false;
        window.location.reload();
    }
    ui.setHealthBar(health / maxHealth);
}

// ANIMATIONS

async function loadModel() {
    const glb = await new GLTFLoader().loadAsync('Bucket.glb');
    const playerModel = glb.scene; // Attach scene instead of model to preserve offset from origin
    player.collider.add(playerModel);
    playerModel.position.copy(new THREE.Vector3(0, -height/2, 0));
    player.model = playerModel.children[0]; // Don't save the scene, just the model itself
    //console.log(`Loaded player model: ${player.model.name}`);
    player.collider.material.opacity = 0;
    player.active = true; // TODO: Maybe check if level is ready first in case model loads before level?
}
await loadModel();
