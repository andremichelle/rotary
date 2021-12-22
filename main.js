const WHITE = "white"
const TRANSPARENT = "rgba(255, 255, 255, 0.0)"
const PI = Math.PI
const PI_HALF = PI / 2.0
const TAU = PI * 2.0

let frame = -60
;

class RotarySegment {
    constructor(radiusMin, radiusMax, angleMin = 0.0, angleMax = TAU, fill = RotarySegment.FILL_FLAT) {
        console.assert(radiusMin < radiusMax, "radiusMax must be greater then radiusMin")
        console.assert(angleMin < angleMax, "angleMax must be greater then angleMin")

        this.radiusMin = radiusMin
        this.radiusMax = radiusMax
        this.angleMin = angleMin
        this.angleMax = angleMax
        this.fill = fill

        this.rotation = 0.0
    }

    draw(context) {
        const wrap = (value, bound) => {
            value %= bound
            return value < 1e-13 ? value + bound : value
        }
        const ad = this.rotation * TAU;
        const a0 = this.angleMin + ad;
        const a1 = this.angleMax + ad;
        const gradient = context.createConicGradient(a0, 0.0, 0.0)
        if (this.fill === RotarySegment.FILL_FLAT) {
            context.fillStyle = WHITE
        } else {
            const offset = Math.min(wrap(Math.abs(a1 - a0), TAU) / TAU, 1.0)
            if (this.fill === RotarySegment.FILL_POSITIVE) {
                gradient.addColorStop(0.0, TRANSPARENT)
                gradient.addColorStop(offset, WHITE)
                gradient.addColorStop(offset, TRANSPARENT) // eliminates tiny glitches at the end of the tail
            } else {
                gradient.addColorStop(0.0, WHITE)
                gradient.addColorStop(offset, TRANSPARENT)
            }
            context.fillStyle = gradient
        }
        context.beginPath()
        context.arc(0.0, 0.0, this.radiusMax, a0, a1, false)
        context.arc(0.0, 0.0, this.radiusMin, a1, a0, true)
        context.closePath()
        context.fill()
    }
}

RotarySegment.FILL_FLAT = 0;
RotarySegment.FILL_POSITIVE = 1;
RotarySegment.FILL_NEGATIVE = 2;

/**
 * RotaryTrack properties:
 *  index in track-array
 *  numSegments
 *  width
 *  widthRatio
 *  radian
 *  radianRatio
 *  excludes?
 *  direction
 *  movement
 *  fill
 */

class RotaryTrack {
    // TODO Define r0, r1 in runtime by accumulating track-widths
    constructor(numSegments, r0, r1, widthRatio = 1.0, lengthRatio = 0.5, fill = RotarySegment.FILL_POSITIVE) {
        this.segments = []

        this.sign = Math.sign(Math.random() * 2.0 - 1.0)
        this.movement = RotaryTrack.MOVEMENTS[Math.floor(Math.random() * RotaryTrack.MOVEMENTS.length)]

        const scale = TAU / numSegments
        for (let i = 0; i < numSegments; i++) {
            const a0 = i * scale
            const a1 = a0 + scale * lengthRatio
            const radius = (r0 + r1) * 0.5
            const widthHalf = Math.max((r1 - r0) * 0.5 * widthRatio, 0.5)
            if (Math.random() < 0.9) {
                this.segments.push(new RotarySegment(radius - widthHalf, radius + widthHalf, a0, a1, fill))
            }
        }
    }

    rotateTo(value) {
        value -= Math.floor(value)
        value = this.movement(value)
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].rotation = value * this.sign
        }
    }

    draw(context) {
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].draw(context)
        }
    }
}

RotaryTrack.AccAndStop = exp => x => Math.pow(x - Math.floor(x), exp)
RotaryTrack.StopAndGo = x => 1.0 - Math.min(1.0, 2.0 * (2.0 * x - Math.floor(2.0 * x)))
RotaryTrack.Sine = x => Math.sin(x * PI)
RotaryTrack.OddShape = shape => {
    // https://www.desmos.com/calculator/bpbuua3l0j
    const o = Math.pow(2.0, shape)
    const c = Math.pow(2.0, o - 1)
    return x => c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), o) + 0.5
}

RotaryTrack.MOVEMENTS = [
    RotaryTrack.StopAndGo,
    RotaryTrack.Sine,
    RotaryTrack.AccAndStop(2.0),
    RotaryTrack.AccAndStop(3.0),
    RotaryTrack.OddShape(-2.0),
    RotaryTrack.OddShape(-1.0),
    RotaryTrack.OddShape(1.0),
    RotaryTrack.OddShape(2.0),
]

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
        for (let i = 0; i < this.tracks.length; i++) {
            this.tracks[i].draw(context)
        }
    }
}

class RotaryBuilder {
    static create() {
        const tracks = []
        for (let i = 0; i < 12; i++) {
            const numSegments = 1 + Math.floor(Math.random() * 9)
            const r0 = 24 + 12 * i
            if (Math.random() < 0.1) ++i
            const r1 = 24 + 12 * (i + 1)
            const lengthRatioExp = -Math.floor(Math.random() * 3)
            const lengthRatio = 0 === lengthRatioExp ? 1.0 : Math.random() < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp)
            const fill = RotarySegment.FILL_FLAT
            tracks.push(new RotaryTrack(0 === lengthRatioExp ? 1 : numSegments, r0, r1, Math.random(), lengthRatio, 2 === numSegments ? RotarySegment.FILL_POSITIVE : fill))
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