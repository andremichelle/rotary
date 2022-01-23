import {RotaryModel} from "./model.js"
import {Random} from "../lib/math.js"
import {RotaryPlaybackNode} from "./worklets.js"
import {readAudio} from "../lib/common.js"
import {pulsarDelay} from "../lib/dsp.js"

export const buildAudio = async (context: AudioContext, output: AudioNode, model: RotaryModel, random: Random): Promise<void> => {
    const rotaryNode = await RotaryPlaybackNode.build(context)
    const updateFormat = () => rotaryNode.updateFormat(model)
    model.addObserver(updateFormat)
    updateFormat()

    rotaryNode.updateSample(0, await readAudio(context, "samples/hang/0.wav"))
    rotaryNode.updateSample(1, await readAudio(context, "samples/hang/1.wav"))
    rotaryNode.updateSample(2, await readAudio(context, "samples/hang/2.wav"))
    rotaryNode.updateSample(3, await readAudio(context, "samples/hang/3.wav"))
    rotaryNode.updateSample(4, await readAudio(context, "samples/hang/4.wav"))
    rotaryNode.updateSample(5, await readAudio(context, "samples/hang/5.wav"))
    rotaryNode.updateSample(6, await readAudio(context, "samples/hang/6.wav"))
    rotaryNode.updateSample(7, await readAudio(context, "samples/hang/7.wav"))
    rotaryNode.updateSample(8, await readAudio(context, "samples/hang/8.wav"))

    const wetNode = context.createGain()
    wetNode.gain.value = 0.4
    pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 12000, 200)
    const convolverNode = context.createConvolver()
    convolverNode.buffer = await readAudio(context, "impulse/PlateLarge.ogg")
    wetNode.connect(convolverNode).connect(output)
    rotaryNode.connect(output)
}