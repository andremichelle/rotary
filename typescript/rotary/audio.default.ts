import {dbToGain, interpolateParameterValueIfRunning} from "../audio/common.js"
import {
    CompositeSettings,
    Convolver,
    ConvolverSettings,
    DefaultComposite,
    Flanger,
    FlangerSettings,
    PulsarDelay,
    PulsarDelaySettings
} from "../audio/composite.js"
import {LimiterWorklet} from "../audio/limiter/worklet.js"
import {NoUIMeterWorklet} from "../audio/meter/worklet.js"
import {Metronome} from "../audio/metronome/worklet.js"
import {Channelstrip, Mixer} from "../audio/mixer.js"
import {Transport} from "../audio/sequencing.js"
import {Updater} from "../dom/common.js"
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
import {RotaryWorkletNode} from "./audio/worklet.js"
import {RotaryModel} from "./model/rotary.js"
import {RotaryTrackModel} from "./model/track.js"

export const initAudioScene = (): AudioScene => {
    return {
        loadModules(context: BaseAudioContext): Promise<any> {
            return Promise.all([
                context.audioWorklet.addModule("bin/audio/lfo/processor.js"),
                context.audioWorklet.addModule("bin/audio/meter/processor.js"),
                context.audioWorklet.addModule("bin/audio/limiter/processor.js"),
                context.audioWorklet.addModule("bin/audio/metronome/processor.js"),
                context.audioWorklet.addModule("bin/rotary/audio/processor.js"),
            ])
        },
        async build(context: BaseAudioContext, output: AudioNode, model: RotaryModel, boot: Boot): Promise<AudioSceneController> {
            const terminator = new Terminator()
            const transport: Transport = new Transport()
            const metronome: Metronome = new Metronome(context)
            terminator.with(model.bpm.addObserver(value => metronome.setBpm(value), true))
            terminator.with(metronome.listenToTransport(transport))
            const rotaryNode = new RotaryWorkletNode(context, model)
            terminator.with(rotaryNode.listenToTransport(transport))
            const meter = new NoUIMeterWorklet(context, RotaryModel.MAX_TRACKS, 2)
            const limiterWorklet = new LimiterWorklet(context)
            const loadSample = (url: string): Promise<AudioBuffer> => boot.registerProcess(readAudio(context, url))

            let index = 0

            for (let i = 0; i <= 19; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/kicks/${i}.ogg`))
            }
            for (let i = 0; i <= 19; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/clicks/${i}.ogg`))
            }
            for (let i = 0; i <= 59; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/cracks/${i}.ogg`))
            }
            for (let i = 0; i <= 74; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/glitch/${i}.ogg`))
            }
            for (let i = 0; i <= 9; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/snares/${i}.ogg`))
            }
            for (let i = 0; i <= 23; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/neuro/${i}.ogg`))
            }
            for (let i = 0; i <= 442; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/blips/${i}.ogg`))
            }
            for (let i = 0; i <= 63; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/gameboy/${i}.ogg`))
            }
            for (let i = 0; i <= 12; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/vinyl/${i}.ogg`))
            }
            for (let i = 0; i <= 72; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/switches/${i}.ogg`))
            }
            for (let i = 0; i <= 13; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/stabs/${i}.ogg`))
            }
            for (let i = 0; i <= 89; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/fx/${i}.ogg`))
            }
            for (let i = 0; i <= 116; i++) {
                rotaryNode.uploadSample(index++, loadSample(`samples/chords/${i}.ogg`))
            }

            console.log(`loading ${index} samples...`)

            for (let lineIndex = 0; lineIndex < RotaryModel.MAX_TRACKS; lineIndex++) {
                rotaryNode.connect(meter, lineIndex, lineIndex)
            }

            const mixer: Mixer = new Mixer(context, RotaryModel.NUM_AUX)
            const map: Map<RotaryTrackModel, Terminable> = new Map()
            const channelstrips: Map<RotaryTrackModel, Channelstrip> = new Map<RotaryTrackModel, Channelstrip>()
            const addTrack = (track: RotaryTrackModel): Terminable => {
                const terminator: Terminator = new Terminator()
                const channelstrip: Channelstrip = mixer.createChannelstrip()
                channelstrips.set(track, channelstrip)
                terminator.with(track.mute.addObserver(mute => channelstrip.setMute(mute), true))
                terminator.with(track.solo.addObserver(solo => channelstrip.setSolo(solo), true))
                terminator.with(track.volume.addObserver(volume => channelstrip.setVolume(volume), true))
                terminator.with(track.panning.addObserver(panning => channelstrip.setPanning(panning), true))
                for (let auxIndex = 0; auxIndex < RotaryModel.NUM_AUX; auxIndex++) {
                    terminator.with(track.aux[auxIndex]
                        .addObserver(volume => channelstrip.setAuxSend(auxIndex, volume), true))
                }
                terminator.with({terminate: () => mixer.removeChannelstrip(channelstrip)})
                return terminator
            }
            const connectionUpdater = new Updater(() => {
                for (const channelstrip of channelstrips.values()) {
                    channelstrip.disconnect()
                }
                model.tracks.forEach((item, index) =>
                    channelstrips.get(item).connectToInput(rotaryNode, index))
            })
            terminator.with(model.tracks.addObserver((event: CollectionEvent<RotaryTrackModel>) => {
                const track = event.item
                if (event.type === CollectionEventType.Add) {
                    map.set(track, addTrack(track))
                } else if (event.type === CollectionEventType.Remove) {
                    channelstrips.delete(track)
                    map.get(track).terminate()
                    map.delete(track)
                }
                connectionUpdater.requestUpdate()
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

            const masterGain = context.createGain()
            terminator.with(model.master_gain.addObserver(db => interpolateParameterValueIfRunning(context, masterGain.gain, dbToGain(db)), true))
            terminator.with(model.limiter_threshold.addObserver(db => limiterWorklet.threshold = db, true))
            mixer.masterOutput().connect(masterGain)
            masterGain.connect(limiterWorklet)
            metronome.connect(output)
            limiterWorklet.connect(output)
            await boot.waitForCompletion()
            return Promise.resolve({
                position: () => rotaryNode.position(),
                latency: () => limiterWorklet.lookahead,
                meter: meter,
                metronome: metronome,
                transport: transport,
                terminate: () => terminator.terminate()
            })
        }
    }
}