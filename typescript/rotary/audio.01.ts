import {RotaryAutomationNode} from "./worklets.js"
import {RotaryModel} from "./model.js"
import {readAudio} from "../lib/common.js"
import {Generator} from "../dsp/padsynth/generator.js"
import {pulsarDelay} from "../lib/dsp.js"
import {Exp} from "../lib/mapping.js"
import {Harmonic} from "../dsp/padsynth/data.js"
import {midiToHz} from "../dsp/common.js"
import {BuildAudio, Setup} from "./audio.js"

export const buildAudio: BuildAudio = async (setup: Setup) => {
    const context = setup.context
    const random = setup.random
    const rotaryAutomationNode = await RotaryAutomationNode.build(context)
    const updateFormat = () => rotaryAutomationNode.updateFormat(setup.model)
    setup.model.addObserver(updateFormat)
    updateFormat()

    const convolverNode = context.createConvolver()
    convolverNode.normalize = false
    convolverNode.buffer = await readAudio(context, "./impulse/PlateMedium.ogg")

    const tracksGain = context.createGain()
    tracksGain.gain.value = 0.05

    const channelSplitter = context.createChannelSplitter(RotaryModel.MAX_TRACKS)
    rotaryAutomationNode.connect(channelSplitter)

    const notes = new Uint8Array([60, 62, 65, 67, 69, 72, 74, 77, 79, 81])

    const generator = new Generator(1 << 16, context.sampleRate)
    for (let i = 0; i < RotaryModel.MAX_TRACKS; i++) {
        const gainNode = context.createGain()
        gainNode.gain.value = 0.0
        channelSplitter.connect(gainNode.gain, i)

        const pannerNode = context.createStereoPanner()
        pannerNode.pan.value = random.nextDouble(-1.0, 1.0)

        const note = random.nextElement(notes)
        const hz = midiToHz(note)
        const bandWidth = new Exp(0.0001, 0.25).y(random.nextDouble(0.0, 1.0))
        const harmonics = [
            new Harmonic(hz / context.sampleRate, 1.0, bandWidth),
            new Harmonic(hz / context.sampleRate * 2.0, 0.2500, bandWidth * 2.0),
            new Harmonic(hz / context.sampleRate * 2.0, 0.0625, bandWidth * 3.0),
        ]
        const wavetable = await generator.render(harmonics)
        const buffer = context.createBuffer(1, wavetable.length, context.sampleRate)
        buffer.copyToChannel(wavetable, 0)
        const bufferSource = context.createBufferSource()
        bufferSource.buffer = buffer
        bufferSource.playbackRate.value = random.nextDouble(-0.999, 1.001)
        bufferSource.loop = true
        bufferSource.start()
        bufferSource.connect(gainNode).connect(pannerNode).connect(tracksGain)
    }

    tracksGain.connect(setup.output)
    const wetGain = context.createGain()
    wetGain.gain.value = 0.8
    pulsarDelay(context, tracksGain, wetGain, 0.500, 0.125, 0.750, 0.99, 720.0, 480.0)

    wetGain.connect(convolverNode).connect(setup.output)
}