import { BoundNumericValue, ObservableCollection, ObservableValueImpl, Terminator } from "../lib/common.js";
import { Color } from "../dom/common.js";
import { Linear, LinearInteger } from "../lib/mapping.js";
import { CShapeMotion, LinearMotion, Motion, PowMotion, SmoothStepMotion, TShapeMotion } from "./motion.js";
export class RotaryModel {
    constructor() {
        this.terminator = new Terminator();
        this.tracks = new ObservableCollection();
        this.radiusMin = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 20));
        this.phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0));
    }
    randomize(random) {
        const tracks = [];
        let radius = this.radiusMin.get();
        while (radius < 256) {
            const track = this.createTrack().randomize(random);
            radius += track.width.get() + track.widthPadding.get();
        }
        this.tracks.clear();
        this.tracks.addAll(tracks);
        return this;
    }
    randomizeTracks(random) {
        this.tracks.forEach(track => track.randomize(random));
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
        copy.width.set(source.width.get());
        copy.widthPadding.set(source.widthPadding.get());
        copy.motion.set(source.motion.get().copy());
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
export class RotaryTrackModel {
    constructor(root) {
        this.root = root;
        this.terminator = new Terminator();
        this.segments = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 8));
        this.width = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 1024), 12));
        this.widthPadding = this.terminator.with(new BoundNumericValue(new LinearInteger(0, 1024), 0));
        this.length = this.terminator.with(new BoundNumericValue(Linear.Identity, 1.0));
        this.lengthRatio = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.5));
        this.fill = this.terminator.with(new ObservableValueImpl(Fill.Flat));
        this.rgb = this.terminator.with(new ObservableValueImpl((0xFFFFFF)));
        this.motion = this.terminator.with(new ObservableValueImpl(new LinearMotion()));
        this.phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0));
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
        terminator.with(this.frequency.addObserver(mappedObserver));
        terminator.with(this.reverse.addObserver(mappedObserver));
        terminator.with(this.length.addObserver(mappedObserver));
        terminator.with(this.lengthRatio.addObserver(mappedObserver));
        terminator.with(this.motion.addObserver(mappedObserver));
        terminator.with(this.width.addObserver(mappedObserver));
        terminator.with(this.widthPadding.addObserver(mappedObserver));
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
    map(phase) {
        phase *= this.frequency.get();
        phase += this.phaseOffset.get() + this.root.phaseOffset.get();
        phase -= Math.floor(phase);
        if (this.reverse.get())
            phase = 1.0 - phase;
        phase = this.motion.get().map(phase);
        return phase - Math.floor(phase);
    }
    ratio(phase) {
        phase -= Math.floor(phase);
        phase = this.map(phase);
        phase -= Math.floor(phase);
        phase = 1.0 - phase;
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
    test() {
        this.phaseOffset.set(0.0);
        this.frequency.set(1.0);
        this.reverse.set(false);
        this.length.set(0.5);
        this.lengthRatio.set(0.5);
        this.segments.set(2);
        this.motion.set(new LinearMotion());
        this.width.set(128);
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
        const width = random.nextDouble(0.0, 1.0) < 0.2 ? 18.0 : 9.0;
        const widthPadding = random.nextDouble(0.0, 1.0) < 0.25 ? 0.0 : 6.0;
        const length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0;
        const fill = 2 === segments ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat;
        this.segments.set(0 === lengthRatioExp ? 1 : segments);
        this.width.set(width);
        this.widthPadding.set(widthPadding);
        this.length.set(length);
        this.lengthRatio.set(lengthRatio);
        this.fill.set(fill);
        this.motion.set(Motion.random(random));
        this.phaseOffset.set(random.nextDouble(0.0, 1.0));
        this.frequency.set(Math.floor(random.nextDouble(1.0, 4.0)));
        this.reverse.set(random.nextDouble(0.0, 1.0) < 0.5);
        return this;
    }
    randomizeRGB(random) {
        const hue = random.nextDouble(0.0, 1.0);
        this.rgb.set(Color.hslToRgb(hue, 0.6, 0.6));
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
            fill: this.fill.get(),
            rgb: this.rgb.get(),
            motion: this.motion.get().serialize(),
            phaseOffset: this.phaseOffset.get(),
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
        this.fill.set(format.fill);
        this.rgb.set(format.rgb);
        this.motion.set(Motion.from(format.motion));
        this.phaseOffset.set(format.phaseOffset);
        this.frequency.set(format.frequency);
        this.reverse.set(format.reverse);
        return this;
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