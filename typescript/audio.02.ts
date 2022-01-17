import {RotaryPlaybackNode} from "./rotary/audio.js"
import {RotaryModel} from "./rotary/model.js"
import {ObservableCollection} from "./lib/common.js"
import {Random} from "./lib/math.js"

export const buildAudio = async (context: AudioContext, model: RotaryModel, random: Random): Promise<void> => {
    const rotaryNode = await RotaryPlaybackNode.build(context)
    model.loopDuration.addObserver(seconds => rotaryNode.updateLoopDuration(seconds))
    rotaryNode.updateLoopDuration(model.loopDuration.get())
    const updateFormat = () => rotaryNode.updateFormat(model)
    ObservableCollection.observeNested(model.tracks, updateFormat)
    updateFormat()

    rotaryNode.connect(context.destination)
}