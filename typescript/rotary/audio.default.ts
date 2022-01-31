import {Boot, CollectionEvent, CollectionEventType, readAudio, Terminator} from "../lib/common.js"
import {AudioScene, AudioSceneController} from "./audio.js"
import {RotaryModel, RotaryTrackModel} from "./model.js"
import {LimiterWorklet} from "../dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./audio/worklet.js"
import {Mixer} from "./mixer.js"

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

            const mixer: Mixer = new Mixer(context, RotaryModel.NUM_AUX)

            // TODO terminate
            const map: Map<RotaryTrackModel, Terminator> = new Map()
            const addTrack = (track: RotaryTrackModel, index: number): void => {
                const channelstrip = mixer.createChannelstrip()
                rotaryNode.connect(channelstrip.input(), index, 0)
                track.mute.addObserver(mute => channelstrip.setMute(mute))
                track.solo.addObserver(solo => channelstrip.setSolo(solo))
            }
            terminator.with(model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
                if (event.type === CollectionEventType.Add) {
                    addTrack(event.item, event.index)
                }
            }))
            model.tracks.forEach((track, index) => addTrack(track, index))

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