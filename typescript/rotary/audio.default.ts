import {readAudio, Terminator} from "../lib/common.js"
import {pulsarDelay} from "../lib/dsp.js"
import {AudioScene, AudioSceneController} from "./audio.js"
import {RotaryModel} from "./model.js"
import {LimiterWorklet} from "../dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./audio/worklet.js"

export const initAudioScene = (): AudioScene => {
    return {
        async build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, onProgressInfo: (info: string) => void): Promise<AudioSceneController> {
            const terminator = new Terminator()
            const loadSample = async (url: string): Promise<AudioBuffer> => {
                onProgressInfo(`loading ${url}`)
                return await readAudio(context, url)
            }

            const limiterWorklet = await LimiterWorklet.build(context)
            const rotaryNode = await RotaryWorkletNode.build(context)
            const masterGain = context.createGain()
            const updateFormat = () => rotaryNode.updateFormat(model)
            terminator.with(model.addObserver(updateFormat))
            updateFormat()

            let index = 0
            for (let i = 0; i <= 19; i++) {
                rotaryNode.uploadSample(index++, await loadSample(`samples/kicks/${i}.wav`))
            }
            for (let i = 0; i <= 74; i++) {
                rotaryNode.uploadSample(index++, await loadSample(`samples/glitch/${i}.wav`))
            }
            for (let i = 0; i <= 19; i++) {
                rotaryNode.uploadSample(index++, await loadSample(`samples/clicks/${i}.wav`))
            }
            for (let i = 0; i <= 12; i++) {
                rotaryNode.uploadSample(index++, await loadSample(`samples/vinyl/${i}.wav`))
            }
            for (let i = 0; i <= 9; i++) {
                rotaryNode.uploadSample(index++, await loadSample(`samples/snares/${i}.wav`))
            }
            for (let i = 0; i <= 21; i++) {
                rotaryNode.uploadSample(index++, await loadSample(`samples/foley/${i}.wav`))
            }
            masterGain.gain.value = 1.0

            /*const rotaryMuxer = context.createChannelMerger(RotaryModel.MAX_TRACKS)
            for (let outIndex = 0; outIndex < RotaryModel.MAX_TRACKS; outIndex++) {
                rotaryNode.connect(rotaryMuxer, outIndex, 0)
            }*/

            const rotaryMuxer = context.createGain()
            for (let outIndex = 0; outIndex < RotaryModel.MAX_TRACKS; outIndex++) {
                const outputGain = context.createGain()
                outputGain.gain.value = 1.0
                rotaryNode.connect(outputGain, outIndex, 0).connect(rotaryMuxer)
            }

            const wetNode = context.createGain()
            wetNode.gain.value = 0.2
            pulsarDelay(context, rotaryMuxer, wetNode, 0.125, 0.250, .250, 0.9, 2000, 200)
            const convolverNode = context.createConvolver()
            convolverNode.buffer = await loadSample("impulse/DeepSpace.ogg")
            wetNode.connect(convolverNode).connect(masterGain)
            rotaryMuxer.connect(masterGain).connect(limiterWorklet)
            limiterWorklet.connect(output)
            return Promise.resolve({
                transport: rotaryNode.transport,
                rewind: async () => {
                    rotaryNode.rewind()
                },
                phase: () => rotaryNode.phase(),
                latency: () => limiterWorklet.lookahead,
                terminate: () => terminator.terminate()
            })
        }
    }
}