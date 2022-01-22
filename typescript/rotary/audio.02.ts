import {RotaryModel} from "./model.js"
import {Random} from "../lib/math.js"
import {RotaryPlaybackNode} from "./worklets.js"
import {readAudio} from "../lib/common.js"

export const buildAudio = async (context: AudioContext, output: AudioNode, model: RotaryModel, random: Random): Promise<void> => {
    const rotaryNode = await RotaryPlaybackNode.build(context)
    const updateFormat = () => rotaryNode.updateFormat(model)
    model.addObserver(updateFormat)
    updateFormat()

    const buffer = await readAudio(context, "samples/tiny.wav")
    rotaryNode.updateSample(buffer)

    rotaryNode.connect(output)
}