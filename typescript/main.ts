import {Mulberry32, Random} from "./lib/math.js"
import {RotaryModel} from "./rotary/model.js"
import {RotaryApp} from "./rotary/app.js"
import {Audio} from "./rotary/audio.js"
import {initAudioScene} from "./rotary/audio.default.js"

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
    const model = new RotaryModel().randomize(random)
    const audio: Audio = await Audio.config(initAudioScene(), model)
    const preview = await audio.initPreview()
    const app = RotaryApp.create(model).installApplicationMenu(audio)

    const exec = () => {
        const progress = preview.phase()
        app.render(progress)
        requestAnimationFrame(exec)
    }
    requestAnimationFrame(exec)

    document.getElementById("preloader").remove()
    console.log("ready...")
})()