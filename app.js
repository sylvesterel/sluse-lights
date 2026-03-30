const express = require("express");
const DMX = require("dmx");

const app = express();
app.use(express.json());

const dmx = new DMX();
const universe = dmx.addUniverse("stage", "enttec-usb-dmx-pro", "COM3");

// Hex → RGB
function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c+c).join("");
    return {
        r: parseInt(hex.substring(0,2),16),
        g: parseInt(hex.substring(2,4),16),
        b: parseInt(hex.substring(4,6),16)
    };
}

// --- Fade dimmer only ---
function fadeDimmer(lampNumber, targetDim, fadeTime = 2000, callback) {
    const base = (lampNumber - 1) * 8 + 1; // kanal 1 = dimmer
    let currentDim = 0;

    // Hent nuværende dimmer (kan evt. gemmes globalt hvis nødvendigt)
    // Vi starter altid fra 0 for fade-in
    const stepCount = Math.floor(fadeTime / 50);
    const step = (targetDim - currentDim) / stepCount;

    let i = 0;
    const interval = setInterval(() => {
        i++;
        currentDim += step;
        universe.update({
            [base]: Math.round(Math.max(0, Math.min(255, currentDim)))
        });

        if(i >= stepCount) {
            clearInterval(interval);
            if(callback) callback();
        }
    }, 50);
}

// --- Turn lamp on ---
function turnLampOn(lampNumber, hexColor, fadeTime = 2000) {
    const base = (lampNumber - 1) * 8 + 1;
    const { r, g, b } = hexToRgb(hexColor);

    // Sæt RGB med det samme, dimmer = 0
    universe.update({
        [base+1]: r,
        [base+2]: g,
        [base+3]: b,
        [base+4]: 0,  // white
        [base+5]: 0,  // strobe
        [base+6]: 0,  // macro
        [base+7]: 0   // speed
    });

    // Fade dimmer op til 255
    fadeDimmer(lampNumber, 255, fadeTime);
}

// --- Turn lamp off ---
function turnLampOff(lampNumber, fadeTime = 2000) {
    fadeDimmer(lampNumber, 0, fadeTime);
}

// --- Webhook endpoints ---
app.post("/on", (req,res)=>{
    const { lamp, color } = req.body;
    if(!lamp || !color) return res.status(400).send("Missing lamp or color");
    turnLampOn(lamp, color, 2000);
    res.send(`Fading on lamp ${lamp} with color ${color}`);
});

app.post("/off", (req,res)=>{
    const { lamp } = req.body;
    if(!lamp) return res.status(400).send("Missing lamp");
    turnLampOff(lamp, 2000);
    res.send(`Fading off lamp ${lamp}`);
});

// Lyt på hele netværket
app.listen(3000, "0.0.0.0", ()=>console.log("DMX webhook listening on port 3000"));