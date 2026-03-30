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

// --- Fade helper ---
function fadeLamp(lampNumber, targetColor, fadeTime = 2000, callback) {
    const base = (lampNumber - 1) * 8 + 1;
    const { r: targetR, g: targetG, b: targetB } = hexToRgb(targetColor);

    // Hent nuværende værdier (starter fra 0 hvis intet er sat)
    let currentR = 0, currentG = 0, currentB = 0;
    let stepCount = Math.floor(fadeTime / 50); // 50ms interval
    let stepR = (targetR - currentR) / stepCount;
    let stepG = (targetG - currentG) / stepCount;
    let stepB = (targetB - currentB) / stepCount;

    let i = 0;
    const interval = setInterval(() => {
        i++;
        currentR += stepR;
        currentG += stepG;
        currentB += stepB;

        universe.update({
            [base]  : Math.round(currentR), // Red
            [base+1]: Math.round(currentG), // Green
            [base+2]: Math.round(currentB), // Blue
            [base+3]: 255,                  // Dimmer max
            [base+4]: 0,                    // White
            [base+5]: 0,                    // Strobe
            [base+6]: 0,                    // Macro
            [base+7]: 0                     // Speed
        });

        if(i >= stepCount) {
            clearInterval(interval);
            if(callback) callback();
        }
    }, 50);
}

// --- Fade out helper ---
function fadeLampOut(lampNumber, fadeTime = 2000, callback) {
    const base = (lampNumber - 1) * 8 + 1;

    // Antag nuværende RGB = 255 på alle kanaler (eller det sidste vi satte)
    let currentR = 255, currentG = 255, currentB = 255;
    let stepCount = Math.floor(fadeTime / 50);
    let stepR = currentR / stepCount;
    let stepG = currentG / stepCount;
    let stepB = currentB / stepCount;

    let i = 0;
    const interval = setInterval(() => {
        i++;
        currentR -= stepR;
        currentG -= stepG;
        currentB -= stepB;

        universe.update({
            [base]  : Math.round(Math.max(0,currentR)),
            [base+1]: Math.round(Math.max(0,currentG)),
            [base+2]: Math.round(Math.max(0,currentB)),
            [base+3]: Math.round(Math.max(0,255 - (255/stepCount*i))), // Dimmer
            [base+4]: 0,
            [base+5]: 0,
            [base+6]: 0,
            [base+7]: 0
        });

        if(i >= stepCount) {
            clearInterval(interval);
            if(callback) callback();
        }
    }, 50);
}

// --- Webhook endpoints ---
app.post("/on", (req,res)=>{
    const { lamp, color } = req.body;
    if(!lamp || !color) return res.status(400).send("Missing lamp or color");
    fadeLamp(lamp, color, 2000, ()=>console.log(`Lamp ${lamp} fully on`));
    res.send(`Fading on lamp ${lamp} with color ${color}`);
});

app.post("/off", (req,res)=>{
    const { lamp } = req.body;
    if(!lamp) return res.status(400).send("Missing lamp");
    fadeLampOut(lamp, 2000, ()=>console.log(`Lamp ${lamp} fully off`));
    res.send(`Fading off lamp ${lamp}`);
});

// Lyt på hele netværket
app.listen(3000, "0.0.0.0", ()=>console.log("DMX webhook listening on port 3000"));