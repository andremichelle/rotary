import {Func, Mulberry32, Random} from "./lib/math.js"
import {RotaryModel} from "./rotary/model.js"
import {RotaryApp} from "./rotary/app.js"
import {installApplicationMenu} from "./rotary/env.js"
import {buildAudio} from "./rotary/audio.02.js"
import {MeterWorklet} from "./dsp/meter/worklet.js"
import {Dom} from "./dom/common.js"
import {CShapeInjective} from "./rotary/injective.js"

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
    const random: Random = new Mulberry32(0xFFFFFFFF * Math.random())
    const model = new RotaryModel().test()//.randomize(random)
    const app = RotaryApp.create(model)

    installApplicationMenu(document.querySelector("nav#app-menu"), model, app)

    const context = new AudioContext()
    await context.suspend()
    await MeterWorklet.load(context)
    const meter = new MeterWorklet(context)
    meter.connect(context.destination)
    await buildAudio(context, meter, model, random)

    Dom.replaceElement(meter.domElement, document.getElementById("meter"))

    const playButton = document.querySelector("[data-parameter='transport']") as HTMLInputElement
    context.onstatechange = () => playButton.checked = context.state === "running"
    playButton.onchange = async () => {
        if (playButton.checked) await context.resume()
        else await context.suspend()
    }

    const exec = () => {
        const progress = context.currentTime / model.loopDuration.get()
        app.render(progress/* - Math.floor(progress)*/) // TODO back to modular
        requestAnimationFrame(exec)
    }
    requestAnimationFrame(exec)

    document.getElementById("preloader").remove()
    console.log("ready...")
})()


/*
const m = new CShapeInjective()
const fwd = x => m.fx(x)
const inv = y => m.fy(y)
const input = 0.504308390022663
const fragments = 1.0
const frequency = 2.0
const delta = 123.25
const trans = Func.stairsInverse(inv, input, fragments, frequency, delta, true)
const output = Func.stairsMap(fwd, trans, fragments, frequency, delta, true)
console.log(`input: ${input}, trans: ${trans}, output: ${output}, io: ${Math.abs(output - input) < 1e-7}`)
*/
