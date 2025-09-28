// Background (Inspired by Nathalie Lawhead's "ARTIST'S STATEMENT" from "EVERYTHING IS GOING TO BE OK")

function createBackground() {
    let pre = document.createElement("pre");
    let bg = document.createElement("div");
    bg.id = "background";
    pre.appendChild(bg);
    document.body.appendChild(pre);
}
createBackground();

function initDictionary() {
    let emptyWords = ["VOID", "EMPTY", "NOTHING", "SPACE", "NULL", "VACUUM"];
    if (!window.backgroundDictionary) window.backgroundDictionary = { classes : [""], words : [emptyWords] };
    else {
        backgroundDictionary.classes.unshift("");
        backgroundDictionary.words.unshift(emptyWords);
    }
}
initDictionary();

const sections = document.querySelectorAll("section");
var activeSection = 0;
function getActiveSection() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var maxOverlap = 0;
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Overlap wheighted by section height (0-1] 
        var overlap = (Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)) / rect.height;
        // Get most important section that is indexed in backgroundDictionary
        if (overlap > maxOverlap) {
            let index = backgroundDictionary.classes.findIndex(className => className === section.className);
            if (index != -1) {
                activeSection = index;
                maxOverlap = overlap;
            }
        }
    });
    if (maxOverlap == 0) activeSection = 0; // If no indexed section is visible, default to first section)
};
const canvasElement = document.getElementById("background");
function drawWords() {
    var canvas = "";
    getActiveSection();
    while (canvas.length < window.innerWidth * 4) {
        if (Math.random() > 0.95) {
            var stars = `<a style="font-size: ${Math.ceil(Math.random()*10)}vh; font-family: monospace"/>${backgroundDictionary.words[activeSection][Math.ceil(Math.random()*backgroundDictionary.words[activeSection].length)-1]}</a>`;
            canvas += stars;
        }
        else canvas += '⠀ ';
    }
    canvasElement.innerHTML = canvas;
}
drawWords();
setInterval(drawWords, 1000);

// Progress Bar
function progressBarHeight() { return (isVertical() ? window.innerHeight : window.innerWidth) * window.devicePixelRatio / 200; }
const progressBar = document.createElement("div");
progressBar.id = "progress-bar";
progressBar.style.cssText = `
    height: ${progressBarHeight()}px;
    width: 0vw; position: fixed; top: 0; left: 0;
    background-color: var(--accent-color); z-index: 1;
    transition: width 0.5s cubic-bezier(.25,.25,.3,1.5);
`;
window.addEventListener('resize', function() { progressBar.style.height = `${progressBarHeight()}px`; });
window.addEventListener('scroll', function() { progressBar.style.width = `${getScrollProgress() * 100}vw`; });
document.body.appendChild(progressBar);

// Redacted Text

function scramble(element) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-=_+[]{};:'\",.<>/?\\|`~ ";
    const length = element.textContent.length;
    setInterval(() => {
        let scrambled = "";
        for (let i = 0; i < length; i++) scrambled += chars.charAt(Math.floor(Math.random() * chars.length));
        element.dataset.scramble = scrambled; // Apply to 'after' psudo-element
    }, 20);
}

const textWhenCopied = "[REDACTED]";
document.querySelectorAll(".redacted").forEach(element => {
    scramble(element);

    // Prevent copying redacted text directly
    element.addEventListener("copy", (e) => {
        e.clipboardData.setData("text/plain", textWhenCopied);
        e.stopPropagation();
        e.preventDefault();
    });
});

// Prevent copying redacted text as part of a larger selection
document.addEventListener("copy", (e) => {
    const selection = window.getSelection();
    if (!selection) return;

    let html = ""; // For rich text
    let text = "";

    // For each chunk of the selection
    for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        // Clone the range to avoid modifying the actual document
        const cloned = range.cloneContents();

        // Replace redacted spans with textWhenCopied
        cloned.querySelectorAll(".redacted").forEach(span => {
            const replacement = document.createTextNode(textWhenCopied);
            span.replaceWith(replacement);
        });

        // Temporary div to apply innerHTML and innerText before copying from it
        const div = document.createElement("div");
        div.appendChild(cloned);
        html += div.innerHTML;
        text += div.innerText;
    }

    e.clipboardData.setData("text/plain", text);
    e.clipboardData.setData("text/html", html);
    e.preventDefault();
});

// Apply Complimentary CSS

const style = document.createElement("style");
style.textContent = `
:root {
    color-scheme: dark;
    --background-hue: hsl(300 100 50);
    --background-color: hsl(from var(--background-hue) h 30 10);
    --accent-color: hsl(from var(--background-hue) h 60 30);
    --text-color: white;
    color: var(--text-color);
}

/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
    display: none;
}

html {
    scroll-behavior: smooth;
    overflow-y: scroll;
    overflow-x: hidden;

    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}

/* Use accent color as highlight color */
::selection {
    background: var(--accent-color);
}

/* Apply background color */
body {
    background-color: var(--background-color) !important;
}

/* Background words */
#background {
    position: fixed;
    line-height: 5vh;
    white-space: pre-wrap;
    pointer-events: none;
    color: var(--accent-color);
    text-shadow: 0 0 5px var(--accent-color), 0 0 5px var(--accent-color);
    z-index: -1;
    top: -2.5vh;
    left: -2.5vw;
    right: -2.5vw;
}

/* Redacted text */
.redacted {
    padding: 0.15em 0.25em;
    background-color: black;
    font-family: monospace;
    display: inline-block;
    white-space: pre;
    position: relative;
    top: -0.075em;
    color: transparent;
}
.redacted::after {
    content: attr(data-scramble);
    position: absolute;
    left: 0.25em;
    top: 0.15em;
    color: var(--text-color);
    pointer-events: none;
}
.redacted::selection {
    color: transparent;
}
`;
document.head.appendChild(style);

// Helpers

export function isVertical() {
    return (window.innerWidth * window.devicePixelRatio || 1) < (window.innerHeight * window.devicePixelRatio || 1);
}

export function getScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? (scrollTop / docHeight).toFixed(3) : 0;
}