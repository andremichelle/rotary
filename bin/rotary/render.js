import { TAU } from "../lib/common.js";
import { Function } from "../lib/math.js";
import { Fill } from "./model.js";
export class RotaryRenderer {
    constructor(context, rotary) {
        this.context = context;
        this.rotary = rotary;
        this.highlight = null;
    }
    draw(position) {
        let radiusMin = this.rotary.radiusMin.get();
        for (let i = 0; i < this.rotary.tracks.size(); i++) {
            const model = this.rotary.tracks.get(i);
            this.drawTrack(model, radiusMin, position);
            radiusMin += model.width.get() + model.widthPadding.get();
        }
    }
    drawTrack(model, radiusMin, position) {
        this.context.globalAlpha = model === this.highlight || null === this.highlight ? 1.0 : 0.2;
        const phase = model.map(position);
        const segments = model.segments.get();
        const scale = model.length.get() / segments;
        const width = model.width.get();
        const thickness = model.widthPadding.get() * 0.5;
        const r0 = radiusMin + thickness;
        const r1 = radiusMin + thickness + width;
        const bend = model.bend.get();
        for (let i = 0; i < segments; i++) {
            const angleMin = i * scale;
            const angleMax = angleMin + scale * model.lengthRatio.get();
            this.drawSection(model, r0, r1, phase + Function.tx(angleMin, bend), phase + Function.tx(angleMax, bend), model.fill.get());
        }
    }
    drawSection(model, radiusMin, radiusMax, angleMin, angleMax, fill) {
        console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`);
        console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`);
        const radianMin = angleMin * TAU;
        const radianMax = angleMax * TAU;
        if (fill === Fill.Flat) {
            this.context.fillStyle = model.opaque();
        }
        else if (fill === Fill.Stroke || fill === Fill.Line) {
            this.context.strokeStyle = model.opaque();
        }
        else {
            const gradient = this.context.createConicGradient(radianMin, 0.0, 0.0);
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
            this.context.fillStyle = gradient;
        }
        if (fill === Fill.Line) {
            const sn = Math.sin(radianMin);
            const cs = Math.cos(radianMin);
            this.context.beginPath();
            this.context.moveTo(cs * radiusMin, sn * radiusMin);
            this.context.lineTo(cs * radiusMax, sn * radiusMax);
            this.context.closePath();
        }
        else {
            this.context.beginPath();
            this.context.arc(0.0, 0.0, radiusMax, radianMin, radianMax, false);
            this.context.arc(0.0, 0.0, radiusMin, radianMax, radianMin, true);
            this.context.closePath();
        }
        if (fill === Fill.Stroke || fill === Fill.Line) {
            this.context.stroke();
        }
        else {
            this.context.fill();
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