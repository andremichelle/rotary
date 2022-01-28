import {Mulberry32, Random} from "./lib/math.js"
import {RotaryModel} from "./rotary/model.js"
import {RotaryApp} from "./rotary/app.js"
import {installApplicationMenu} from "./rotary/env.js"
import {initAudio} from "./rotary/audio.02.js"
import {Audio} from "./rotary/audio.js"

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
    const audio = await Audio.create(initAudio(), model)
    const app = RotaryApp.create(model)

    installApplicationMenu(document.querySelector("nav#app-menu"), model, audio, app)

    const exec = () => {
        const progress = audio.currentTime / model.loopDuration.get()
        app.render(progress)
        requestAnimationFrame(exec)
    }
    requestAnimationFrame(exec)

    document.getElementById("preloader").remove()
    console.log("ready...")
})()