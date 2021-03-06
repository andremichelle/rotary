import { RENDER_QUANTUM } from "../common.js";
import { Shape } from "./messages.js";
import { Mulberry32, TAU } from "../../lib/math.js";
registerProcessor("lfo", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.random = new Mulberry32(0xFFFFFF);
        this.shape = Shape.Sine;
        this.phase = 0.0;
        this.increment = 1.0 / sampleRate;
        this.port.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === "set-shape") {
                this.shape = msg.shape;
            }
            else if (msg.type === "set-frequency") {
                this.increment = msg.hz / sampleRate;
            }
        };
    }
    process(inputs, outputs) {
        const output = outputs[0][0];
        switch (this.shape) {
            case Shape.Sine: {
                for (let i = 0; i < RENDER_QUANTUM; i++) {
                    output[i] = 0.5 * (1.0 - Math.cos(this.phase * TAU));
                    this.phase += this.increment;
                    this.phase -= Math.floor(this.phase);
                }
                break;
            }
            case Shape.Triangle: {
                for (let i = 0; i < RENDER_QUANTUM; i++) {
                    output[i] = 1.0 - 2.0 * Math.abs(Math.floor(this.phase) - this.phase + 0.5);
                    this.phase += this.increment;
                    this.phase -= Math.floor(this.phase);
                }
                break;
            }
            case Shape.SawtoothUp: {
                for (let i = 0; i < RENDER_QUANTUM; i++) {
                    output[i] = this.phase;
                    this.phase += this.increment;
                    this.phase -= Math.floor(this.phase);
                }
                break;
            }
            case Shape.SawtoothDown: {
                for (let i = 0; i < RENDER_QUANTUM; i++) {
                    output[i] = 1.0 - this.phase;
                    this.phase += this.increment;
                    this.phase -= Math.floor(this.phase);
                }
                break;
            }
            case Shape.Random: {
                for (let i = 0; i < RENDER_QUANTUM; i++) {
                    output[i] = this.random.nextDouble(0.0, 1.0);
                    this.phase += this.increment;
                    this.phase -= Math.floor(this.phase);
                }
                break;
            }
        }
        return true;
    }
});
//# sourceMappingURL=processor.js.map