// Background (Inspired by Nathalie Lawhead's "ARTIST'S STATEMENT" from "EVERYTHING IS GOING TO BE OK")

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
const canvasElement = document.getElementById("words");
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

// Redacted Text

function scramble(element) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-=_+[]{};:'\",.<>/?\\|`~ ";
    const length = element.textContent.length;
    setInterval(() => {
        let scrambled = "";
        for (let i = 0; i < length; i++) scrambled += chars.charAt(Math.floor(Math.random() * chars.length));
        element.textContent = scrambled;
    }, 20);
}
document.querySelectorAll(".redacted").forEach(scramble);

// Helpers

export function getScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return docHeight > 0 ? (scrollTop / docHeight).toFixed(3) : 0;
}