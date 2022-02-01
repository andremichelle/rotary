import {Boot, CollectionEvent, CollectionEventType, readAudio, Terminable, Terminator} from "../lib/common.js"
import {AudioScene, AudioSceneController} from "./audio.js"
import {RotaryModel, RotaryTrackModel} from "./model.js"
import {LimiterWorklet} from "../dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./audio/worklet.js"
import {pulsarDelay} from "../lib/dsp.js"
import {Mixer} from "../dsp/composite.js"
import {WorkletModules} from "../dsp/waa.js"

export const initAudioScene = (): AudioScene => {
    return {
        async build(context: BaseAudioContext,
                    output: AudioNode,
                    model: RotaryModel,
                    boot: Boot): Promise<AudioSceneController> {
            const terminator = new Terminator()

            const rotaryNode = await WorkletModules.create(context, RotaryWorkletNode)
            const limiterWorklet = await WorkletModules.create(context, LimiterWorklet)
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
            const map: Map<RotaryTrackModel, Terminable> = new Map()
            const addTrack = (track: RotaryTrackModel, index: number): Terminable => {
                const terminator: Terminator = new Terminator()
                const channelstrip = mixer.createChannelstrip()
                channelstrip.connectToInput(rotaryNode, index)
                terminator.with(track.mute.addObserver(mute => channelstrip.setMute(mute), true))
                terminator.with(track.solo.addObserver(solo => channelstrip.setSolo(solo), true))
                terminator.with(track.volume.addObserver(volume => channelstrip.setVolume(volume), true))
                terminator.with(track.panning.addObserver(panning => channelstrip.setPanning(panning), true))
                for (let index = 0; index < RotaryModel.NUM_AUX; index++) {
                    terminator.with(track.auxSends[index]
                        .addObserver(volume => channelstrip.setAuxSend(index, volume), true))
                }
                terminator.with({terminate: () => mixer.removeChannelstrip(channelstrip)})
                return terminator
            }
            terminator.with(model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
                const track = event.item
                if (event.type === CollectionEventType.Add) {
                    map.set(track, addTrack(track, event.index))
                } else if (event.type === CollectionEventType.Remove) {
                    map.get(track).terminate()
                    map.delete(track)
                }
            }, true))

            const convolverNode = context.createConvolver()
            convolverNode.buffer = await loadSample("impulse/LargeWideEchoHall.ogg")
            mixer.auxSend(0).connect(convolverNode).connect(mixer.auxReturn(0))

            pulsarDelay(context, mixer.auxSend(1), mixer.auxReturn(1), 0.250, 0.500, 0.250, 0.94, 12000, 200)

            mixer.masterOutput().connect(limiterWorklet)
            limiterWorklet.connect(output)
            await boot.waitForCompletion()
            return Promise.resolve({
                transport: rotaryNode.transport,
                rewind: () => rotaryNode.rewind(),
                phase: () => rotaryNode.phase(),
                latency: () => limiterWorklet.lookahead,
                terminate: () => terminator.terminate()
            })
        }
    }
}