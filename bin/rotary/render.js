import { TAU } from "../lib/common.js";
import { Function } from "../lib/math.js";
import { Fill } from "./model.js";
export class RotaryRenderer {
    constructor(context, model) {
        this.context = context;
        this.model = model;
        this.highlight = null;
    }
    static renderTrack(context, model, radiusMin, position) {
        const phase = model.map(position);
        const segments = model.segments.get();
        const length = model.length.get();
        const scale = length / segments;
        const width = model.width.get();
        const thickness = model.widthPadding.get() * 0.5;
        const r0 = radiusMin + thickness;
        const r1 = radiusMin + thickness + width;
        const bend = model.bend.get();
        const lengthRatio = model.lengthRatio.get();
        for (let i = 0; i < segments; i++) {
            const angleMin = i * scale;
            const angleMax = angleMin + scale * lengthRatio;
            RotaryRenderer.renderSection(context, model, r0, r1, phase + Function.tx(angleMin, bend), phase + Function.tx(angleMax, bend));
        }
        const outline = model.outline.get();
        if (0.0 < outline) {
            context.strokeStyle = model.opaque();
            context.lineWidth = outline;
            const numArcs = length < 1.0 ? segments - 1 : segments;
            for (let i = 0; i < numArcs; i++) {
                context.beginPath();
                const angleMin = (i + lengthRatio) * scale;
                const angleMax = (i + 1) * scale;
                context.arc(0, 0, r0 + width * 0.5, (phase + Function.tx(angleMin, bend)) * TAU, (phase + Function.tx(angleMax, bend)) * TAU, false);
                context.stroke();
            }
            context.lineWidth = 1.0;
        }
    }
    static renderSection(context, model, radiusMin, radiusMax, angleMin, angleMax) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`);
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`);
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
            if (fill === Fill.Positive) {
                gradient.addColorStop(0.0, model.transparent());
                gradient.addColorStop(offset, model.opaque());
                gradient.addColorStop(offset, model.transparent());
            }
            else if (fill === Fill.Negative) {
                gradient.addColorStop(0.0, model.opaque());
                gradient.addColorStop(offset, model.transparent());
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
    draw(position) {
        let radiusMin = this.model.radiusMin.get();
        for (let i = 0; i < this.model.tracks.size(); i++) {
            const model = this.model.tracks.get(i);
            this.context.globalAlpha = model === this.highlight || null === this.highlight ? 1.0 : 0.25;
            RotaryRenderer.renderTrack(this.context, model, radiusMin, position);
            radiusMin += model.width.get() + model.widthPadding.get();
        }
    }
    showHighlight(model) {
        this.highlight = model;
    }
    releaseHighlight() {
        this.highlight = null;
    }
}
//# sourceMappingURL=render.js.map