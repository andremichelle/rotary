// TODO Move to typescript

const WHITE = "white"
const TRANSPARENT = "rgba(255, 255, 255, 0.0)"
const PI = Math.PI
const TAU = PI * 2.0
const FILL_FLAT = 0
const FILL_STROKE = 1
const FILL_POSITIVE = 2
const FILL_NEGATIVE = 3
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
        this.segments = numSegments
        this.width = width
        this.widthRatio = widthRatio
        this.length = length
        this.lengthRatio = lengthRatio
        this.fill = fill
        this.reverse = reverse
        this.moveFunc = moveFunc
        this.phaseOffset = 0.0
    }

    draw(context, radiusMin, position) {
        const scale = this.length / this.segments
        const phase = this.moveFunc(position - Math.floor(position)) * (this.reverse ? -1 : 1) + this.phaseOffset
        const thickness = Math.max(this.width * this.widthRatio, 1.0) * 0.5
        const radiusAverage = radiusMin + this.width * 0.5;
        const r0 = radiusAverage - thickness
        const r1 = radiusAverage + thickness
        for (let i = 0; i < this.segments; i++) {
            const angleMin = i * scale + phase
            const angleMax = angleMin + scale * this.lengthRatio
            this.drawSection(context, r0, r1, angleMin, angleMax, this.fill)
        }
    }

    drawSection(context, radiusMin, radiusMax, angleMin, angleMax, fill) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`)
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`)
        const radianMin = angleMin * TAU
        const radianMax = angleMax * TAU
        if (fill === FILL_FLAT) {
            context.fillStyle = WHITE
        } else if (fill === FILL_STROKE) {
            context.strokeStyle = WHITE
        } else {
            const gradient = context.createConicGradient(radianMin, 0.0, 0.0)
            const offset = Math.min((angleMax - angleMin) % 1.0, 1.0)
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
        context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false)
        context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true)
        context.closePath()
        if (fill === FILL_STROKE) {
            context.stroke()
        } else {
            context.fill()
        }
    }
}

class Rotary {
    constructor(tracks, radiusMin) {
        this.tracks = tracks
        this.radiusMin = radiusMin
    }

    draw(context, position) {
        let radiusMin = this.radiusMin
        for (let i = 0; i < this.tracks.length; i++) {
            const track = this.tracks[i]
            track.draw(context, radiusMin, position)
            radiusMin += track.width
        }
    }

    measureRadius() {
        return this.tracks.reduce((acc, track) => acc + track.width, this.radiusMin)
    }
}

const create = () => {
    const tracks = []
    for (let i = 0; i < 12; i++) {
        const numSegments = 1 + Math.floor(Math.random() * 9)
        if (Math.random() < 0.1) ++i
        const lengthRatioExp = -Math.floor(Math.random() * 3)
        const lengthRatio = 0 === lengthRatioExp ? 1.0 : Math.random() < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp)
        tracks.push(new RotaryTrack(
            0 === lengthRatioExp ? 1 : numSegments,
            12.0, Math.random(), Math.random() < 0.1 ? 0.75 : 1.0, lengthRatio, 2 === numSegments ? FILL_POSITIVE : Math.random() < 0.2 ? FILL_STROKE : FILL_FLAT,
            MOVEMENTS[Math.floor(Math.random() * MOVEMENTS.length)], true))
    }
    return new Rotary(tracks, 24)
}
const create2 = () => {
    const tracks = []
    for (let i = 0; i < 12; i++) {
        tracks.push(new RotaryTrack(
            2,
            Math.random() < 0.1 ? 24.0 : 12.0, 1.0, 1.0, 1.0, FILL_FLAT,
            MOVEMENTS[Math.floor(Math.random() * MOVEMENTS.length)], false))
    }
    return new Rotary(tracks, 24)
}

(() => {
    console.log("ready...")
    const canvas = document.querySelector("canvas")
    const labelSize = document.querySelector("label.size");
    const context = canvas.getContext("2d", {alpha: true})

    const rotary = create()

    const enterFrame = () => {
        const size = rotary.measureRadius() * 2
        const ratio = Math.ceil(devicePixelRatio)
        canvas.width = size * ratio
        canvas.height = size * ratio
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        labelSize.textContent = `${size}`

        context.clearRect(0.0, 0.0, size, size)
        context.save()
        context.scale(ratio, ratio)
        context.translate(size >> 1, size >> 1)
        rotary.draw(context, frame / 320.0)
        context.restore()

        frame++
        requestAnimationFrame(enterFrame)
    }
    enterFrame()
})();