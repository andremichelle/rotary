import {RotaryPlaybackNode} from "./worklets.js"
import {readAudio} from "../lib/common.js"
import {beep, pulsarDelay} from "../lib/dsp.js"
import {BuildAudio, Setup} from "./audio.js"
import {midiToHz} from "../dsp/common.js"
import {Chords} from "../lib/chords.js"

export const buildAudio: BuildAudio = async (setup: Setup) => {
    const context = setup.context
    const rotaryNode = await RotaryPlaybackNode.build(context)
    const updateFormat = () => rotaryNode.updateFormat(setup.model)
    setup.model.addObserver(updateFormat)
    updateFormat()

    const loadSample = async (url: string): Promise<AudioBuffer> => {
        setup.loadInfo(`loading ${url}`)
        return await readAudio(context, url)
    }

    /*rotaryNode.updateSample(0, await loadSample("samples/hang/0.wav"))
    rotaryNode.updateSample(1, await loadSample("samples/hang/1.wav"))
    rotaryNode.updateSample(2, await loadSample("samples/hang/2.wav"))
    rotaryNode.updateSample(3, await loadSample("samples/hang/3.wav"))
    rotaryNode.updateSample(4, await loadSample("samples/hang/4.wav"))
    rotaryNode.updateSample(5, await loadSample("samples/hang/5.wav"))
    rotaryNode.updateSample(6, await loadSample("samples/hang/6.wav"))
    rotaryNode.updateSample(7, await loadSample("samples/hang/7.wav"))
    rotaryNode.updateSample(8, await loadSample("samples/hang/8.wav"))*/

    let index = 0
    {
        const compose = Chords.compose(Chords.Minor, 60, 0, 5)
        for (let i = 0; i < compose.length; i++) {
            rotaryNode.updateSample(index++, await beep(context.sampleRate, midiToHz(compose[i], 440.0)))
        }
    }
    {
        const compose = Chords.compose(Chords.Minor, 60, 3, 5)
        for (let i = 0; i < compose.length; i++) {
            rotaryNode.updateSample(index++, await beep(context.sampleRate, midiToHz(compose[i], 440.0)))
        }
    }

    const wetNode = context.createGain()
    wetNode.gain.value = 0.4
    pulsarDelay(context, rotaryNode, wetNode, 0.125, 0.250, .250, 0.9, 12000, 200)
    const convolverNode = context.createConvolver()
    convolverNode.buffer = await loadSample("impulse/PlateLarge.ogg")
    wetNode.connect(convolverNode).connect(setup.output)
    rotaryNode.connect(setup.output)
}