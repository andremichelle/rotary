import {RotaryModel} from "./model.js"

export class RotaryWorkletNode extends AudioWorkletNode {
    static async build(context: AudioContext): Promise<RotaryWorkletNode> {
        await context.audioWorklet.addModule("bin/worklets/rotary.js")
        return new RotaryWorkletNode(context)
    }

    constructor(context: AudioContext) {
        super(context, "rotary", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
    }

    updateLoopDuration(seconds: number): void {
        this.port.postMessage({
            action: "loopInSeconds",
            value: seconds
        })
    }

    updateFormat(model: RotaryModel): void {
        this.port.postMessage({
            action: "format",
            value: model.serialize()
        })
    }
}