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
        const a0 = this.angleMin + this.rotation;
        const a1 = this.angleMax + this.rotation;
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
        context.arc(0.0, 0.0, this.radiusMax + 0.25, a0, a1, false)
        context.arc(0.0, 0.0, this.radiusMin - 0.25, a1, a0, true)
        context.closePath()
        context.fill()
    }
}

RotarySegment.FILL_FLAT = 0;
RotarySegment.FILL_POSITIVE = 1;
RotarySegment.FILL_NEGATIVE = 2;

class RotaryTrack {
    constructor(numSegments, r0, r1, widthRatio = 0.5, fill = RotarySegment.FILL_POSITIVE) {
        this.segments = []

        this.sign = Math.sign(Math.random() * 2.0 - 1.0)

        const scale = TAU / numSegments
        for (let i = 0; i < numSegments; i++) {
            const a0 = i * scale
            const a1 = a0 + scale * widthRatio
            this.segments.push(new RotarySegment(r0, r1, a0, a1, fill))
        }
    }

    setFrame(value) {
        // map to rotation
    }

    rotateTo(value) {
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

class Rotary {

}

(() => {
    console.log("ready...")
    const canvas = document.querySelector("canvas")
    const context = canvas.getContext("2d")

    const rx = 384
    const ry = 384

    const tracks = [
        new RotaryTrack(3, 64 + 16 * 0, 64 + 16 * 1, 0.5, RotarySegment.FILL_FLAT),
        new RotaryTrack(9, 64 + 16 * 1, 64 + 16 * 2, 0.5, RotarySegment.FILL_FLAT),
        new RotaryTrack(1, 64 + 16 * 2, 64 + 16 * 3, 0.75, RotarySegment.FILL_FLAT),
        new RotaryTrack(2, 64 + 16 * 3, 64 + 16 * 4, 0.25, RotarySegment.FILL_POSITIVE),
        new RotaryTrack(4, 64 + 16 * 4, 64 + 16 * 5, 1.0, RotarySegment.FILL_NEGATIVE),
    ]

    const enterFrame = () => {
        context.clearRect(0.0, 0.0, canvas.width, canvas.height)
        context.save()
        context.translate(rx, ry)

        const rotation = frame * 0.03

        for (let i = 0; i < tracks.length; i++) {
            tracks[i].rotateTo(rotation)
            tracks[i].draw(context)
        }

        context.restore()

        frame++
        requestAnimationFrame(enterFrame)
    }
    enterFrame()
})();