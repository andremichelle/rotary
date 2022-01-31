import {dbToGain, gainToDb} from "../common.js"
import {UpdateMeterMessage} from "./message.js"

export class MeterWorklet extends AudioWorkletNode {
    static async load(context: AudioContext): Promise<void> {
        return await context.audioWorklet.addModule("bin/dsp/meter/processor.js")
    }

    private readonly width: number
    private readonly height: number = 17
    private readonly meterMargin: number = 5
    private readonly meterWidth: number = 5
    private readonly meterSegmentWidth: number = 15
    private readonly meterSegmentGap: number = 1
    private readonly meterSegmentCount: number = 16

    private labelStepsDb: number = 3.0
    private readonly maxDb: number = 3.0
    private readonly minDb: number = this.maxDb - this.labelStepsDb * (this.meterSegmentCount - 1)
    private maxPeaks: Float32Array = new Float32Array(2)
    private maxSquares: Float32Array = new Float32Array(2)
    private maxPeakHoldValue: Float32Array = new Float32Array(2)
    private releasePeakHoldTime: Float32Array = new Float32Array(2)
    private peakHoldDuration: number = 1000.0
    private clipHoldDuration: number = 2000.0
    private scale: number

    private readonly canvas: HTMLCanvasElement
    private readonly graphics: CanvasRenderingContext2D
    private readonly gradient: CanvasGradient

    private readonly updater: () => void

    constructor(context: AudioContext) {
        super(context, "dsp-meter", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.meterWidth = this.meterSegmentCount * (this.meterSegmentWidth + this.meterSegmentGap) - this.meterSegmentGap
        this.width = this.meterMargin * 2.0 + this.meterWidth

        this.canvas = document.createElement("canvas")
        this.canvas.style.width = this.width + "px"
        this.canvas.style.height = this.height + "px"
        this.graphics = this.canvas.getContext("2d")

        const green = "rgba(40,40,40)"
        const yellow = "rgb(40,40,40)"
        const red = "rgb(160,16,0)"
        this.gradient = this.graphics.createLinearGradient(this.meterMargin, 0, this.meterMargin + this.meterWidth, 0)
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
        graphics.fillStyle = "rgba(0, 0, 0, 0.1)"
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
                    graphics.fillStyle = 0.0 < db ? "rgb(160,16,0)" : "rgb(100,100,100)"
                    graphics.fillRect(this.dbToX(db) - 1, i * 13, 1, 4)
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
        for (let i = 0; i < this.meterSegmentCount; i++) {
            const db = this.maxDb - this.labelStepsDb * i
            const x = this.meterMargin + (this.meterSegmentWidth + this.meterSegmentGap) * (this.meterSegmentCount - i - 1) + (this.meterSegmentWidth >> 1)
            graphics.fillStyle = db <= 0 ? "rgb(70,70,70)" : "rgb(160,26,20)"
            if (db > this.minDb) {
                graphics.fillText(db.toString(10), x, 9)
            } else {
                graphics.fillText("dB", x, 9)
            }
        }
    }

    renderMeter(gain: number, y: number, h: number) {
        const db = gainToDb(gain)
        const dbIndex = Math.max(0, this.dbToIndex(db)) | 0
        for (let i = 0; i < dbIndex; i++) {
            this.graphics.fillRect(this.meterMargin + (this.meterSegmentWidth + this.meterSegmentGap) * i, y, this.meterSegmentWidth, h)
        }
    }

    dbToX(db: number): number {
        return this.meterMargin + this.dbToIndex(db) * (this.meterSegmentWidth + this.meterSegmentGap)
    }

    dbToIndex(db: number): number {
        return this.meterSegmentCount - Math.floor((this.maxDb - db) / this.labelStepsDb) - 1
    }

    dbToNorm(db: number): number {
        return 1.0 - Math.floor((this.maxDb - db) / this.labelStepsDb + 1.0) / this.meterSegmentCount
    }
}