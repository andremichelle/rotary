import {RotaryModel} from "./model.js"
import {UpdateFormatMessage, UpdateSampleMessage} from "../worklets/messages.js"

export const handleErrors = (worklet: AudioWorkletNode) => {
    worklet.onprocessorerror = (event: ErrorEvent) => {
        console.log(`error occurred. message: ${event.message}`)
        throw new Error(event.message)
    }
}

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

        handleErrors(this)
    }

    updateFormat(model: RotaryModel): void {
        this.port.postMessage(new UpdateFormatMessage(model.serialize()))
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

        handleErrors(this)
    }
}

export class RotaryPlaybackNode extends AudioWorkletNode {
    static async build(context: AudioContext): Promise<RotaryPlaybackNode> {
        await context.audioWorklet.addModule("bin/worklets/rotary-playback.js")
        return new RotaryPlaybackNode(context)
    }

    constructor(context: AudioContext) {
        super(context, "rotary-playback", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        handleErrors(this)
    }

    updateFormat(model: RotaryModel): void {
        this.port.postMessage(new UpdateFormatMessage(model.serialize()))
    }

    updateSample(key: number, buffer: AudioBuffer) {
        this.port.postMessage(UpdateSampleMessage.from(key, buffer))
    }
}