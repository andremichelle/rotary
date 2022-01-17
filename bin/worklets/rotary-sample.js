import { RotaryModel } from "../rotary/model.js";
registerProcessor("rotary-sample", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.model = new RotaryModel();
        this.loopInSeconds = 1.0;
        this.port.onmessage = (event) => {
            const data = event.data;
            if (data.action === "format") {
                this.model.deserialize(data.value);
            }
            else if (data.action === "loopInSeconds") {
                this.loopInSeconds = data.value;
            }
        };
    }
    process(inputs, outputs) {
        return true;
    }
});
//# sourceMappingURL=rotary-sample.js.map