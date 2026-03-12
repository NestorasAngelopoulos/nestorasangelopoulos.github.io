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

// MOVEMENT

let targetQuaternion = new THREE.Quaternion();
window.addEventListener("update", e => {
    if (!player.active) return;
    
    // Limit delta to < 1 so that velocity doesn't build up when tab loses focus
    const delta = Math.min(e.detail.delta, 0.02);

    // Camera-based movement
    const move = cameraRelativeMovement();
    if (move.length() > 0) tryMove(move.add(new THREE.Vector3(0, delta / gravity, 0)));

    // Rotate player
    move.y = 0;
    if (move.lengthSq() > 0) {
        move.normalize();
        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), move); // Z+ is forward
    }
    player.collider.quaternion.slerp(targetQuaternion, rotationSpeed);

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
    if (window.player.collider.position.y < -10) damage(maxHealth);

    // Update collider color every 1/6 second
    //const step = 1 / 6;
    //const quantized = Math.floor(e.detail.time / step) * step;
    //player.collider.material.color.setHSL((quantized / 10) % 1, 1, 0.5);
});


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

let mixer;
let animations = {};

// Tail
let tailBones = [];
let tailAnimQuats = [];
let tailOffsets = [];
const tailSwingMagnitude = 0.05;

let localVelocity = new THREE.Vector3();
let lastPosition = player.collider.position.clone();
const velocityEMASmoothing = 6; // responsiveness (higher = faster response)

// Ears
let headBone;
let earBones = [];
let earAnimQuats = [];
let earOffsets = [];
const earSwingVelocityFactor = 0.1;
const earSwingHeadRotFactor = 4;
let lastHeadQuat = new THREE.Quaternion();
let currentHeadQuat = new THREE.Quaternion();
let worldHeadDelta = new THREE.Quaternion();

async function loadModel() {
    const glb = await new GLTFLoader().loadAsync('Bucket.glb');
    const playerModel = glb.scene; // Attach scene instead of model to preserve offset from origin
    player.collider.add(playerModel);
    playerModel.position.copy(new THREE.Vector3(0, -height/2, 0));
    player.model = playerModel.children[0]; // Don't store the whole scene, just the model itself
    
    // Index animations Add animation support
    mixer = new THREE.AnimationMixer(player.model);
    glb.animations.forEach(clip => {
        animations[clip.name] = clip;
    });

    // Find tail bones
    player.model.traverse(obj => {
        if (obj.isBone && obj.name.includes("Tail")) {
            tailBones.push(obj);
            tailAnimQuats.push(obj.quaternion.clone());
            tailOffsets.push(new THREE.Quaternion());
        }
    });

    // Find head/ear bones
    player.model.traverse(obj => {
    if (obj.isBone) {
            if (obj.name === "Head") headBone = obj;
            if (obj.name.includes("Ear")) {
                earBones.push(obj);
                earAnimQuats.push(obj.quaternion.clone());
                earOffsets.push(new THREE.Quaternion());
            }
        }
    });
    headBone.getWorldQuaternion(lastHeadQuat);
    
    player.collider.material.opacity = 0;
    player.active = true; // TODO: Maybe check if level is ready first in case model loads before level?
}
await loadModel();

window.addEventListener("update", e => {
    if (!player.model) return;
    
    // Guard against 0 delta which can lead to NaNs in velocity and break the animation
    const delta = Math.max(e.detail.delta, 1e-4);
    
    // Clear dynamic bone transforms before updating animation
    tailBones.forEach((bone, i) => bone.quaternion.copy(tailAnimQuats[i]));
    earBones.forEach((bone, i) => bone.quaternion.copy(earAnimQuats[i]));
    if (mixer) {
        mixer.update(delta);
        player.model.updateMatrixWorld(true);
    }

    // Get local velocity
    localVelocity = player.collider.position.clone().sub(lastPosition).divideScalar(delta).applyQuaternion(player.collider.quaternion.clone().invert());
    lastPosition.copy(player.collider.position);
    // Exponential Moving Average
    const alpha = 1 - Math.exp(-velocityEMASmoothing * delta);
    localVelocity.lerp(localVelocity, alpha);

    // Add tail swing to animation
    tailBones.forEach((bone, i) => {
        tailAnimQuats[i].copy(bone.quaternion); // Store animation pose before applying dynamic offset

        const swingQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler((localVelocity.z - localVelocity.y) * tailSwingMagnitude / 2, localVelocity.x * tailSwingMagnitude, localVelocity.x * tailSwingMagnitude));
        tailOffsets[i].slerp(swingQuat, rotationSpeed);
        bone.quaternion.multiply(tailOffsets[i]);
    });

    // Get head rotation delta
    headBone.getWorldQuaternion(currentHeadQuat); // Get world space head rotation
    worldHeadDelta.copy(currentHeadQuat).multiply(lastHeadQuat.clone().invert()); // Get delta
    lastHeadQuat.copy(currentHeadQuat); // Store current head rotation for next frame
    // Convert world delta to euler head space
    const invHeadWorld = currentHeadQuat.clone().invert();
    const headRotDelta = new THREE.Euler().setFromQuaternion(invHeadWorld.clone().multiply(worldHeadDelta).multiply(currentHeadQuat));

    // Add ear swing to animation
    earBones.forEach((bone, i) => {
        earAnimQuats[i].copy(bone.quaternion); // Store animation pose before applying dynamic offset

        const dir = bone.name === "EarR" ? 1 : -1;
        const swingQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler((-localVelocity.z * earSwingVelocityFactor) + (-headRotDelta.x * earSwingHeadRotFactor) + (-headRotDelta.y * earSwingHeadRotFactor * dir), 0, localVelocity.y * earSwingVelocityFactor * dir));
        earOffsets[i].slerp(swingQuat, 0.1);
        bone.quaternion.multiply(earOffsets[i]);
    });
});

const idleClip = animations["Idle"];
if (idleClip) mixer.clipAction(idleClip).play();