// Background (Inspired by Nathalie Lawhead's "ARTIST'S STATEMENT" from "EVERYTHING IS GOING TO BE OK")
const sections = document.querySelectorAll("section");
const dictionary = {
    classes : [
        "null",
        "about",
        "main",
        "questions",
    ],
    words : [
        ["VOID", "EMPTY", "NOTHING", "SPACE",],
        ["HI", "HELLO", "HAI <3 ", "WELCOME", "GREETINGS", "HEY",],
        ["STOP", "MEH", "UGH", "BORING", "YAWN", "ZZZ", "SIGH", "BLAH", "WHATEVER", "LAME", "DULL", "TIRED", "SNOOZE", "SLEEPY", "SNORE",],
        ["REWARD?", "???", "WHAT", "HUH?", "HMM?", "DOUBT", "SKEPTICAL", "QUESTION", "WHY?", "WHAT IF?", "MAYBE", "PERHAPS", "POSSIBLY", "CONCEIVABLY", "UNCERTAIN", "UNSURE", "UNLIKELY",],
    ]
};
var words = dictionary.words[1];

function getActiveSection() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    var maxOverlap = 0;
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Overlap wheighted by section height (0-1] 
        var overlap = (Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)) / rect.height;
        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            words = dictionary.words[dictionary.classes.findIndex(className => className === section.className)];
        }
    });
    if (maxOverlap == 0) words = dictionary.words[0];
};

var canvasElement = document.getElementById("words");

function drawWords() {
    var canvas = "";
    getActiveSection();
    while (canvas.length < window.innerWidth * 4) {
        if (Math.random() > 0.95) {
            var stars = `<a style="font-size: ${Math.ceil(Math.random()*10)}vh; font-family: monospace"/>${words[Math.ceil(Math.random()*words.length)-1]}</a>`;
            canvas += stars;
        }
        else canvas += '⠀ ';
    }
    canvasElement.innerHTML = canvas;
}
drawWords();
setInterval(drawWords, 600);

// Redacted Text

function scramble(el) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const length = el.textContent.length;
    setInterval(() => {
        let scrambled = "";
        for (let i = 0; i < length; i++) {
            scrambled += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        el.textContent = scrambled;
    }, 50);
}
document.querySelectorAll(".redacted").forEach(scramble);

// Layout

function isMobile() {
    // Touch Test
    //return navigator.maxTouchPoints > 0;

    // User Agent Test
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
}

function adjustLayout() {
    if ((window.innerWidth * window.devicePixelRatio || 1) < (window.innerHeight * window.devicePixelRatio || 1)) {
        document.getElementById("about").style.flexDirection = "column";
        document.getElementById("me").style.width = "100%";
    } else {
        document.getElementById("about").style.flexDirection = "row";
        document.getElementById("me").style.width = "250px";
    }
}
adjustLayout();
    
window.addEventListener('resize', function() {
    adjustLayout();
});