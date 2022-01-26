import {RotaryPlaybackNode} from "./worklets.js"
import {readAudio, Terminable, Terminator} from "../lib/common.js"
import {cycle, pulsarDelay} from "../lib/dsp.js"
import {AudioBuilder} from "./audio.js"
import {midiToHz} from "../dsp/common.js"
import {Chords} from "../lib/chords.js"
import {RotaryModel} from "./model.js"

const phaseShift = (source: Float32Array, offset: number): Float32Array[] => {
    const length = source.length
    const target = new Float32Array(length)
    for (let i = 0; i < length; i++) {
        target[i] = source[(i + offset) % length]
    }
    return [source, target]
}

export const initAudio = (): AudioBuilder => {
    return {
        async build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, onProgressInfo: (info: string) => void): Promise<Terminable> {
            const terminator = new Terminator()
            const loadSample = async (url: string): Promise<AudioBuffer> => {
                onProgressInfo(`loading ${url}`)
                return await readAudio(context, url)
            }

            const rotaryNode = await RotaryPlaybackNode.build(context)
            const updateFormat = () => rotaryNode.updateFormat(model)
            terminator.with(model.addObserver(updateFormat))
            updateFormat()

            let index = 0
            {
                const compose = Chords.compose(Chords.Minor, 60, 0, 5)
                for (let i = 0; i < compose.length; i++) {
                    onProgressInfo(`creating sound ${index + 1}`)
                    rotaryNode.updateSample(index++, await cycle(context.sampleRate, midiToHz(compose[i], 440.0)), true)
                }
            }
            {
                const compose = Chords.compose(Chords.Minor, 60, 3, 5)
                for (let i = 0; i < compose.length; i++) {
                    onProgressInfo(`creating sound ${index + 1}`)
                    rotaryNode.updateSample(index++, await cycle(context.sampleRate, midiToHz(compose[i], 440.0)), true)
                }
            }

            const wetNode = context.createGain()
            wetNode.gain.value = 0.4
            pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 12000, 200)
            const convolverNode = context.createConvolver()
            convolverNode.buffer = await loadSample("impulse/PlateLarge.ogg")
            const masterGain = context.createGain()
            masterGain.gain.value = 0.08
            wetNode.connect(convolverNode).connect(masterGain)
            rotaryNode.connect(masterGain).connect(output)
            return Promise.resolve(terminator)
        }
    }
}