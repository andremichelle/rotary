import {RotaryModel} from "./model.js"

export class RotaryAutomationNode extends AudioWorkletNode {
    static async build(context: AudioContext): Promise<RotaryAutomationNode> {
        await context.audioWorklet.addModule("bin/worklets/rotary-automation.js")
        return new RotaryAutomationNode(context)
    }

    constructor(context: AudioContext) {
        super(context, "rotary-automation", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [RotaryModel.MAX_TRACKS],
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

export class RotarySineNode extends AudioWorkletNode {
    static async build(context: AudioContext): Promise<RotarySineNode> {
        await context.audioWorklet.addModule("bin/worklets/rotary-sine.js")
        return new RotarySineNode(context)
    }

    constructor(context: AudioContext) {
        super(context, "rotary-sine", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: RotaryModel.MAX_TRACKS,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
    }
}

