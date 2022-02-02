import {
    ArrayUtils,
    Boot,
    CollectionEvent,
    CollectionEventType,
    ObservableValue,
    readAudio,
    Terminable,
    Terminator
} from "../lib/common.js"
import {AudioScene, AudioSceneController} from "./audio.js"
import {RotaryModel, RotaryTrackModel} from "./model.js"
import {LimiterWorklet} from "../dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./audio/worklet.js"
import {
    CompositeSettings,
    Convolver,
    ConvolverSettings,
    DefaultComposite,
    Flanger,
    FlangerSettings,
    Mixer,
    PulsarDelay,
    PulsarDelaySettings
} from "../dsp/composite.js"
import {WorkletModules} from "../dsp/waa.js"

export const initAudioScene = (): AudioScene => {
    return {
        async build(context: BaseAudioContext,
                    output: AudioNode,
                    model: RotaryModel,
                    boot: Boot): Promise<AudioSceneController> {
            const terminator = new Terminator()

            const rotaryNode = await WorkletModules.create(context, RotaryWorkletNode,
                {create: () => new RotaryWorkletNode(context, model)})

            const limiterWorklet = await WorkletModules.create(context, LimiterWorklet)

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
                    terminator.with(track.aux[index]
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

            const auxTerminators: Terminator[] = ArrayUtils.fill(model.aux.length, () => terminator.with(new Terminator()))
            model.aux.forEach((value: ObservableValue<CompositeSettings<any>>, index: number) => {
                terminator.with(value.addObserver(settings => {
                    const auxTerminator = auxTerminators[index]
                    auxTerminator.terminate()
                    let composite: DefaultComposite<any> = null
                    if (settings instanceof PulsarDelaySettings) {
                        composite = new PulsarDelay(context)
                    } else if (settings instanceof ConvolverSettings) {
                        composite = new Convolver(context)
                    } else if (settings instanceof FlangerSettings) {
                        composite = new Flanger(context)
                    }
                    if (null === composite) {
                        throw new Error(`Unknown composite for ${settings}`)
                    }
                    composite.connectToInput(mixer.auxSend(index))
                    composite.connectToOutput(mixer.auxReturn(index))
                    auxTerminator.with(composite.watchSettings(settings))
                    auxTerminator.with(composite)
                }, true))
            })

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