import {Mulberry32, Random} from "./lib/math.js"
import {Fill, Fills, RotaryModel} from "./rotary/model.js"
import {RotaryApp} from "./rotary/app.js"
import {Audio} from "./rotary/audio.js"
import {initAudioScene} from "./rotary/audio.default.js"
import {WorkletModules} from "./dsp/waa.js"
import {MeterWorklet} from "./dsp/meter/worklet.js"
import {LimiterWorklet} from "./dsp/limiter/worklet.js"
import {RotaryWorkletNode} from "./rotary/audio/worklet.js"
import {UIControllerLayout} from "./dom/controls.js"
import {BoundNumericValue, NumericStepper, ObservableValueImpl, PrintMapping} from "./lib/common.js"
import {Linear} from "./lib/mapping.js"

const showError = (message: string) => {
    const preloader = document.getElementById("preloader")
    if (null === preloader) {
        alert(message)
    } else {
        preloader.innerHTML = `<span style="color: #F33">${message}</span>`
    }
}
window.onerror = (message: string) => {
    showError(message)
    return true
}
window.onunhandledrejection = (event) => {
    if (event.reason instanceof Error) {
        showError(event.reason.message)
    } else {
        showError(event.reason)
    }
}

(async () => {
    WorkletModules.register(MeterWorklet, "bin/dsp/meter/processor.js")
    WorkletModules.register(LimiterWorklet, "bin/dsp/limiter/processor.js")
    WorkletModules.register(RotaryWorkletNode, "bin/rotary/audio/processor.js")

    const random: Random = new Mulberry32(0xFFFFFFFF * Math.random())
    const model = new RotaryModel().randomize(random)
    const audio: Audio = await Audio.config(initAudioScene(), model)
    const preview = await audio.initPreview()
    const app = RotaryApp.create(model)
        .installShortcuts(audio, preview)
        .installApplicationMenu(audio)

    const exec = () => {
        const progress = preview.phase()
        app.render(progress)
        requestAnimationFrame(exec)
    }
    requestAnimationFrame(exec)

    document.getElementById("preloader").remove()
    console.log("ready...")
})()