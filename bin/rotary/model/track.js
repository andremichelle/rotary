import { IdentityInjective, Injective, TShapeInjective } from "../../lib/injective.js";
import { ArrayUtils, BoundNumericValue, EmptyIterator, GeneratorIterator, ObservableBits, ObservableImpl, ObservableValueImpl, Terminator } from "../../lib/common.js";
import { Linear, LinearInteger } from "../../lib/mapping.js";
import { Channelstrip } from "../../audio/mixer.js";
import { Func } from "../../lib/math.js";
import { RotaryModel } from "./rotary.js";
import { OscillatorSettings, SamplePlayerSettings, SoundSettings } from "./sound.js";
export var Fill;
(function (Fill) {
    Fill[Fill["Flat"] = 0] = "Flat";
    Fill[Fill["Stroke"] = 1] = "Stroke";
    Fill[Fill["Line"] = 2] = "Line";
    Fill[Fill["Gradient"] = 3] = "Gradient";
})(Fill || (Fill = {}));
export const Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient", Fill.Gradient]]);
export var Edge;
(function (Edge) {
    Edge[Edge["Start"] = 0] = "Start";
    Edge[Edge["End"] = 1] = "End";
})(Edge || (Edge = {}));
export class QueryResult {
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
        this.gradient = [];
        this.segments = this.bindValue(new BoundNumericValue(new LinearInteger(1, 128), 8));
        this.exclude = this.bindValue(new ObservableBits(128));
        this.width = this.bindValue(new BoundNumericValue(new LinearInteger(1, 1024), 12));
        this.widthPadding = this.bindValue(new BoundNumericValue(new LinearInteger(0, 1024), 0));
        this.length = this.bindValue(new BoundNumericValue(Linear.Identity, 1.0));
        this.lengthRatio = this.bindValue(new BoundNumericValue(Linear.Identity, 0.5));
        this.outline = this.bindValue(new BoundNumericValue(new LinearInteger(0, 16), 0));
        this.fill = this.bindValue(new ObservableValueImpl(Fill.Flat));
        this.rgb = this.bindValue(new ObservableValueImpl((0xFFFFFF)));
        this.motion = this.bindValue(new ObservableValueImpl(new IdentityInjective()));
        this.bend = this.bindValue(new ObservableValueImpl(new IdentityInjective()));
        this.phaseOffset = this.bindValue(new BoundNumericValue(Linear.Identity, 0.0));
        this.frequency = this.bindValue(new BoundNumericValue(new LinearInteger(1, 16), 1.0));
        this.fragments = this.bindValue(new BoundNumericValue(new LinearInteger(1, 16), 1.0));
        this.reverse = this.bindValue(new ObservableValueImpl(false));
        this.gain = new BoundNumericValue(Channelstrip.GAIN_MAPPING, 0.5);
        this.volume = new BoundNumericValue(Linear.Identity, 1.0);
        this.panning = new BoundNumericValue(Linear.Bipolar, 0.0);
        this.aux = ArrayUtils.fill(RotaryModel.NUM_AUX, () => new BoundNumericValue(Linear.Identity, 0.0));
        this.mute = new ObservableValueImpl(false);
        this.solo = new ObservableValueImpl(false);
        this.sound = this.bindValue(new ObservableValueImpl(new SamplePlayerSettings()));
        this.terminator.with(this.rgb.addObserver(() => this.updateGradient(), true));
        const motionTerminator = this.terminator.with(new Terminator());
        this.terminator.with(this.motion.addObserver((motion) => {
            motionTerminator.terminate();
            motionTerminator.with(motion.addObserver(() => this.observable.notify(this)));
        }, false));
        const bendTerminator = this.terminator.with(new Terminator());
        this.terminator.with(this.bend.addObserver((bend) => {
            bendTerminator.terminate();
            bendTerminator.with(bend.addObserver(() => this.observable.notify(this)));
        }, false));
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    test() {
        this.phaseOffset.set(0.0);
        this.frequency.set(1.0);
        this.fragments.set(1.0);
        this.reverse.set(false);
        this.length.set(1.0);
        this.lengthRatio.set(0.5);
        this.outline.set(0.0);
        this.segments.set(4);
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
        const fill = 4 >= segments && random.nextDouble(0.0, 1.0) < 0.4 ? Fill.Gradient : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat;
        this.segments.set(0 === lengthRatioExp ? 1 : segments);
        this.exclude.clear();
        this.width.set(width);
        this.widthPadding.set(widthPadding);
        this.length.set(length);
        this.lengthRatio.set(lengthRatio);
        this.outline.set(fill == Fill.Stroke || fill === Fill.Flat && random.nextBoolean() ? 1 : 0);
        this.fill.set(fill);
        this.motion.set(Injective.random(random));
        this.phaseOffset.set(Math.floor(random.nextDouble(0.0, 4.0)) * 0.25);
        const injective = new TShapeInjective();
        injective.shape.set(random.nextDouble(-1.0, 1.0));
        this.bend.set(injective);
        this.frequency.set(Math.floor(random.nextDouble(1.0, 3.0)));
        this.fragments.set(Math.floor(random.nextDouble(1.0, 3.0)));
        this.reverse.set(random.nextBoolean());
        this.panning.set(random.nextDouble(-1.0, 1.0));
        this.aux.forEach(value => random.nextDouble(0.0, 1.0) < 0.2 ? value.set(random.nextDouble(0.25, 1.0)) : 0.0);
        if (random.nextDouble(0.0, 1.0) < 0.1) {
            this.sound.set(new OscillatorSettings());
        }
        return this;
    }
    terminate() {
        this.terminator.terminate();
    }
    serialize() {
        return {
            segments: this.segments.get(),
            exclude: this.exclude.serialize(),
            width: this.width.get(),
            widthPadding: this.widthPadding.get(),
            length: this.length.get(),
            lengthRatio: this.lengthRatio.get(),
            outline: this.outline.get(),
            fill: this.fill.get(),
            rgb: this.rgb.get(),
            motion: this.motion.get().serialize(),
            phaseOffset: this.phaseOffset.get(),
            bend: this.bend.get().serialize(),
            frequency: this.frequency.get(),
            fragments: this.fragments.get(),
            reverse: this.reverse.get(),
            gain: this.gain.get(),
            volume: this.volume.get(),
            panning: this.panning.get(),
            aux: this.aux.map(value => value.get()),
            mute: this.mute.get(),
            solo: this.solo.get(),
            sound: this.sound.get().serialize()
        };
    }
    deserialize(format) {
        this.segments.set(format.segments);
        this.exclude.deserialize(format.exclude);
        this.width.set(format.width);
        this.widthPadding.set(format.widthPadding);
        this.length.set(format.length);
        this.lengthRatio.set(format.lengthRatio);
        this.outline.set(format.outline);
        this.fill.set(format.fill);
        this.rgb.set(format.rgb);
        this.motion.set(Injective.from(format.motion));
        this.phaseOffset.set(format.phaseOffset);
        this.bend.set(Injective.from(format.bend));
        this.frequency.set(format.frequency);
        this.fragments.set(format.fragments);
        this.reverse.set(format.reverse);
        this.gain.set(format.gain);
        this.volume.set(format.volume);
        this.panning.set(format.panning);
        this.aux.forEach((value, index) => value.set(format.aux[index]));
        this.mute.set(format.mute);
        this.solo.set(format.solo);
        this.sound.set(SoundSettings.from(format.sound));
        return this;
    }
    globalToLocal(x) {
        const fragments = this.fragments.get();
        const mx = fragments * (this.reverse.get() ? 1.0 - x : x);
        const nx = Math.floor(mx);
        return this.frequency.get() * (this.motion.get().fx(mx - nx) + nx) / fragments + this.phaseOffset.get();
    }
    localToGlobal(y) {
        const fragments = this.fragments.get();
        const my = fragments * (y - this.phaseOffset.get()) / this.frequency.get();
        const ny = Math.floor(my);
        const fwd = (this.motion.get().fy(my - ny) + ny) / fragments;
        return this.reverse.get() ? 1.0 - fwd : fwd;
    }
    globalToSegment(x) {
        return this.localToSegment(this.globalToLocal(x));
    }
    localToSegment(x) {
        const full = this.bend.get().fy(Func.clamp((x - Math.floor(x)) / this.length.get())) * this.segments.get();
        const index = Math.floor(full);
        if (this.exclude.getBit(index)) {
            return -1;
        }
        const local = (full - index) / this.lengthRatio.get();
        return 0.0 === local ? index : local <= 1.0 ? index + (this.reverse.get() ? local : 1.0 - local) : -1.0;
    }
    querySections(p0, p1) {
        if (p0 == p1) {
            return EmptyIterator;
        }
        if (this.reverse.get()) {
            const tmp = p0;
            p0 = p1;
            p1 = tmp;
        }
        if (p0 > p1) {
            throw new Error("Interval is negative");
        }
        const cycleIndex = Math.floor(p0);
        return GeneratorIterator.wrap(this.branchQuerySection(p0 - cycleIndex, p1 - cycleIndex, cycleIndex));
    }
    *branchQuerySection(p0, p1, index) {
        console.assert(p0 >= 0.0 && p0 < 1.0, `p0(${p0}) must be positive and smaller than 1.0`);
        if (p1 > 2.0) {
            p1 = p1 - Math.floor(p1) + 1.0;
        }
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
        const t0 = bend.fy(Func.clamp(p0 / length)) * length;
        const t1 = bend.fy(Func.clamp(p1 / length)) * length;
        let index = Math.floor(t0 / step);
        let seekMin = index * step;
        while (seekMin < t1) {
            if (!this.exclude.getBit(index)) {
                if (seekMin >= t0) {
                    yield new QueryResult(this.reverse.get() ? Edge.End : Edge.Start, index, bend.fx(Func.clamp(seekMin / length)) * length + offset);
                }
                const seekMax = (index + lengthRatio) * step;
                if (seekMax >= t0 && seekMax < t1) {
                    yield new QueryResult(this.reverse.get() ? Edge.Start : Edge.End, index, bend.fx(Func.clamp(seekMax / length)) * length + offset);
                }
            }
            seekMin = ++index * step;
        }
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false));
        return this.terminator.with(property);
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
//# sourceMappingURL=track.js.map