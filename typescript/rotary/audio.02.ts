import {RotaryModel} from "./model.js"
import {Random} from "../lib/math.js"
import {RotaryPlaybackNode} from "./worklets.js"
import {ObservableCollection, readAudio} from "../lib/common.js"

export const buildAudio = async (context: AudioContext, model: RotaryModel, random: Random): Promise<void> => {
    const rotaryNode = await RotaryPlaybackNode.build(context)
    model.loopDuration.addObserver(seconds => rotaryNode.updateLoopDuration(seconds))
    rotaryNode.updateLoopDuration(model.loopDuration.get())
    const updateFormat = () => rotaryNode.updateFormat(model)
    ObservableCollection.observeNested(model.tracks, updateFormat)
    updateFormat()

    const buffer = await readAudio(context, "samples/robotica.wav")
    rotaryNode.updateSample(buffer)

    rotaryNode.connect(context.destination)
}