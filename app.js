const express = require("express");
const DMX = require("dmx");

const app = express();
app.use(express.json());

const dmx = new DMX();
const universe = dmx.addUniverse("stage", "enttec-usb-dmx-pro", "COM3");

// hex → RGB
function hexToRgb(hex) {
    hex = hex.replace("#","");
    if(hex.length === 3) hex = hex.split("").map(c=>c+c).join("");
    return {
        r: parseInt(hex.substring(0,2),16),
        g: parseInt(hex.substring(2,4),16),
        b: parseInt(hex.substring(4,6),16)
    };
}

// tænd lampe
function setLamp(lampNumber, hexColor) {
    const base = (lampNumber-1)*8 + 1;
    const { r,g,b } = hexToRgb(hexColor);

    const channels = {};
    channels[base]   = 255; // dimmer
    channels[base+1] = r;
    channels[base+2] = g;
    channels[base+3] = b;
    channels[base+4] = 0; // white
    channels[base+5] = 0; // strobe
    channels[base+6] = 0; // macro
    channels[base+7] = 0; // speed

    universe.update(channels);
}

app.post("/on", (req,res)=>{
    console.log("Received webhook:", req.body);
    const { lamp, color } = req.body;
    if(!lamp || !color) return res.status(400).send("Missing lamp or color");
    setLamp(lamp,color);
    res.send(`Lamp ${lamp} turned on with color ${color}`);
});

app.listen(3000,"0.0.0.0",()=>console.log("Webhook listening on port 3000"));