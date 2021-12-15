const WHITE = "white"
const TRANSPARENT = "rgba(255, 255, 255, 0.0)"
const PI = Math.PI
const PI_HALF = PI / 2.0
const TAU = PI * 2.0

let frame = 0
;

const wrap = (value, bound) => {
    value %= bound
    return value < 0.0 ? value + bound : value
}

const gradient = (context, rx, ry, a0, a1, flip = false) => {
    const gradient = context.createConicGradient(a0, rx, ry)
    const offset = wrap((a1 - a0) / TAU, 1.0)
    if (flip) {
        gradient.addColorStop(0.0, TRANSPARENT)
        gradient.addColorStop(offset, WHITE)
    } else {
        gradient.addColorStop(0.0, WHITE)
        gradient.addColorStop(offset, TRANSPARENT)
    }
    return gradient
}

const arc = (context, rx, ry, r0, r1, a0, a1) => {
    context.beginPath()
    context.arc(rx, ry, r1, a0, a1, false)
    context.arc(rx, ry, r0, a1, a0, true)
    context.closePath()
}

(() => {
    console.log("ready...")
    const canvas = document.querySelector("canvas")
    const context = canvas.getContext("2d")

    const rx = 384
    const ry = 384
    const r0 = 128
    const r1 = 256

    const enterFrame = () => {
        context.clearRect(0.0, 0.0, canvas.width, canvas.height)

        const da = frame * 0.01

        const numSections = 3
        for (let i = 0; i < numSections; i++) {
            const a0 = i / numSections * TAU + da
            const a1 = a0 + TAU / numSections
            context.fillStyle = gradient(context, rx, ry, a0, a1, true)
            arc(context, rx, ry, r0, r1, a0, a1)
            context.fill()
        }

        frame++
        requestAnimationFrame(enterFrame)
    }
    enterFrame()
})();