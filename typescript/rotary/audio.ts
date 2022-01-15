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

export class RotarySampleNode extends AudioWorkletNode {
    static async build(context: AudioContext): Promise<RotarySampleNode> {
        await context.audioWorklet.addModule("bin/worklets/rotary-sample.js")
        return new RotarySampleNode(context)
    }

    constructor(context: AudioContext) {
        super(context, "rotary-sample", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: RotaryModel.MAX_TRACKS,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
    }

    updateNumberOfTracks(numTracks: number): void {
        this.port.postMessage({action: "numTracks", value: numTracks})
    }

    updateSample(buffer: AudioBuffer): void {
        this.port.postMessage({
            action: "sample", sample: [
                buffer.getChannelData(0),
                buffer.getChannelData(1)
            ], numFrames: buffer.length
        })
    }
}

export class MappingNode extends AudioWorkletNode {
    static async load(context: AudioContext): Promise<void> {
        return context.audioWorklet.addModule("bin/worklets/mapping.js")
    }

    constructor(context: AudioContext) {
        super(context, "mapping", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [RotaryModel.MAX_TRACKS],
            channelCount: RotaryModel.MAX_TRACKS,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
    }
}

