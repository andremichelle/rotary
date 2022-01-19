import { BoundNumericValue, Iterator, ObservableCollection, ObservableValueImpl, Terminator } from "../lib/common.js";
import { Func } from "../lib/math.js";
import { Linear, LinearInteger } from "../lib/mapping.js";
import { CShapeMotion, LinearMotion, Motion, PowMotion, SmoothStepMotion, TShapeMotion } from "./motion.js";
import { Colors } from "../lib/colors.js";
export class RotaryModel {
    constructor() {
        this.terminator = new Terminator();
        this.tracks = new ObservableCollection();
        this.radiusMin = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 20));
        this.exportSize = this.terminator.with(new BoundNumericValue(new LinearInteger(128, 1024), 256));
        this.phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.00));
        this.loopDuration = this.terminator.with(new BoundNumericValue(new Linear(1.0, 16.0), 8.0));
    }
    randomize(random) {
        this.radiusMin.set(20);
        this.tracks.clear();
        const palette = Colors.getRandomPalette(random);
        let radius = this.radiusMin.get();
        while (radius < 256) {
            const track = this.createTrack().randomize(random);
            track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))]);
            radius += track.width.get() + track.widthPadding.get();
        }
        return this;
    }
    randomizeTracks(random) {
        this.tracks.forEach(track => track.randomize(random));
        return this;
    }
    randomizePalette(random) {
        const palette = Colors.getRandomPalette(random);
        this.tracks.forEach(track => track.rgb.set(palette[Math.floor(random.nextDouble(0.0, palette.length))]));
        return this;
    }
    test() {
        this.tracks.clear();
        this.radiusMin.set(256);
        this.createTrack().test();
        return this;
    }
    createTrack(index = Number.MAX_SAFE_INTEGER) {
        const track = new RotaryTrackModel(this);
        return this.tracks.add(track, index) ? track : null;
    }
    copyTrack(source, insertIndex = Number.MAX_SAFE_INTEGER) {
        const copy = this.createTrack(insertIndex);
        copy.segments.set(source.segments.get());
        copy.fill.set(source.fill.get());
        copy.rgb.set(source.rgb.get());
        copy.length.set(source.length.get());
        copy.lengthRatio.set(source.lengthRatio.get());
        copy.outline.set(source.outline.get());
        copy.width.set(source.width.get());
        copy.widthPadding.set(source.widthPadding.get());
        copy.motion.set(source.motion.get().copy());
        copy.reverse.set(source.reverse.get());
        copy.bend.set(source.bend.get());
        copy.phaseOffset.set(source.phaseOffset.get());
        copy.frequency.set(source.frequency.get());
        return copy;
    }
    removeTrack(track) {
        return this.tracks.remove(track);
    }
    clear() {
        this.radiusMin.set(20.0);
        this.tracks.clear();
    }
    measureRadius() {
        return this.tracks.reduce((radius, track) => radius + track.width.get() + track.widthPadding.get(), this.radiusMin.get());
    }
    terminate() {
        this.terminator.terminate();
    }
    serialize() {
        return {
            radiusMin: this.radiusMin.get(),
            tracks: this.tracks.map(track => track.serialize())
        };
    }
    deserialize(format) {
        this.radiusMin.set(format['radiusMin']);
        this.tracks.clear();
        this.tracks.addAll(format.tracks.map(trackFormat => {
            const model = new RotaryTrackModel(this);
            model.deserialize(trackFormat);
            return model;
        }));
        return this;
    }
}
RotaryModel.MAX_TRACKS = 24;
export var Fill;
(function (Fill) {
    Fill[Fill["Flat"] = 0] = "Flat";
    Fill[Fill["Stroke"] = 1] = "Stroke";
    Fill[Fill["Line"] = 2] = "Line";
    Fill[Fill["Positive"] = 3] = "Positive";
    Fill[Fill["Negative"] = 4] = "Negative";
})(Fill || (Fill = {}));
export const MotionTypes = new Map([
    ["Linear", LinearMotion],
    ["Power", PowMotion],
    ["CShape", CShapeMotion],
    ["TShape", TShapeMotion],
    ["SmoothStep", SmoothStepMotion]
]);
export const Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]]);
export var Edge;
(function (Edge) {
    Edge[Edge["Min"] = 0] = "Min";
    Edge[Edge["Max"] = 1] = "Max";
})(Edge || (Edge = {}));
export class FilterResult {
    constructor(edge, index, position) {
        this.edge = edge;
        this.index = index;
        this.position = position;
    }
}
export class RotaryTrackModel {
    constructor(root) {
        this.root = root;
        this.terminator = new Terminator();
        this.segments = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 8));
        this.width = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 12));
        this.widthPadding = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 0));
        this.length = this.terminator.with(new BoundNumericValue(Linear.Identity, 1.0));
        this.lengthRatio = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.5));
        this.outline = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 16), 0));
        this.fill = this.terminator.with(new ObservableValueImpl(Fill.Flat));
        this.rgb = this.terminator.with(new ObservableValueImpl((0xFFFFFF)));
        this.motion = this.terminator.with(new ObservableValueImpl(new LinearMotion()));
        this.phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0));
        this.bend = this.terminator.with(new BoundNumericValue(Linear.Bipolar, 0.0));
        this.frequency = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 16), 1.0));
        this.reverse = this.terminator.with(new ObservableValueImpl(false));
        this.gradient = [];
        this.observers = new Map();
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient()));
        this.updateGradient();
    }
    addObserver(observer) {
        const mappedObserver = () => observer(this);
        const terminator = new Terminator();
        terminator.with(this.segments.addObserver(mappedObserver));
        terminator.with(this.phaseOffset.addObserver(mappedObserver));
        terminator.with(this.bend.addObserver(mappedObserver));
        terminator.with(this.frequency.addObserver(mappedObserver));
        terminator.with(this.reverse.addObserver(mappedObserver));
        terminator.with(this.length.addObserver(mappedObserver));
        terminator.with(this.lengthRatio.addObserver(mappedObserver));
        terminator.with(this.outline.addObserver(mappedObserver));
        terminator.with(this.motion.addObserver(mappedObserver));
        terminator.with(this.width.addObserver(mappedObserver));
        terminator.with(this.widthPadding.addObserver(mappedObserver));
        terminator.with(this.rgb.addObserver(mappedObserver));
        this.observers.set(observer, terminator);
        return { terminate: () => this.removeObserver(observer) };
    }
    removeObserver(observer) {
        const terminable = this.observers.get(observer);
        this.observers.delete(observer);
        if (undefined === terminable)
            return false;
        terminable.terminate();
        return true;
    }
    ratio(phase) {
        const intersection = 0.75;
        phase = intersection - this.translatePhase(phase);
        phase -= Math.floor(phase);
        phase = Func.tx(phase, -this.bend.get());
        phase /= this.length.get();
        if (phase >= 1.0)
            return 0.0;
        phase %= 1.0 / this.segments.get();
        phase *= this.segments.get();
        phase /= this.lengthRatio.get();
        if (phase > 1.0)
            return 0.0;
        phase = 1.0 - phase;
        return phase;
    }
    index(phase) {
        const intersection = 0.75;
        phase = intersection - this.translatePhase(phase);
        phase = Func.tx(phase - Math.floor(phase), -this.bend.get());
        const length = this.length.get();
        if (phase >= length)
            return 0.0;
        return Math.floor(phase / length * this.segments.get());
    }
    test() {
        this.phaseOffset.set(0.0);
        this.bend.set(0.9);
        this.frequency.set(1.0);
        this.reverse.set(false);
        this.length.set(0.5);
        this.lengthRatio.set(0.125);
        this.outline.set(1.0);
        this.segments.set(256);
        this.motion.set(new LinearMotion());
        this.width.set(128);
        this.fill.set(Fill.Stroke);
    }
    opaque() {
        return this.gradient[0];
    }
    transparent() {
        return this.gradient[1];
    }
    randomize(random) {
        const segments = 1 + Math.floor(random.nextDouble(0.0, 9.0)) * 2;
        const lengthRatioExp = -Math.floor(random.nextDouble(0.0, 3.0));
        const lengthRatio = 0 === lengthRatioExp ? 0.5 : random.nextDouble(0.0, 1.0) < 0.5 ? 1.0 - Math.pow(2.0, lengthRatioExp) : Math.pow(2.0, lengthRatioExp);
        const width = random.nextDouble(0.0, 1.0) < 0.2 ? random.nextDouble(0.0, 1.0) < 0.2 ? 32.0 : 24.0 : 12.0;
        const widthPadding = random.nextDouble(0.0, 1.0) < 0.25 ? random.nextDouble(0.0, 1.0) < 0.25 ? 0.0 : 6.0 : 12.0;
        const length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0;
        const fill = 4 >= segments && random.nextDouble(0.0, 1.0) < 0.4 ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat;
        this.segments.set(0 === lengthRatioExp ? 1 : segments);
        this.width.set(width);
        this.widthPadding.set(widthPadding);
        this.length.set(length);
        this.lengthRatio.set(lengthRatio);
        this.outline.set(fill == Fill.Stroke || fill === Fill.Flat && random.nextBoolean() ? 1 : 0);
        this.fill.set(fill);
        this.motion.set(Motion.random(random));
        this.phaseOffset.set(Math.floor(random.nextDouble(0.0, 4.0)) * 0.25);
        this.bend.set(random.nextDouble(-.5, .5));
        this.frequency.set(Math.floor(random.nextDouble(1.0, 3.0)));
        this.reverse.set(random.nextBoolean());
        return this;
    }
    terminate() {
        this.terminator.terminate();
    }
    serialize() {
        return {
            segments: this.segments.get(),
            width: this.width.get(),
            widthPadding: this.widthPadding.get(),
            length: this.length.get(),
            lengthRatio: this.lengthRatio.get(),
            outline: this.outline.get(),
            fill: this.fill.get(),
            rgb: this.rgb.get(),
            motion: this.motion.get().serialize(),
            phaseOffset: this.phaseOffset.get(),
            bend: this.bend.get(),
            frequency: this.frequency.get(),
            reverse: this.reverse.get()
        };
    }
    deserialize(format) {
        this.segments.set(format.segments);
        this.width.set(format.width);
        this.widthPadding.set(format.widthPadding);
        this.length.set(format.length);
        this.lengthRatio.set(format.lengthRatio);
        this.outline.set(format.outline);
        this.fill.set(format.fill);
        this.rgb.set(format.rgb);
        this.motion.set(Motion.from(format.motion));
        this.phaseOffset.set(format.phaseOffset);
        this.bend.set(format.bend);
        this.frequency.set(format.frequency);
        this.reverse.set(format.reverse);
        return this;
    }
    translatePhase(x) {
        x = this.getPhaseDelta(x);
        x = this.motion.get().map(x - Math.floor(x));
        return x - Math.floor(x);
    }
    filterSections(p0, p1, offset) {
        return Iterator.wrap(this.filter(p0, p1, offset));
    }
    *filter(p0, p1, offset) {
        if (p0 >= p1) {
            throw new Error(`p1(${p1}) must be greater than p0(${p0})`);
        }
        const delta = this.getPhaseDelta(offset);
        const pd = p1 - p0;
        p0 -= delta;
        p1 -= delta;
        p0 -= Math.floor(p0);
        p1 = p0 + pd;
        if (p0 < 0.0) {
            yield* this.subFilter(0, p0 + 1.0, Math.min(1.0, p1 + 1.0), delta);
            yield* this.subFilter(1, 0.0, p1, delta);
        }
        else if (p1 > 1.0) {
            yield* this.subFilter(2, p0, 1.0, delta);
            yield* this.subFilter(3, Math.max(0.0, p0 - 1.0), p1 - 1.0, delta + 1.0);
        }
        else {
            yield* this.subFilter(4, p0, p1, delta);
        }
    }
    *subFilter(branch, p0, p1, delta) {
        if (p0 >= p1) {
            return;
        }
        console.assert(0.0 <= p0 && p0 <= 1.0, `x0: ${p0} out of bounds in branch ${branch}`);
        console.assert(0.0 <= p1 && p1 <= 1.0, `x1: ${p1} out of bounds in branch ${branch}`);
        const bend = this.bend.get();
        const length = this.length.get();
        const lengthRatio = this.lengthRatio.get();
        const segments = this.segments.get();
        const step = length / segments;
        const t0 = Func.tx(Func.clamp(p0 / length), -bend) * length;
        const t1 = Func.tx(Func.clamp(p1 / length), -bend) * length;
        let index = Math.floor(t0 / step);
        let seekMin = index * step;
        let seekMax = (index + lengthRatio) * step;
        while (seekMin < t1) {
            if (seekMin >= t0) {
                const position = Func.tx(seekMin / length, bend) * length + delta;
                yield new FilterResult(Edge.Min, index, position);
            }
            if (seekMax >= t0 && seekMax < t1) {
                const position = Func.tx(seekMax / length, bend) * length + delta;
                yield new FilterResult(Edge.Max, index, position);
            }
            seekMin = ++index * step;
            seekMax = (index + lengthRatio) * step;
        }
    }
    getPhaseDelta(delta = 0.0) {
        return Func.switchSign(this.phaseOffset.get() + (delta + this.root.phaseOffset.get()) * this.frequency.get(), this.reverse.get());
    }
    updateGradient() {
        const rgb = this.rgb.get();
        const r = (rgb >> 16) & 0xFF;
        const g = (rgb >> 8) & 0xFF;
        const b = rgb & 0xFF;
        this.gradient[0] = `rgba(${r},${g},${b},1.0)`;
        this.gradient[1] = `rgba(${r},${g},${b},0.0)`;
    }
}
//# sourceMappingURL=model.js.map