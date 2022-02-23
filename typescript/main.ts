import {Mulberry32, Random} from "./lib/math.js"
import {RotaryModel} from "./rotary/model/rotary.js"
import {RotaryApp} from "./rotary/app.js"
import {Audio} from "./rotary/audio.js"
import {initAudioScene} from "./rotary/audio.default.js"
import {install} from "./common.js"

(async () => {
    await install()
    const random: Random = new Mulberry32(0xFFFFFFFF * Math.random())
    const model = new RotaryModel().randomize(random)
    const audio: Audio = await Audio.config(initAudioScene(), model)
    const preview = await audio.initPreview()
    const app = RotaryApp.create(model, preview)
        .installShortcuts(audio, preview)
        .installApplicationMenu(audio)
    const exec = () => {
        const progress = preview.position()
        app.render(progress)
        requestAnimationFrame(exec)
    }
    requestAnimationFrame(exec)
    document.getElementById("preloader").remove()
    console.log("ready...")
})()