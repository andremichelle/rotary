var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { dbToGain, gainToDb } from "../common.js";
export class MeterWorklet extends AudioWorkletNode {
    constructor(context) {
        super(context, "dsp-meter", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.meterMargin = 5;
        this.meterSegmentWidth = 12;
        this.meterSegmentGap = 2;
        this.meterSegmentCount = 16;
        this.meterWidth = this.meterSegmentCount * (this.meterSegmentWidth + this.meterSegmentGap) - this.meterSegmentGap;
        this.width = this.meterMargin * 2.0 + this.meterWidth;
        this.height = 17;
        this.labelStepsDb = 3.0;
        this.maxDb = 3.0;
        this.minDb = this.maxDb - this.labelStepsDb * (this.meterSegmentCount - 1);
        this.maxPeaks = new Float32Array(2);
        this.maxSquares = new Float32Array(2);
        this.maxPeakHoldValue = new Float32Array(2);
        this.releasePeakHoldTime = new Float32Array(2);
        this.peakHoldDuration = 1000.0;
        this.clipHoldDuration = 2000.0;
        this.scale = NaN;
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";
        this.graphics = this.canvas.getContext("2d");
        const lowGain = "rgba(60,60,60)";
        const highGain = "rgb(60,60,60)";
        const clipGain = "rgb(160,16,0)";
        this.gradient = this.graphics.createLinearGradient(this.meterMargin, 0, this.meterMargin + this.meterWidth, 0);
        this.gradient.addColorStop(0.0, lowGain);
        this.gradient.addColorStop(this.dbToNorm(-9.0), lowGain);
        this.gradient.addColorStop(this.dbToNorm(-9.0), highGain);
        this.gradient.addColorStop(this.dbToNorm(0.0), highGain);
        this.gradient.addColorStop(this.dbToNorm(0.0), clipGain);
        this.gradient.addColorStop(1.0, clipGain);
        this.port.onmessage = event => {
            const now = performance.now();
            const message = event.data;
            this.maxPeaks.set(message.maxPeaks, 0);
            this.maxSquares.set(message.maxSquares, 0);
            for (let i = 0; i < 2; ++i) {
                const maxPeak = this.maxPeaks[i];
                if (this.maxPeakHoldValue[i] <= maxPeak) {
                    this.maxPeakHoldValue[i] = maxPeak;
                    this.releasePeakHoldTime[i] = now + (1.0 < maxPeak ? this.clipHoldDuration : this.peakHoldDuration);
                }
            }
        };
        this.updater = () => this.update();
        this.update();
    }
    static load(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield context.audioWorklet.addModule("bin/dsp/meter/processor.js");
        });
    }
    get domElement() {
        return this.canvas;
    }
    update() {
        const graphics = this.graphics;
        const densityChanged = this.scale !== devicePixelRatio;
        if (densityChanged) {
            this.scale = devicePixelRatio;
            this.canvas.width = this.width * this.scale;
            this.canvas.height = this.height * this.scale;
        }
        graphics.save();
        graphics.scale(this.scale, this.scale);
        if (densityChanged) {
            this.renderScale();
        }
        graphics.clearRect(0, 0, this.width, 4);
        graphics.clearRect(0, 13, this.width, 4);
        graphics.fillStyle = "rgba(0, 0, 0, 0.2)";
        const maxGain = dbToGain(this.maxDb);
        this.renderMeter(maxGain, 0, 4);
        this.renderMeter(maxGain, 13, 4);
        graphics.fillStyle = this.gradient;
        graphics.globalAlpha = 0.8;
        this.renderMeter(this.maxPeaks[0], 0, 4);
        this.renderMeter(this.maxPeaks[1], 13, 4);
        graphics.globalAlpha = 1.0;
        this.renderMeter(this.maxSquares[0], 0, 4);
        this.renderMeter(this.maxSquares[1], 13, 4);
        const now = performance.now();
        for (let i = 0; i < 2; ++i) {
            this.maxPeaks[i] *= 0.97;
            this.maxSquares[i] *= 0.97;
            if (0.0 <= now - this.releasePeakHoldTime[i]) {
                this.maxPeakHoldValue[i] = 0.0;
            }
            else {
                const db = Math.min(this.maxDb, gainToDb(this.maxPeakHoldValue[i]));
                if (db >= this.minDb) {
                    graphics.fillStyle = 0.0 < db ? "rgb(160,16,0)" : "rgb(100,100,100)";
                    graphics.fillRect(this.dbToX(db) - 1, i * 13, 1, 4);
                }
            }
        }
        graphics.restore();
        window.requestAnimationFrame(this.updater);
    }
    renderScale() {
        const graphics = this.graphics;
        graphics.clearRect(0, 0, this.height, this.width);
        graphics.font = "7px IBM Plex Sans";
        graphics.textBaseline = "middle";
        graphics.textAlign = "center";
        for (let i = 0; i < this.meterSegmentCount; i++) {
            const db = this.maxDb - this.labelStepsDb * i;
            const x = this.meterMargin + (this.meterSegmentWidth + this.meterSegmentGap) * (this.meterSegmentCount - i - 1) + (this.meterSegmentWidth >> 1);
            graphics.fillStyle = db <= 0 ? "rgb(60,60,60)" : "rgb(160,26,20)";
            if (db > this.minDb) {
                graphics.fillText(db.toString(10), x, 9);
            }
            else {
                graphics.fillText("dB", x, 9);
            }
        }
    }
    renderMeter(gain, y, h) {
        const db = gainToDb(gain);
        const dbIndex = Math.max(1, this.dbToIndex(db)) | 0;
        for (let i = 0; i < dbIndex; i++) {
            this.graphics.fillRect(this.meterMargin + (this.meterSegmentWidth + this.meterSegmentGap) * i, y, this.meterSegmentWidth, h);
        }
    }
    dbToX(db) {
        return this.meterMargin + this.dbToIndex(db) * (this.meterSegmentWidth + this.meterSegmentGap);
    }
    dbToIndex(db) {
        return this.meterSegmentCount - Math.floor((this.maxDb - db) / this.labelStepsDb) - 1;
    }
    dbToNorm(db) {
        return 1.0 - Math.floor((this.maxDb - db) / this.labelStepsDb + 1.0) / this.meterSegmentCount;
    }
}
//# sourceMappingURL=worklet.js.map