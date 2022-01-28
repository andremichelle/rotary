import {dbToGain, gainToDb} from "../common.js"
import {UpdateMeterMessage} from "./message.js"

export class MeterWorklet extends AudioWorkletNode {
    static async load(context: AudioContext): Promise<void> {
        return await context.audioWorklet.addModule("bin/dsp/meter/processor.js")
    }

    private minDb: number = -48.0
    private maxDb: number = 3.0
    private labelStepsDb: number = 3.0
    private maxPeaks: Float32Array = new Float32Array(2)
    private maxSquares: Float32Array = new Float32Array(2)
    private maxPeakHoldValue: Float32Array = new Float32Array(2)
    private releasePeakHoldTime: Float32Array = new Float32Array(2)
    private peakHoldDuration: number = 1000.0
    private clipHoldDuration: number = 2000.0
    private height: number = 17
    private meterPadding: number = 16
    private meterWidth: number
    private scale: number

    private readonly canvas: HTMLCanvasElement
    private readonly graphics: CanvasRenderingContext2D
    private readonly gradient: CanvasGradient

    private readonly updater: () => void

    constructor(context: AudioContext, private width: number = 288) {
        super(context, "dsp-meter", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.meterWidth = this.width - this.meterPadding * 2.0

        this.canvas = document.createElement("canvas")
        this.canvas.style.width = this.width + "px"
        this.canvas.style.height = this.height + "px"
        this.graphics = this.canvas.getContext("2d")

        const green = "rgba(60,60,60)"
        const yellow = "rgb(62,62,62)"
        const red = "rgb(160,16,0)"
        this.gradient = this.graphics.createLinearGradient(this.meterPadding, 0, this.meterPadding + this.meterWidth, 0)
        this.gradient.addColorStop(0.0, green)
        this.gradient.addColorStop(this.dbToNorm(-9.0), green)
        this.gradient.addColorStop(this.dbToNorm(-9.0), yellow)
        this.gradient.addColorStop(this.dbToNorm(0.0), yellow)
        this.gradient.addColorStop(this.dbToNorm(0.0), red)
        this.gradient.addColorStop(1.0, red)
        this.scale = NaN

        this.port.onmessage = event => {
            const now = performance.now()
            const message: UpdateMeterMessage = event.data as UpdateMeterMessage
            this.maxPeaks = message.maxPeaks
            this.maxSquares = message.maxSquares
            for (let i = 0; i < 2; ++i) {
                const maxPeak = this.maxPeaks[i]
                if (this.maxPeakHoldValue[i] <= maxPeak) {
                    this.maxPeakHoldValue[i] = maxPeak
                    this.releasePeakHoldTime[i] = now + (1.0 < maxPeak ? this.clipHoldDuration : this.peakHoldDuration)
                }
            }
        }
        this.updater = () => this.update()
        this.update()
    }

    get domElement(): HTMLElement {
        return this.canvas
    }

    update(): void {
        const graphics = this.graphics
        const densityChanged = this.scale !== devicePixelRatio
        if (densityChanged) {
            this.scale = devicePixelRatio
            this.canvas.width = this.width * this.scale
            this.canvas.height = this.height * this.scale
        }
        graphics.save()
        graphics.scale(this.scale, this.scale)
        if (densityChanged) {
            this.renderScale()
        }

        graphics.clearRect(0, 0, this.width, 4)
        graphics.clearRect(0, 13, this.width, 4)
        graphics.fillStyle = "rgba(0, 0, 0, 0.2)"
        const maxGain = dbToGain(this.maxDb)
        this.renderMeter(maxGain, 0, 4)
        this.renderMeter(maxGain, 13, 4)
        graphics.fillStyle = this.gradient
        graphics.globalAlpha = 0.5
        this.renderMeter(this.maxPeaks[0], 0, 4)
        this.renderMeter(this.maxPeaks[1], 13, 4)
        graphics.globalAlpha = 1.0
        this.renderMeter(this.maxSquares[0], 0, 4)
        this.renderMeter(this.maxSquares[1], 13, 4)
        const now = performance.now()
        for (let i = 0; i < 2; ++i) {
            this.maxPeaks[i] *= 0.9
            this.maxSquares[i] *= 0.9
            if (0.0 <= now - this.releasePeakHoldTime[i]) {
                this.maxPeakHoldValue[i] = 0.0
            } else {
                const db = Math.min(this.maxDb, gainToDb(this.maxPeakHoldValue[i]))
                if (db >= this.minDb) {
                    graphics.fillStyle = 0.0 < db ? "rgb(200,200,200)" : "rgb(140,140,140)"
                    graphics.fillRect(this.dbToX(db), i * 13, 1, 4)
                }
            }
        }
        graphics.restore()
        window.requestAnimationFrame(this.updater)
    }

    renderScale() {
        const graphics = this.graphics
        graphics.clearRect(0, 0, this.height, this.width)
        graphics.font = "7px IBM Plex Sans"
        graphics.textBaseline = "middle"
        graphics.textAlign = "center"
        for (let db = this.maxDb; db >= this.minDb; db -= this.labelStepsDb) {
            const x = this.dbToX(db)
            graphics.fillStyle = db <= 0 ? "rgb(70,70,70)" : "rgb(160,26,20)"
            graphics.fillText(db === this.minDb ? "dB" : db.toString(10), x, 9)
        }
    }

    renderMeter(gain: number, y: number, h: number) {
        const db = gainToDb(gain)
        if (db >= this.minDb) {
            const w = Math.floor(this.dbToNorm(Math.min(db, this.maxDb)) * this.meterWidth)
            this.graphics.fillRect(this.meterPadding, y, w + 1, h)
        }
    }

    dbToX(db) {
        return this.meterPadding + Math.round(this.dbToNorm(db) * this.meterWidth)
    }

    dbToNorm(db) {
        return (db - this.minDb) / (this.maxDb - this.minDb)
    }
}