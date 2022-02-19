var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TAU } from "../lib/math.js";
import { Fill } from "./model/track.js";
export const createRenderConfiguration = (options) => {
    return Object.assign({
        fps: 60,
        motionFrames: 32,
        numFrames: 60,
        size: 512,
        alpha: true,
        background: "rgba(0,0,0,0.0)"
    }, options);
};
export class RotaryRenderer {
    static render(context, model, phase, alphaMultiplier = 1.0) {
        let radiusMin = model.radiusMin.get();
        for (let i = 0; i < model.tracks.size(); i++) {
            const trackModel = model.tracks.get(i);
            RotaryRenderer.renderTrack(context, trackModel, radiusMin, trackModel.globalToLocal(phase), alphaMultiplier, true);
            radiusMin += trackModel.width.get() + trackModel.widthPadding.get();
        }
    }
    static renderTrackPreview(context, trackModel, size) {
        context.save();
        context.translate(size >> 1, size >> 1);
        const radius = 32.0 + trackModel.width.get();
        const scale = size / (radius + 2.0) * 0.5;
        context.scale(scale, scale);
        RotaryRenderer.renderTrack(context, trackModel, 32.0, 0.0);
        context.restore();
    }
    static renderTrack(context, trackModel, radiusStart, phase, alphaMultiplier = 1.0, highlightCrossing = false) {
        const crossing = trackModel.localToSegment(phase);
        const segments = trackModel.segments.get();
        const length = trackModel.length.get();
        const width = trackModel.width.get();
        const r0 = radiusStart;
        const r1 = radiusStart + width;
        const bend = trackModel.bend.get();
        const lengthRatio = trackModel.lengthRatio.get();
        phase = trackModel.root.phaseOffset.get() - phase;
        let startIndex = 0;
        while (trackModel.connect.getBit(startIndex)) {
            startIndex++;
        }
        if (startIndex === segments)
            return;
        for (let index = startIndex; index < segments; index++) {
            if (trackModel.exclude.getBit(index)) {
                while (trackModel.connect.getBit((index + 1) % segments))
                    index++;
                continue;
            }
            if (highlightCrossing) {
                const inactiveAlpha = trackModel.root.inactiveAlpha.get();
                context.globalAlpha = alphaMultiplier * (null !== crossing && crossing.index === index % segments
                    ? inactiveAlpha + (1.0 - inactiveAlpha) * crossing.ratio
                    : inactiveAlpha);
            }
            const a0 = index / segments;
            while (trackModel.connect.getBit((index + 1) % segments))
                index++;
            const a1 = (index + lengthRatio) / segments;
            RotaryRenderer.renderSection(context, trackModel, r0, r1, phase + bend.fx(a0) * length, phase + bend.fxi(a1) * length);
        }
        const outline = trackModel.outline.get();
        if (0.0 < outline) {
            context.globalAlpha = trackModel.root.inactiveAlpha.get() * alphaMultiplier;
            context.strokeStyle = trackModel.opaque();
            context.lineWidth = outline;
            const numArcs = length < 1.0 ? segments - 1 : segments;
            for (let index = startIndex; index < numArcs; index++) {
                if (trackModel.connect.getBit(index))
                    continue;
                if (trackModel.connect.getBit((index + 1) % segments))
                    continue;
                if (trackModel.exclude.getBit(index))
                    continue;
                if (trackModel.exclude.getBit((index + 1) % segments))
                    continue;
                const a0 = (index + lengthRatio) / segments;
                const a1 = (index + 1) / segments;
                const startAngle = (phase + bend.fx(a0) * length) * TAU;
                const endAngle = (phase + bend.fx(a1) * length) * TAU;
                const radius = r0 + width * 0.5;
                if ((endAngle - startAngle) * radius < 1.0) {
                    continue;
                }
                context.beginPath();
                context.arc(0, 0, radius, startAngle, endAngle, false);
                context.stroke();
            }
            context.lineWidth = 1.0;
        }
    }
    static renderSection(context, model, radiusMin, radiusMax, angleMin, angleMax) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`);
        console.assert(angleMin <= angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`);
        if ((angleMax - angleMin) * radiusMin * TAU < 1.0) {
            angleMax = (angleMin + 1.0 / (radiusMin * TAU));
        }
        const radianMin = angleMin * TAU;
        const radianMax = angleMax * TAU;
        const fill = model.fill.get();
        if (fill === Fill.Flat) {
            context.fillStyle = model.opaque();
        }
        else if (fill === Fill.Stroke || fill === Fill.Line) {
            context.strokeStyle = model.opaque();
        }
        else {
            const gradient = context.createConicGradient(radianMin, 0.0, 0.0);
            const offset = Math.min(angleMax - angleMin, 1.0);
            if (fill === Fill.Gradient) {
                if (model.reverse.get()) {
                    gradient.addColorStop(0.0, model.transparent());
                    gradient.addColorStop(offset, model.opaque());
                    gradient.addColorStop(offset, model.transparent());
                }
                else {
                    gradient.addColorStop(0.0, model.opaque());
                    gradient.addColorStop(offset, model.transparent());
                }
            }
            context.fillStyle = gradient;
        }
        if (fill === Fill.Line) {
            const sn = Math.sin(radianMin);
            const cs = Math.cos(radianMin);
            context.beginPath();
            context.moveTo(cs * radiusMin, sn * radiusMin);
            context.lineTo(cs * radiusMax, sn * radiusMax);
            context.closePath();
        }
        else {
            context.beginPath();
            context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false);
            context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true);
            context.closePath();
        }
        if (fill === Fill.Stroke || fill === Fill.Line) {
            context.stroke();
        }
        else {
            context.fill();
        }
    }
    static renderFrames(model, configuration, process, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0 | 0;
            return new Promise((resolve) => {
                const iterator = RotaryRenderer.iterateFrames(model, configuration);
                const next = () => {
                    const curr = iterator.next();
                    if (curr.done) {
                        if (progress !== undefined)
                            progress(1.0);
                        resolve();
                    }
                    else {
                        if (progress !== undefined)
                            progress(count++ / configuration.numFrames);
                        process(curr.value);
                        requestAnimationFrame(next);
                    }
                };
                requestAnimationFrame(next);
            });
        });
    }
    static *iterateFrames(model, configuration) {
        const rawCanvas = document.createElement("canvas");
        const rawContext = rawCanvas.getContext("2d", { alpha: true });
        const liveCanvas = document.createElement("canvas");
        const liveContext = liveCanvas.getContext("2d", { alpha: configuration.alpha });
        const numFrames = configuration.numFrames;
        const size = configuration.size;
        liveCanvas.width = rawCanvas.width = size;
        liveCanvas.height = rawCanvas.height = size;
        for (let i = 0; i < numFrames; i++) {
            RotaryRenderer.renderFrame(rawContext, model, size, configuration.motionFrames, configuration.fps, i / numFrames, configuration.background);
            liveContext.clearRect(0, 0, size, size);
            liveContext.save();
            liveContext.filter = "blur(32px) brightness(50%)";
            liveContext.drawImage(rawCanvas, 0, 0);
            liveContext.restore();
            liveContext.drawImage(rawCanvas, 0, 0);
            yield liveContext;
        }
    }
    static renderFrame(context, model, size, motionFrames, fps, phase, background = "rgba(0,0,0,0.0)") {
        const radius = model.measureRadius();
        const halfSize = size >> 1;
        const scale = (halfSize - 64) / radius;
        context.clearRect(0, 0, size, size);
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);
        context.save();
        context.translate(halfSize, halfSize);
        context.scale(scale, scale);
        const angle = model.phaseOffset.get() * TAU;
        const rof = radius + 12;
        context.fillStyle = model.intersects(phase) ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.125)";
        context.beginPath();
        context.arc(Math.cos(angle) * rof, Math.sin(angle) * rof, 3.0, 0.0, TAU, false);
        context.fill();
        const alphaMultiplier = 1.0 / motionFrames;
        const subPhaseMultiplier = 1.0 / (model.duration() * fps * motionFrames);
        for (let j = 0; j < motionFrames; j++) {
            RotaryRenderer.render(context, model, phase + subPhaseMultiplier * j, alphaMultiplier);
        }
        context.restore();
    }
}
//# sourceMappingURL=render.js.map