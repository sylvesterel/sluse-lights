const DMX = require("dmx");
const dmx = new DMX();

// Opret universe på din USB Pro
const universe = dmx.addUniverse("stage", "enttec-usb-dmx-pro", "COM3");

// Helper: hex → RGB
function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c+c).join("");
    return {
        r: parseInt(hex.substring(0,2),16),
        g: parseInt(hex.substring(2,4),16),
        b: parseInt(hex.substring(4,6),16)
    };
}

// --- Test lampe på DMX start 1 ---
function testLampDMX1(hexColor) {
    const base = 1; // Lampe starter på DMX 1
    const { r, g, b } = hexToRgb(hexColor);

    const channels = {};
    channels[base]   = 255; // Dimmer max
    channels[base+1] = r;   // Red
    channels[base+2] = g;   // Green
    channels[base+3] = b;   // Blue
    channels[base+4] = 0;   // White
    channels[base+5] = 0;   // Strobe
    channels[base+6] = 0;   // Macro
    channels[base+7] = 0;   // Speed

    console.log(`Turning on lamp (start DMX 1) with color ${hexColor}`);
    universe.update(channels);

    // Sluk efter 3 sekunder
    setTimeout(() => {
        for (let i = 0; i < 8; i++) channels[base+i] = 0;
        universe.update(channels);
        console.log(`Lamp turned off`);
        process.exit(0);
    }, 3000);
}

// --- Kør test ---
testLampDMX1("#ff0000"); // Rød test