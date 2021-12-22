const WHITE = "white"
const TRANSPARENT = "rgba(255, 255, 255, 0.0)"
const PI = Math.PI
const TAU = PI * 2.0
const FILL_FLAT = 0
const FILL_POSITIVE = 1
const FILL_NEGATIVE = 2
const wrap = (value, bound) => {
    value %= bound
    return value < 1e-13 ? value + bound : value
}
const MoveFunction = Object.freeze({
    Reverse: fx => x => 1.0 - fx(x),
    AccAndStop: exp => x => Math.pow(x - Math.floor(x), exp),
    StopAndGo: x => 1.0 - Math.min(1.0, 2.0 * (2.0 * x - Math.floor(2.0 * x))),
    Sine: x => Math.sin(x * PI),
    OddShape: shape => {
        // https://www.desmos.com/calculator/bpbuua3l0j
        const o = Math.pow(2.0, shape)
        const c = Math.pow(2.0, o - 1)
        return x => c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), o) + 0.5
    }
})

const MOVEMENTS = [
    MoveFunction.StopAndGo,
    MoveFunction.Sine,
    MoveFunction.AccAndStop(2.0),
    MoveFunction.AccAndStop(3.0),
    MoveFunction.OddShape(-1.0),
    MoveFunction.OddShape(1.0),
    MoveFunction.OddShape(2.0),
]

let frame = 0
;


class RotaryTrack {
    constructor(numSegments, width, widthRatio, length, lengthRatio, fill, moveFunc, reverse) {
        this.numSegments = numSegments
        this.width = width
        this.widthRatio = widthRatio
        this.length = length
        this.lengthRatio = lengthRatio
        this.fill = fill
        this.reverse = reverse
        this.moveFunc = moveFunc
        this.phase = 0.0
        this.phaseOffset = 0.0
    }

    rotateTo(value) {
        this.phase = (this.moveFunc(value - Math.floor(value))) * (this.reverse ? -1 : 1) + this.phaseOffset
    }

    draw(context, radius) {
        const scale = this.length / this.numSegments
        const radiusMax = radius + Math.max(this.width * this.widthRatio, 1.0)
        for (let i = 0; i < this.numSegments; i++) {
            const angleMin = i * scale + this.phase
            const angleMax = angleMin + scale * this.lengthRatio
            this.drawSection(context, radius, radiusMax, angleMin, angleMax, this.fill)
        }
    }

    drawSection(context, radiusMin, radiusMax, angleMin, angleMax, fill) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)

        const a0 = angleMin
        const a1 = angleMax
        const gradient = context.createConicGradient(a0, 0.0, 0.0)
        if (fill === FILL_FLAT) {
            context.fillStyle = WHITE
        } else {
            const offset = Math.min(wrap(Math.abs(a1 - a0), 1.0), 1.0)
            if (fill === FILL_POSITIVE) {
                gradient.addColorStop(0.0, TRANSPARENT)
                gradient.addColorStop(offset, WHITE)
                gradient.addColorStop(offset, TRANSPARENT) // eliminates tiny glitches at the end of the tail
            } else if (fill === FILL_NEGATIVE) {
                gradient.addColorStop(0.0, WHITE)
                gradient.addColorStop(offset, TRANSPARENT)
            }
            context.fillStyle = gradient
        }
        context.beginPath()
        context.arc(0.0, 0.0, radiusMax, a0 * TAU, a1 * TAU, false)
        context.arc(0.0, 0.0, radiusMin, a1 * TAU, a0 * TAU, true)
        context.closePath()
        context.fill()
    }
}

class Rotary {
    constructor(tracks) {
        this.tracks = tracks
    }

    updateFrame(index) {
        for (let i = 0; i < this.tracks.length; i++) {
            this.tracks[i].rotateTo(index / 240)
        }
    }

    draw(context) {
        let radius = 24
        for (let i = 0; i < this.tracks.length; i++) {
            const track = this.tracks[i];
            track.draw(context, radius)
            radius += track.width
        }
    }
}

class RotaryBuilder {
    static create() {
        const tracks = []
        for (let i = 0; i < 12; i++) {
            const numSegments = 1 + Math.floor(Math.random() * 9)
            if (Math.random() < 0.1) ++i
            const lengthRatioExp = -Math.floor(Math.random() * 3)
            const lengthRatio = 0 === lengthRatioExp ? 1.0 : Math.random() < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp)
            tracks.push(new RotaryTrack(
                0 === lengthRatioExp ? 1 : numSegments,
                12.0, Math.random(), Math.random() < 0.1 ? 0.75 : 1.0, lengthRatio, 2 === numSegments ? FILL_POSITIVE : FILL_FLAT,
                MOVEMENTS[Math.floor(Math.random() * MOVEMENTS.length)], true))
        }
        return new Rotary(tracks)
    }
}

(() => {
    console.log("ready...")
    const canvas = document.querySelector("canvas")
    const context = canvas.getContext("2d", {alpha: true})

    const rx = 384
    const ry = 384
    const size = 768

    const rotary = RotaryBuilder.create()

    const enterFrame = () => {
        const ratio = Math.ceil(devicePixelRatio);
        canvas.width = size * ratio;
        canvas.height = size * ratio;
        canvas.style.transform = `scale(${1.0 / ratio})`;

        context.clearRect(0.0, 0.0, size, size)
        context.scale(ratio, ratio)
        rotary.updateFrame(frame)
        context.save()
        context.translate(rx, ry)
        rotary.draw(context)
        context.restore()

        frame++
        requestAnimationFrame(enterFrame)
    }
    enterFrame()
})();