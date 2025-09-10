const canvas = document.getElementById('ui');
canvas.style.position = 'fixed';
canvas.style.pointerEvents = 'none';
canvas.style.top = '0px';
canvas.style.left = '0px';
canvas.style.width = '100%';
canvas.style.height = '100%';

// Healthbar
const health = document.createElement('div');
health.className = 'bar';
health.style.position = 'fixed';
health.style.backgroundColor = '#000000DD';
health.style.pointerEvents = 'all';
health.style.height = '5vh';
health.style.top = '5vh';
health.style.right = '5vh';
canvas.appendChild(health);

// Healthbar fill
const fill = document.createElement('div');
fill.className = 'fill';
fill.style.position = 'absolute';
fill.style.backgroundColor = '#00FFFF';
health.appendChild(fill);
var healthFillInset;

var joystickArea;
var joystickKnob;
var buttonArea;
var buttonA;
var buttonB;
window.uiButtonMap = {
    mobileA: '',
    mobileB: ''
}
window.joystick = { x: 0, y: 0 };
if (isMobile()) {
    // Joystick area
    joystickArea = document.createElement('div');
    joystickArea.className = 'joystick';
    joystickArea.style.position = 'fixed';
    joystickArea.style.backgroundColor = '#00000022';
    canvas.appendChild(joystickArea);

    // Joystick knob
    joystickKnob = document.createElement('div');
    joystickKnob.className = 'knob';
    joystickKnob.style.position = 'relative';
    joystickKnob.style.backgroundColor = '#00FFFF';
    joystickKnob.style.pointerEvents = 'all';
    joystickKnob.style.touchAction = 'none';
    joystickKnob.style.width = '50%';
    joystickKnob.style.height = '50%';
    joystickKnob.style.top = '25%';
    joystickKnob.style.left = '25%';
    joystickArea.appendChild(joystickKnob);

    // Joystick functionality
    var joystickRadius = joystickArea.offsetWidth / 2;
    var knobRadius = joystickKnob.offsetWidth / 2;
    let centerX, centerY;
    let touched = false;
    function startInput(x, y) {
        touched = true;
        const rect = joystickArea.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
        moveInput(x, y);
    }
    function moveInput(x, y) {
        if (!touched) return;

        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Clamp knob inside joystick radius
        const clampedDist = Math.min(dist, joystickRadius - knobRadius);
        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;
        
        // Move knob
        joystickKnob.style.left = `${50 + (kx / joystickRadius) * 50 - 20}%`;
        joystickKnob.style.top = `${50 + (ky / joystickRadius) * 50 - 20}%`;
        
        // Normalize and flip vertical
        const nx = kx / (joystickRadius - knobRadius);
        const ny = ky / (joystickRadius - knobRadius);
        joystick = { x: nx, y: -ny };
    }
    function endInput() {
        touched = false;
        joystickKnob.style.left = '25%';
        joystickKnob.style.top = '25%';
        joystick = { x: 0, y: 0 };
    }
    joystickKnob.addEventListener('touchstart', (e) => startInput(e.touches[0].clientX, e.touches[0].clientY));
    joystickKnob.addEventListener('touchmove', (e) => moveInput(e.touches[0].clientX, e.touches[0].clientY));
    joystickKnob.addEventListener('touchend', endInput);
    joystickKnob.addEventListener('mousedown', (e) => startInput(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => moveInput(e.clientX, e.clientY));
    window.addEventListener('mouseup', endInput);

    // Button area
    buttonArea = document.createElement('div');
    buttonArea.className = 'buttons';
    buttonArea.style.position = 'fixed';
    buttonArea.style.backgroundColor = '#00000022';
    canvas.appendChild(buttonArea);

    // Button A
    buttonA = document.createElement('div');
    buttonA.className = 'jump';
    buttonA.style.position = 'absolute';
    buttonA.style.backgroundColor = '#00FFFF';
    buttonA.style.pointerEvents = 'all';
    buttonA.style.touchAction = 'none';
    buttonA.style.width = '40%';
    buttonA.style.height = '40%';
    buttonA.style.bottom = '7.5%';
    buttonA.style.left = '7.5%';
    buttonA.textContent = 'A';
    buttonA.style.userSelect = 'none';
    buttonA.style.color = '#FFFFFF';
    buttonA.style.fontFamily = 'Arial';
    buttonA.style.display = 'flex';
    buttonA.style.alignItems = 'center';
    buttonA.style.justifyContent = 'center';
    buttonArea.appendChild(buttonA);

    buttonA.addEventListener('touchstart', () => window.dispatchEvent(new KeyboardEvent("keydown", { code: uiButtonMap.mobileA })));
    buttonA.addEventListener('touchend', () => window.dispatchEvent(new KeyboardEvent("keyup", { code: uiButtonMap.mobileA })));
    buttonA.addEventListener('mousedown', () => window.dispatchEvent(new KeyboardEvent("keydown", { code: uiButtonMap.mobileA })));
    buttonA.addEventListener('mouseup', () => window.dispatchEvent(new KeyboardEvent("keyup", { code: uiButtonMap.mobileA })));

    // Button B
    buttonB = document.createElement('div');
    buttonB.className = 'jump';
    buttonB.style.position = 'absolute';
    buttonB.style.backgroundColor = '#00FFFF';
    buttonB.style.pointerEvents = 'all';
    buttonB.style.touchAction = 'none';
    buttonB.style.width = '40%';
    buttonB.style.height = '40%';
    buttonB.style.top = '7.5%';
    buttonB.style.right = '7.5%';
    buttonB.textContent = 'B';
    buttonB.style.userSelect = 'none';
    buttonB.style.color = '#FFFFFF';
    buttonB.style.fontFamily = 'Arial';
    buttonB.style.display = 'flex';
    buttonB.style.alignItems = 'center';
    buttonB.style.justifyContent = 'center';
    buttonArea.appendChild(buttonB);

    buttonB.addEventListener('touchstart', () => window.dispatchEvent(new KeyboardEvent("keydown", { code: uiButtonMap.mobileB })));
    buttonB.addEventListener('touchend', () => window.dispatchEvent(new KeyboardEvent("keyup", { code: uiButtonMap.mobileB })));
    buttonB.addEventListener('mousedown', () => window.dispatchEvent(new KeyboardEvent("keydown", { code: uiButtonMap.mobileB })));
    buttonB.addEventListener('mouseup', () => window.dispatchEvent(new KeyboardEvent("keyup", { code: uiButtonMap.mobileB })));
}

function resizeUI() {
    if (!uiCreated) return;
    // Healthbar
    health.style.width = isVertical() ? '30vh' : '20vw';

    // Healthbar fill
    healthFillInset = health.offsetHeight * 0.075;
    fill.style.top = `${healthFillInset}px`;
    fill.style.left = `${healthFillInset}px`;
    fill.style.right = `${healthFillInset}px`;
    fill.style.bottom = `${healthFillInset}px`;

    if (isMobile()) {
        let controlsInset;
        if (isVertical()) controlsInset = canvas.offsetWidth * 0.075;
        else controlsInset = canvas.offsetHeight * 0.15;

        // Joystick
        joystickArea.style.width = isVertical() ? '40vw' : '30vh';
        joystickArea.style.height = isVertical() ? '40vw' : '30vh';
        joystickArea.style.left = `${controlsInset}px`;
        joystickArea.style.bottom = `${controlsInset}px`;
        joystickRadius = joystickArea.offsetWidth / 2;
        knobRadius = joystickKnob.offsetWidth / 2;
        
        // Buttons
        buttonArea.style.width = isVertical() ? '40vw' : '30vh';
        buttonArea.style.height = isVertical() ? '40vw' : '30vh';
        buttonArea.style.right = `${controlsInset}px`;
        buttonArea.style.bottom = `${controlsInset}px`;
        const buttonHeight = buttonA.offsetHeight;
        buttonA.style.fontSize = `${buttonHeight * 0.8}px`;
        buttonB.style.fontSize = `${buttonHeight * 0.8}px`;
    }
}
window.resizeUI = resizeUI;
var uiCreated = true;
resizeUI();

function setHealthFill(percent) {
    const availableWidth = health.offsetWidth - healthFillInset * 2;
    var healthPercent = Math.max(Math.min(percent, 100), 0);
    fill.style.width = `${availableWidth * healthPercent / 100}px`;
}
window.setHealthBar = setHealthFill;

function isVertical() {
    return window.innerHeight > window.innerWidth;
}