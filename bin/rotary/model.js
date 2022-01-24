import { BoundNumericValue, EmptyIterator, GeneratorIterator, ObservableCollection, ObservableImpl, ObservableValueImpl, Terminator } from "../lib/common.js";
import { Func } from "../lib/math.js";
import { Linear, LinearInteger } from "../lib/mapping.js";
import { CShapeInjective, Injective, InjectiveIdentity, InjectivePow, SmoothStepInjective, TShapeInjective } from "./injective.js";
import { Colors } from "../lib/colors.js";
export class RotaryModel {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
        this.tracks = new ObservableCollection();
        this.radiusMin = this.bindValue(new BoundNumericValue(new LinearInteger(0, 1024), 20));
        this.exportSize = this.bindValue(new BoundNumericValue(new LinearInteger(128, 1024), 256));
        this.phaseOffset = this.bindValue(new BoundNumericValue(Linear.Identity, 0.75));
        this.loopDuration = this.bindValue(new BoundNumericValue(new Linear(1.0, 16.0), 8.0));
        ObservableCollection.observeNested(this.tracks, () => this.observable.notify(this));
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this)));
        return this.terminator.with(property);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
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
            exportSize: this.exportSize.get(),
            phaseOffset: this.phaseOffset.get(),
            loopDuration: this.loopDuration.get(),
            tracks: this.tracks.map(track => track.serialize())
        };
    }
    deserialize(format) {
        this.radiusMin.set(format.radiusMin);
        this.exportSize.set(format.exportSize);
        this.phaseOffset.set(format.phaseOffset);
        this.loopDuration.set(format.loopDuration);
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
    ["Linear", InjectiveIdentity],
    ["Power", InjectivePow],
    ["CShape", CShapeInjective],
    ["TShape", TShapeInjective],
    ["SmoothStep", SmoothStepInjective]
]);
export const Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]]);
export var Edge;
(function (Edge) {
    Edge[Edge["Start"] = 0] = "Start";
    Edge[Edge["End"] = 1] = "End";
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
        this.observable = new ObservableImpl();
        this.segments = this.bindValue(new BoundNumericValue(new LinearInteger(1, 1024), 8));
        this.width = this.bindValue(new BoundNumericValue(new LinearInteger(1, 1024), 12));
        this.widthPadding = this.bindValue(new BoundNumericValue(new LinearInteger(0, 1024), 0));
        this.length = this.bindValue(new BoundNumericValue(Linear.Identity, 1.0));
        this.lengthRatio = this.bindValue(new BoundNumericValue(Linear.Identity, 0.5));
        this.outline = this.bindValue(new BoundNumericValue(new LinearInteger(0, 16), 0));
        this.fill = this.bindValue(new ObservableValueImpl(Fill.Flat));
        this.rgb = this.bindValue(new ObservableValueImpl((0xFFFFFF)));
        this.motion = this.bindValue(new ObservableValueImpl(new InjectiveIdentity()));
        this.phaseOffset = this.bindValue(new BoundNumericValue(Linear.Identity, 0.0));
        this.bend = this.bindValue(new BoundNumericValue(Linear.Bipolar, 0.0));
        this.frequency = this.bindValue(new BoundNumericValue(new LinearInteger(1, 16), 1.0));
        this.fragments = this.bindValue(new BoundNumericValue(new LinearInteger(1, 16), 1.0));
        this.reverse = this.bindValue(new ObservableValueImpl(false));
        this.gradient = [];
        this.motionTerminator = this.terminator.with(new Terminator());
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient()));
        this.terminator.with(this.motion.addObserver((motion) => {
            this.motionTerminator.terminate();
            this.motionTerminator.with(motion.addObserver(() => this.observable.notify(this)));
        }));
        this.updateGradient();
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this)));
        return this.terminator.with(property);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    ratio(phase) {
        throw new Error();
    }
    test() {
        this.phaseOffset.set(0.0);
        this.bend.set(0.75);
        this.frequency.set(1.0);
        this.fragments.set(1.0);
        this.reverse.set(false);
        this.length.set(1.0);
        this.lengthRatio.set(0.125);
        this.outline.set(0.0);
        this.segments.set(16);
        this.motion.set(new InjectiveIdentity());
        this.width.set(128);
        this.fill.set(Fill.Flat);
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
        this.motion.set(Injective.random(random));
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
            fragments: this.fragments.get(),
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
        this.motion.set(Injective.from(format.motion));
        this.phaseOffset.set(format.phaseOffset);
        this.bend.set(format.bend);
        this.frequency.set(format.frequency);
        this.fragments.set(format.fragments);
        this.reverse.set(format.reverse);
        return this;
    }
    translatePhase(x) {
        const fragments = this.fragments.get();
        const mx = fragments * (this.reverse.get() ? 1.0 - x : x) + this.phaseOffset.get();
        const nx = Math.floor(mx);
        return this.frequency.get() * (this.motion.get().fx(mx - nx) + nx) / fragments;
    }
    inversePhase(y) {
        const fragments = this.fragments.get();
        const my = fragments * y / this.frequency.get();
        const ny = Math.floor(my);
        const fwd = (this.motion.get().fy(my - ny) + ny) / fragments - this.phaseOffset.get();
        return this.reverse.get() ? 1.0 - fwd : fwd;
    }
    filterSections(p0, p1) {
        if (this.reverse.get()) {
            const tmp = p0;
            p0 = p1;
            p1 = tmp;
        }
        if (p0 >= p1) {
            return EmptyIterator;
        }
        const index = Math.floor(p0);
        return GeneratorIterator.wrap(this.branchFilterSection(p0 - index, p1 - index, index));
    }
    *branchFilterSection(p0, p1, index) {
        console.assert(p0 >= 0.0 && p0 < 1.0, `p0(${p0}) must be positive and smaller than 1.0`);
        console.assert(p1 < 2.0, `p1(${p1}) must be smaller than 2.0`);
        if (p1 > 1.0) {
            yield* this.seekSection(1, p0, 1.0, index);
            yield* this.seekSection(2, 0.0, p1 - 1.0, index + 1);
        }
        else {
            yield* this.seekSection(3, p0, p1, index);
        }
    }
    *seekSection(branch, p0, p1, offset) {
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
        while (seekMin < t1) {
            if (seekMin >= t0) {
                yield new FilterResult(this.reverse.get() ? Edge.End : Edge.Start, index, Func.tx(seekMin / length, bend) * length + offset);
            }
            const seekMax = (index + lengthRatio) * step;
            if (seekMax >= t0 && seekMax < t1) {
                yield new FilterResult(this.reverse.get() ? Edge.Start : Edge.End, index, Func.tx(seekMax / length, bend) * length + offset);
            }
            seekMin = ++index * step;
        }
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