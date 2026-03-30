const express = require("express");
const DMX = require("dmx");

const app = express();
app.use(express.json());

const dmx = new DMX();
const universe = dmx.addUniverse("stage", "enttec-usb-dmx-pro", "COM3");

// --- Helper: hex → RGB ---
function hexToRgb(hex) {
    hex = hex.replace("#", "");

    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }

    if (hex.length !== 6) {
        throw new Error("Invalid hex color");
    }

    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

// --- Sæt lampe ---
function setLamp(lampNumber, hexColor) {
    const base = (lampNumber) * 8 + 1;
    const { r, g, b } = hexToRgb(hexColor);

    const channels = {};

    channels[base] = 255;     // Dimmer
    channels[base + 1] = r;   // Red
    channels[base + 2] = g;   // Green
    channels[base + 3] = b;   // Blue
    channels[base + 4] = 0;   // White
    channels[base + 5] = 0;   // Strobe off
    channels[base + 6] = 0;   // Macro off
    channels[base + 7] = 0;   // Speed

    universe.update(channels);
}

// --- Sluk lampe ---
function offLamp(lampNumber) {
    const base = (lampNumber - 1) * 8 + 1;

    const channels = {};
    for (let i = 0; i < 8; i++) {
        channels[base + i] = 0;
    }

    universe.update(channels);
}

//
// WEBHOOKS
//

// Tænd lampe med farve
app.post("/lamp", (req, res) => {
    try {
        const { lamp, color } = req.body;

        if (!lamp || !color) {
            return res.status(400).send("Missing lamp or color");
        }

        setLamp(lamp, color);

        res.send(`Lamp ${lamp} set to ${color}`);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Sluk lampe
app.post("/off", (req, res) => {
    const { lamp } = req.body;

    if (!lamp) {
        return res.status(400).send("Missing lamp");
    }

    offLamp(lamp);
    res.send(`Lamp ${lamp} off`);
});

// Start flere lamper i samme farve
app.post("/group", (req, res) => {
    const { lamps, color } = req.body;

    if (!Array.isArray(lamps) || !color) {
        return res.status(400).send("Missing lamps or color");
    }

    lamps.forEach(lamp => setLamp(lamp, color));

    res.send(`Group set to ${color}`);
});

// --- Start server ---
app.listen(3000, () => {
    console.log("DMX webhook running on http://localhost:3000");
});