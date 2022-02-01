import {Boot, CollectionEvent, CollectionEventType, readAudio, Terminable, Terminator} from "../lib/common.js"
import {AudioScene, AudioSceneController} from "./audio.js"
import {RotaryModel, RotaryTrackModel} from "./model.js"
import {LimiterWorklet} from "../dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./audio/worklet.js"
import {Flanger, Mixer, PulsarDelay} from "../dsp/composite.js"
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

            // AUX 0
            const pulsarDelay = new PulsarDelay(context)
            pulsarDelay.connectToInput(mixer.auxSend(0), 0)
            pulsarDelay.connectToOutput(mixer.auxReturn(0), 0)
            terminator.with(pulsarDelay.watchSettings(model.aux.sendPulsarDelay))

            // AUX 1
            const convolverNode = context.createConvolver()
            convolverNode.buffer = await loadSample(model.aux.sendConvolver.get())
            terminator.with(model.aux.sendConvolver.addObserver(async path => convolverNode.buffer = await readAudio(context, path)))
            mixer.auxSend(1).connect(convolverNode).connect(mixer.auxReturn(1))

            // AUX 2
            const flanger: Flanger = new Flanger(context)
            terminator.with(flanger.watchSettings(model.aux.sendFlanger))
            flanger.connectToInput(mixer.auxSend(2), 0)
            flanger.connectToOutput(mixer.auxReturn(2), 0)

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