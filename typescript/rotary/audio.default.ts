import {Boot, readAudio, Terminator} from "../lib/common.js"
import {AudioScene, AudioSceneController} from "./audio.js"
import {RotaryModel} from "./model.js"
import {LimiterWorklet} from "../dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./audio/worklet.js"
import {Mixer, MixerModel} from "./mixer.js"

export const initAudioScene = (): AudioScene => {
    return {
        async build(context: BaseAudioContext,
                    output: AudioNode,
                    model: RotaryModel,
                    boot: Boot): Promise<AudioSceneController> {
            const terminator = new Terminator()

            const limiterWorklet = await LimiterWorklet.build(context)
            const rotaryNode = await RotaryWorkletNode.build(context)
            const updateFormat = () => rotaryNode.updateFormat(model)
            terminator.with(model.addObserver(updateFormat))
            updateFormat()

            const loadSample = (url: string): Promise<AudioBuffer> => {
                return boot.registerProcess(readAudio(context, url))
            }

            let index = 0
            for (let i = 0; i <= 19; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/kicks/${i}.wav`))
            }
            for (let i = 0; i <= 74; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/glitch/${i}.wav`))
            }
            for (let i = 0; i <= 19; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/clicks/${i}.wav`))
            }
            for (let i = 0; i <= 12; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/vinyl/${i}.wav`))
            }
            for (let i = 0; i <= 9; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/snares/${i}.wav`))
            }
            for (let i = 0; i <= 21; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/foley/${i}.wav`))
            }

            const mixerModel = new MixerModel(RotaryModel.MAX_TRACKS, 4)
            // mixerModel.channels[0].solo.set(true)
            for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
                mixerModel.channels[i].auxSends[0].set(i/RotaryModel.MAX_TRACKS)
            }
            const mixer: Mixer = new Mixer(context, mixerModel)
            for (let outIndex = 0; outIndex < RotaryModel.MAX_TRACKS; outIndex++) {
                rotaryNode.connect(mixer.channelstrips[outIndex].input(), outIndex, 0)
            }

            const convolverNode = context.createConvolver()
            convolverNode.buffer = await loadSample("impulse/LargeWideEchoHall.ogg")
            mixer.auxSend(0).connect(convolverNode).connect(mixer.auxReturn(0))

            mixer.masterOutput().connect(limiterWorklet)
            limiterWorklet.connect(output)
            await boot.waitForCompletion()
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