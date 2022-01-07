var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define("lib/math", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class JsRandom {
        constructor() {
        }
        nextDouble(min, max) {
            return min + Math.random() * (max - min);
        }
    }
    exports.JsRandom = JsRandom;
    JsRandom.Instance = new JsRandom();
    class Mulberry32 {
        constructor(seed) {
            this.seed = seed;
        }
        nextDouble(min, max) {
            return min + this.uniform() * (max - min);
        }
        uniform() {
            let t = this.seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296.0;
        }
    }
    exports.Mulberry32 = Mulberry32;
    class SmoothStep {
        static fx(x) {
            return x * x * (3.0 - 2.0 * x);
        }
        static edge(edge0, edge1, x) {
            console.assert(0.0 <= edge0 && 1.0 >= edge0, `edge0(${edge0}) must be between 0 and 1`);
            console.assert(0.0 <= edge1 && 1.0 >= edge1, `edge1(${edge1}) must be between 0 and 1`);
            console.assert(edge0 !== edge1, `edge0(${edge0}) must not be equal to edge1(${edge1})`);
            return SmoothStep.fx(Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0))));
        }
    }
    exports.SmoothStep = SmoothStep;
});
define("lib/mapping", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Range {
        constructor() {
        }
        clamp(value) {
            return Math.min(this.max, Math.max(this.min, value));
        }
    }
    exports.Range = Range;
    class Linear {
        constructor(min, max) {
            this.min = min;
            this.max = max;
            this.range = max - min;
        }
        x(y) {
            return (y - this.min) / this.range;
        }
        y(x) {
            return this.min + x * this.range;
        }
        clamp(y) {
            return Math.min(this.max, Math.max(this.min, y));
        }
    }
    exports.Linear = Linear;
    Linear.Identity = new Linear(0.0, 1.0);
    Linear.Bipolar = new Linear(-1.0, 1.0);
    Linear.Percent = new Linear(0.0, 100.0);
    class LinearInteger {
        constructor(min, max) {
            this.max = max | 0;
            this.min = min | 0;
            this.range = max - min;
        }
        x(y) {
            return (y - this.min) / this.range;
        }
        y(x) {
            return (this.min + Math.round(x * this.range)) | 0;
        }
        clamp(y) {
            return Math.min(this.max, Math.max(this.min, y));
        }
    }
    exports.LinearInteger = LinearInteger;
    LinearInteger.Percent = new Linear(0, 100);
    class Exp {
        constructor(min, max) {
            this.max = max;
            this.min = min;
            this.range = Math.log(max / min);
        }
        x(y) {
            return Math.log(y / this.min) / this.range;
        }
        y(x) {
            return this.min * Math.exp(x * this.range);
        }
        clamp(y) {
            return Math.min(this.max, Math.max(this.min, y));
        }
    }
    exports.Exp = Exp;
    class Boolean {
        x(y) {
            return y ? 1.0 : 0.0;
        }
        y(x) {
            return x >= 0.5;
        }
        clamp(y) {
            return y;
        }
    }
    exports.Boolean = Boolean;
    class Volume {
        constructor(min = -72.0, mid = -12.0, max = 0.0) {
            this.min = min;
            this.mid = mid;
            this.max = max;
            const min2 = min * min;
            const max2 = max * max;
            const mid2 = mid * mid;
            const tmp0 = min + max - 2.0 * mid;
            const tmp1 = max - mid;
            this.a = ((2.0 * max - mid) * min - mid * max) / tmp0;
            this.b = (tmp1 * min2 + (mid2 - max2) * min + mid * max2 - mid2 * max)
                / (min2 + (2.0 * max - 4.0 * mid) * min + max2 - 4.0 * mid * max + 4 * mid2);
            this.c = -tmp1 / tmp0;
        }
        y(x) {
            if (0.0 >= x) {
                return Number.NEGATIVE_INFINITY;
            }
            if (1.0 <= x) {
                return this.max;
            }
            return this.a - this.b / (x + this.c);
        }
        x(y) {
            if (this.min >= y) {
                return 0.0;
            }
            if (this.max <= y) {
                return 1.0;
            }
            return -this.b / (y - this.a) - this.c;
        }
        clamp(y) {
            return Math.min(this.max, Math.max(this.min, y));
        }
    }
    exports.Volume = Volume;
    Volume.Default = new Volume();
    class PrintMapping {
        constructor(parser, printer, preUnit = "", postUnit = "") {
            this.parser = parser;
            this.printer = printer;
            this.preUnit = preUnit;
            this.postUnit = postUnit;
        }
        static integer(postUnit) {
            return new PrintMapping(text => {
                const value = parseInt(text, 10);
                if (isNaN(value))
                    return null;
                return value | 0;
            }, value => String(value), "", postUnit);
        }
        static float(numPrecision, preUnit, postUnit) {
            return new PrintMapping(text => {
                const value = parseFloat(text);
                if (isNaN(value))
                    return null;
                return value | 0;
            }, value => value.toFixed(numPrecision), preUnit, postUnit);
        }
        parse(text) {
            return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
        }
        print(value) {
            return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`;
        }
    }
    exports.PrintMapping = PrintMapping;
    PrintMapping.UnipolarPercent = new PrintMapping(text => {
        const value = parseFloat(text);
        if (isNaN(value))
            return null;
        return value / 100.0;
    }, value => (value * 100.0).toFixed(1), "", "%");
    PrintMapping.RGB = new PrintMapping(text => {
        if (3 === text.length) {
            text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
        }
        if (6 === text.length) {
            return parseInt(text, 16);
        }
        else {
            return null;
        }
    }, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "");
});
define("lib/common", ["require", "exports", "lib/mapping"], function (require, exports, mapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TAU = Math.PI * 2.0;
    class TerminableVoid {
        terminate() {
        }
    }
    exports.TerminableVoid = TerminableVoid;
    TerminableVoid.Instance = new TerminableVoid();
    class Terminator {
        constructor() {
            this.terminables = [];
        }
        with(terminable) {
            this.terminables.push(terminable);
            return terminable;
        }
        terminate() {
            while (this.terminables.length) {
                this.terminables.pop().terminate();
            }
        }
    }
    exports.Terminator = Terminator;
    class Options {
        static valueOf(value) {
            return null === value || undefined === value ? Options.None : new Options.Some(value);
        }
    }
    exports.Options = Options;
    Options.Some = class {
        constructor(value) {
            this.value = value;
            this.get = () => this.value;
            this.contains = (value) => value === this.value;
            this.ifPresent = (callback) => callback(this.value);
            this.isEmpty = () => false;
            this.nonEmpty = () => true;
            console.assert(null !== value && undefined !== value, "Cannot be null or undefined");
        }
        toString() {
            return `Options.Some(${this.value})`;
        }
    };
    Options.None = new class {
        constructor() {
            this.get = () => {
                throw new Error("Option has no value");
            };
            this.contains = (_) => false;
            this.ifPresent = (_) => {
            };
            this.isEmpty = () => true;
            this.nonEmpty = () => false;
        }
        toString() {
            return `Options.None`;
        }
    };
    class ObservableImpl {
        constructor() {
            this.observers = [];
        }
        notify(value) {
            this.observers.forEach(observer => observer(value));
        }
        addObserver(observer) {
            this.observers.push(observer);
            return { terminate: () => this.removeObserver(observer) };
        }
        removeObserver(observer) {
            let index = this.observers.indexOf(observer);
            if (-1 < index) {
                this.observers.splice(index, 1);
                return true;
            }
            return false;
        }
        terminate() {
            this.observers.splice(0, this.observers.length);
        }
    }
    exports.ObservableImpl = ObservableImpl;
    class ObservableValueVoid {
        addObserver(observer) {
            return TerminableVoid.Instance;
        }
        get() {
        }
        removeObserver(observer) {
            return false;
        }
        set(value) {
            return true;
        }
        terminate() {
        }
    }
    exports.ObservableValueVoid = ObservableValueVoid;
    ObservableValueVoid.Instance = new ObservableValueVoid();
    var CollectionEventType;
    (function (CollectionEventType) {
        CollectionEventType[CollectionEventType["Add"] = 0] = "Add";
        CollectionEventType[CollectionEventType["Remove"] = 1] = "Remove";
        CollectionEventType[CollectionEventType["Order"] = 2] = "Order";
    })(CollectionEventType = exports.CollectionEventType || (exports.CollectionEventType = {}));
    class CollectionEvent {
        constructor(collection, type, item = null, index = -1) {
            this.collection = collection;
            this.type = type;
            this.item = item;
            this.index = index;
        }
    }
    exports.CollectionEvent = CollectionEvent;
    class ObservableCollection {
        constructor() {
            this.observable = new ObservableImpl();
            this.values = [];
        }
        add(value, index = Number.MAX_SAFE_INTEGER) {
            console.assert(0 <= index);
            index = Math.min(index, this.values.length);
            if (this.values.includes(value))
                return false;
            this.values.splice(index, 0, value);
            this.observable.notify(new CollectionEvent(this, CollectionEventType.Add, value, index));
            return true;
        }
        addAll(values) {
            for (const value of values) {
                this.add(value);
            }
        }
        remove(value) {
            return this.removeIndex(this.values.indexOf(value));
        }
        removeIndex(index) {
            if (-1 === index)
                return false;
            const removed = this.values.splice(index, 1);
            if (0 === removed.length)
                return false;
            this.observable.notify(new CollectionEvent(this, CollectionEventType.Remove, removed[0], index));
            return true;
        }
        clear() {
            for (let index = this.values.length - 1; index > -1; index--) {
                this.removeIndex(index);
            }
        }
        get(index) {
            return this.values[index];
        }
        indexOf(value) {
            return this.values.indexOf(value);
        }
        size() {
            return this.values.length;
        }
        map(fn) {
            const arr = [];
            for (let i = 0; i < this.values.length; i++) {
                arr[i] = fn(this.values[i], i, this.values);
            }
            return arr;
        }
        forEach(fn) {
            for (let i = 0; i < this.values.length; i++) {
                fn(this.values[i], i);
            }
        }
        reduce(fn, initialValue) {
            let value = initialValue;
            for (let i = 0; i < this.values.length; i++) {
                value = fn(value, this.values[i], i);
            }
            return value;
        }
        addObserver(observer) {
            return this.observable.addObserver(observer);
        }
        removeObserver(observer) {
            return this.observable.removeObserver(observer);
        }
        terminate() {
            this.observable.terminate();
        }
    }
    exports.ObservableCollection = ObservableCollection;
    class ObservableValueImpl {
        constructor(value) {
            this.value = value;
            this.observable = new ObservableImpl();
        }
        get() {
            return this.value;
        }
        set(value) {
            if (this.value === value) {
                return false;
            }
            this.value = value;
            this.observable.notify(value);
            return true;
        }
        addObserver(observer) {
            return this.observable.addObserver(observer);
        }
        removeObserver(observer) {
            return this.observable.removeObserver(observer);
        }
        terminate() {
            this.observable.terminate();
        }
    }
    exports.ObservableValueImpl = ObservableValueImpl;
    class NumericStepper {
        constructor(step = 1) {
            this.step = step;
        }
        decrease(value) {
            value.set(Math.round((value.get() - this.step) / this.step) * this.step);
        }
        increase(value) {
            value.set(Math.round((value.get() + this.step) / this.step) * this.step);
        }
    }
    exports.NumericStepper = NumericStepper;
    NumericStepper.Integer = new NumericStepper(1);
    NumericStepper.Hundredth = new NumericStepper(0.01);
    class BoundNumericValue {
        constructor(range = mapping_1.Linear.Identity, value = 0.5) {
            this.range = range;
            this.value = value;
            this.observable = new ObservableImpl();
        }
        get() {
            return this.value;
        }
        set(value) {
            value = this.range.clamp(value);
            if (this.value === value) {
                return false;
            }
            this.value = value;
            this.observable.notify(value);
            return true;
        }
        addObserver(observer) {
            return this.observable.addObserver(observer);
        }
        removeObserver(observer) {
            return this.observable.removeObserver(observer);
        }
        terminate() {
            this.observable.terminate();
        }
    }
    exports.BoundNumericValue = BoundNumericValue;
    exports.binarySearch = (values, key) => {
        let low = 0 | 0;
        let high = (values.length - 1) | 0;
        while (low <= high) {
            const mid = (low + high) >>> 1;
            const midVal = values[mid];
            if (midVal < key)
                low = mid + 1;
            else if (midVal > key)
                high = mid - 1;
            else {
                if (midVal === key)
                    return mid;
                else if (midVal < key)
                    low = mid + 1;
                else
                    high = mid - 1;
            }
        }
        return high;
    };
    class UniformRandomMapping {
        constructor(random, resolution = 1024, roughness = 4.0, strength = 0.2) {
            this.random = random;
            this.resolution = resolution;
            this.roughness = roughness;
            this.strength = strength;
            this.values = UniformRandomMapping.monotoneRandom(random, resolution, roughness, strength);
        }
        static monotoneRandom(random, n, roughness, strength) {
            const sequence = new Float32Array(n + 1);
            let sum = 0.0;
            for (let i = 1; i <= n; ++i) {
                const x = Math.floor(random.nextDouble(0.0, roughness)) + 1.0;
                sum += x;
                sequence[i] = x;
            }
            let nominator = 0.0;
            for (let i = 1; i <= n; ++i) {
                nominator += sequence[i];
                sequence[i] = (nominator / sum) * strength + (1.0 - strength) * i / n;
            }
            return sequence;
        }
        clamp(y) {
            return Math.max(0.0, Math.min(1.0, y));
        }
        x(y) {
            if (y <= 0.0)
                return 0.0;
            if (y >= 1.0)
                return 1.0;
            const index = exports.binarySearch(this.values, y);
            const a = this.values[index];
            const b = this.values[index + 1];
            const nInverse = 1.0 / this.resolution;
            return index * nInverse + nInverse / (b - a) * (y - a);
        }
        y(x) {
            if (x <= 0.0)
                return 0.0;
            if (x >= 1.0)
                return 1.0;
            const xd = x * this.resolution;
            const xi = xd | 0;
            const a = xd - xi;
            const q = this.values[xi];
            return q + a * (this.values[xi + 1] - q);
        }
    }
    exports.UniformRandomMapping = UniformRandomMapping;
    exports.readBinary = (url) => {
        return new Promise((resolve, reject) => {
            const r = new XMLHttpRequest();
            r.open("GET", url, true);
            r.responseType = "arraybuffer";
            r.onload = ignore => resolve(r.response);
            r.onerror = event => reject(event);
            r.send(null);
        });
    };
    exports.readAudio = (context, url) => {
        return exports.readBinary(url).then(buffer => exports.decodeAudioData(context, buffer));
    };
    exports.decodeAudioData = (context, buffer) => {
        return context.decodeAudioData(buffer);
    };
});
define("rotary/motion", ["require", "exports", "lib/common", "lib/mapping", "lib/math"], function (require, exports, common_1, mapping_2, math_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MotionTypes = [];
    class Motion {
        constructor() {
            this.terminator = new common_1.Terminator();
        }
        static from(format) {
            switch (format.class) {
                case PowMotion.name:
                    return new PowMotion().deserialize(format);
                case CShapeMotion.name:
                    return new CShapeMotion().deserialize(format);
                case SmoothStepMotion.name:
                    return new SmoothStepMotion().deserialize(format);
            }
            throw new Error("Unknown movement format");
        }
        static random(random) {
            return new MotionTypes[Math.floor(random.nextDouble(0.0, MotionTypes.length))]().randomize(random);
        }
        pack(data) {
            return {
                class: this.constructor.name,
                data: data
            };
        }
        unpack(format) {
            console.assert(this.constructor.name === format.class);
            return format.data;
        }
        terminate() {
            this.terminator.terminate();
        }
    }
    exports.Motion = Motion;
    class LinearMotion extends Motion {
        map(x) {
            return x;
        }
        serialize() {
            return super.pack.call(undefined);
        }
        deserialize(format) {
            super.unpack(format);
            return this;
        }
        copy() {
            return new LinearMotion();
        }
        randomize(random) {
            return this;
        }
    }
    exports.LinearMotion = LinearMotion;
    class PowMotion extends Motion {
        constructor() {
            super(...arguments);
            this.range = new mapping_2.Linear(1.0, 16.0);
            this.exponent = this.terminator.with(new common_1.BoundNumericValue(this.range, 2.0));
        }
        map(x) {
            return Math.pow(x, this.exponent.get());
        }
        serialize() {
            return super.pack({ exponent: this.exponent.get() });
        }
        deserialize(format) {
            this.exponent.set(super.unpack(format).exponent);
            return this;
        }
        copy() {
            const motion = new PowMotion();
            motion.exponent.set(this.exponent.get());
            return motion;
        }
        randomize(random) {
            this.exponent.set(random.nextDouble(2.0, 4.0));
            return this;
        }
    }
    exports.PowMotion = PowMotion;
    class CShapeMotion extends Motion {
        constructor() {
            super();
            this.range = new mapping_2.Linear(0.0, 8.0);
            this.slope = this.terminator.with(new common_1.BoundNumericValue(this.range, 1.0));
            this.terminator.with(this.slope.addObserver(() => this.update()));
            this.update();
        }
        map(x) {
            return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5;
        }
        serialize() {
            return super.pack({ slope: this.slope.get() });
        }
        deserialize(format) {
            this.slope.set(super.unpack(format).slope);
            return this;
        }
        copy() {
            const motion = new CShapeMotion();
            motion.slope.set(this.slope.get());
            return motion;
        }
        randomize(random) {
            this.slope.set(random.nextDouble(1.0, 4.0));
            return this;
        }
        update() {
            this.o = Math.pow(2.0, this.slope.get());
            this.c = Math.pow(2.0, this.o - 1);
        }
    }
    exports.CShapeMotion = CShapeMotion;
    class SmoothStepMotion extends Motion {
        constructor() {
            super();
            this.edge0 = this.terminator.with(new common_1.BoundNumericValue(mapping_2.Linear.Identity, 0.25));
            this.edge1 = this.terminator.with(new common_1.BoundNumericValue(mapping_2.Linear.Identity, 0.75));
        }
        map(x) {
            return math_1.SmoothStep.edge(this.edge0.get(), this.edge1.get(), x);
        }
        deserialize(format) {
            const data = this.unpack(format);
            this.edge0.set(data.edge0);
            this.edge1.set(data.edge1);
            return this;
        }
        serialize() {
            return super.pack({ edge0: this.edge0.get(), edge1: this.edge1.get() });
        }
        copy() {
            const motion = new SmoothStepMotion();
            motion.edge0.set(this.edge0.get());
            motion.edge1.set(this.edge1.get());
            return motion;
        }
        randomize(random) {
            this.edge0.set(random.nextDouble(0.125, 0.375));
            this.edge1.set(random.nextDouble(0.625, 0.875));
            return this;
        }
    }
    exports.SmoothStepMotion = SmoothStepMotion;
    MotionTypes.push(LinearMotion);
    MotionTypes.push(PowMotion);
    MotionTypes.push(CShapeMotion);
    MotionTypes.push(SmoothStepMotion);
});
define("rotary/model", ["require", "exports", "lib/common", "lib/mapping", "rotary/motion"], function (require, exports, common_2, mapping_3, motion_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RotaryModel {
        constructor() {
            this.terminator = new common_2.Terminator();
            this.tracks = new common_2.ObservableCollection();
            this.radiusMin = this.terminator.with(new common_2.BoundNumericValue(new mapping_3.LinearInteger(0, 1024), 20));
        }
        randomize(random) {
            const tracks = [];
            let radius = this.radiusMin.get();
            while (radius < 256) {
                const track = new RotaryTrackModel().randomize(random);
                tracks.push(track);
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
            const trackModel = new RotaryTrackModel();
            trackModel.test();
            this.radiusMin.set(128);
            this.tracks.clear();
            this.tracks.add(trackModel);
            return this;
        }
        createTrack(index = Number.MAX_SAFE_INTEGER) {
            const track = new RotaryTrackModel();
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
                const model = new RotaryTrackModel();
                model.deserialize(trackFormat);
                return model;
            }));
            return this;
        }
    }
    exports.RotaryModel = RotaryModel;
    var Fill;
    (function (Fill) {
        Fill[Fill["Flat"] = 0] = "Flat";
        Fill[Fill["Stroke"] = 1] = "Stroke";
        Fill[Fill["Line"] = 2] = "Line";
        Fill[Fill["Positive"] = 3] = "Positive";
        Fill[Fill["Negative"] = 4] = "Negative";
    })(Fill = exports.Fill || (exports.Fill = {}));
    exports.MotionTypes = new Map([
        ["Linear", motion_1.LinearMotion],
        ["Power", motion_1.PowMotion],
        ["CShape", motion_1.CShapeMotion],
        ["SmoothStep", motion_1.SmoothStepMotion]
    ]);
    exports.Fills = new Map([["Flat", Fill.Flat], ["Stroke", Fill.Stroke], ["Line", Fill.Line], ["Gradient+", Fill.Positive], ["Gradient-", Fill.Negative]]);
    class RotaryTrackModel {
        constructor() {
            this.terminator = new common_2.Terminator();
            this.segments = this.terminator.with(new common_2.BoundNumericValue(new mapping_3.LinearInteger(1, 1024), 8));
            this.width = this.terminator.with(new common_2.BoundNumericValue(new mapping_3.LinearInteger(1, 1024), 12));
            this.widthPadding = this.terminator.with(new common_2.BoundNumericValue(new mapping_3.LinearInteger(0, 1024), 0));
            this.length = this.terminator.with(new common_2.BoundNumericValue(mapping_3.Linear.Identity, 1.0));
            this.lengthRatio = this.terminator.with(new common_2.BoundNumericValue(mapping_3.Linear.Identity, 0.5));
            this.fill = this.terminator.with(new common_2.ObservableValueImpl(Fill.Flat));
            this.rgb = this.terminator.with(new common_2.ObservableValueImpl((0xFFFFFF)));
            this.motion = this.terminator.with(new common_2.ObservableValueImpl(new motion_1.LinearMotion()));
            this.phaseOffset = this.terminator.with(new common_2.BoundNumericValue(mapping_3.Linear.Identity, 0.0));
            this.frequency = this.terminator.with(new common_2.BoundNumericValue(new mapping_3.LinearInteger(1, 16), 1.0));
            this.reverse = this.terminator.with(new common_2.ObservableValueImpl(false));
            this.gradient = [];
            this.terminator.with(this.rgb.addObserver(() => this.updateGradient()));
            this.updateGradient();
        }
        map(phase) {
            phase += this.phaseOffset.get();
            phase -= Math.floor(phase);
            phase *= this.frequency.get();
            phase -= Math.floor(phase);
            phase = (this.reverse.get() ? 1.0 - phase : phase);
            phase -= Math.floor(phase);
            phase = this.motion.get().map(phase);
            return phase;
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
            this.segments.set(4);
            this.motion.set(new motion_1.SmoothStepMotion());
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
            const width = random.nextDouble(0.0, 1.0) < 0.2 ? 18.0 : 6.0;
            const widthPadding = random.nextDouble(0.0, 1.0) < 0.25 ? 0.0 : 6.0;
            const length = random.nextDouble(0.0, 1.0) < 0.1 ? 0.75 : 1.0;
            const fill = 2 === segments ? Fill.Positive : random.nextDouble(0.0, 1.0) < 0.2 ? Fill.Stroke : Fill.Flat;
            this.segments.set(0 === lengthRatioExp ? 1 : segments);
            this.width.set(width);
            this.widthPadding.set(widthPadding);
            this.length.set(length);
            this.lengthRatio.set(lengthRatio);
            this.fill.set(fill);
            this.motion.set(motion_1.Motion.random(random));
            this.phaseOffset.set(random.nextDouble(0.0, 1.0));
            this.frequency.set(Math.floor(random.nextDouble(1.0, 4.0)));
            this.reverse.set(random.nextDouble(0.0, 1.0) < 0.5);
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
            this.motion.set(motion_1.Motion.from(format.motion));
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
    exports.RotaryTrackModel = RotaryTrackModel;
});
define("dom/common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Dom {
        static bindEventListener(target, type, listener, options) {
            target.addEventListener(type, listener, options);
            return { terminate: () => target.removeEventListener(type, listener, options) };
        }
        static insertElement(parent, child, index = Number.MAX_SAFE_INTEGER) {
            if (index >= parent.children.length) {
                parent.appendChild(child);
            }
            else {
                parent.insertBefore(child, parent.children[index]);
            }
        }
        static emptyNode(node) {
            while (node.hasChildNodes()) {
                node.lastChild.remove();
            }
        }
        static configRepeatButton(button, callback) {
            const mouseDownListener = () => {
                let lastTime = Date.now();
                let delay = 500.0;
                const repeat = () => {
                    if (!isNaN(lastTime)) {
                        if (Date.now() - lastTime > delay) {
                            lastTime = Date.now();
                            delay *= 0.75;
                            callback();
                        }
                        requestAnimationFrame(repeat);
                    }
                };
                requestAnimationFrame(repeat);
                callback();
                window.addEventListener("mouseup", () => {
                    lastTime = NaN;
                    delay = Number.MAX_VALUE;
                }, { once: true });
            };
            button.addEventListener("mousedown", mouseDownListener);
            return { terminate: () => button.removeEventListener("mousedown", mouseDownListener) };
        }
    }
    exports.Dom = Dom;
});
define("dom/inputs", ["require", "exports", "dom/common", "lib/common"], function (require, exports, common_3, common_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Checkbox {
        constructor(element) {
            this.element = element;
            this.terminator = new common_4.Terminator();
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = () => this.update();
            this.init();
        }
        with(value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        }
        clear() {
            this.with(common_4.ObservableValueVoid.Instance);
        }
        init() {
            this.terminator.with(common_3.Dom.bindEventListener(this.element, "change", () => this.value.set(this.element.checked)));
        }
        update() {
            this.element.checked = this.value.get();
        }
        terminate() {
            this.value.removeObserver(this.observer);
            this.terminator.terminate();
        }
    }
    exports.Checkbox = Checkbox;
    class SelectInput {
        constructor(select, map) {
            this.select = select;
            this.map = map;
            this.terminator = new common_4.Terminator();
            this.options = new Map();
            this.values = [];
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = () => this.update();
            this.connect();
        }
        with(value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        }
        clear() {
            this.with(common_4.ObservableValueVoid.Instance);
        }
        terminate() {
            this.value.removeObserver(this.observer);
            this.terminator.terminate();
        }
        update() {
            const key = this.value.get();
            if (key === undefined)
                return;
            this.options.get(key).selected = true;
        }
        connect() {
            this.map.forEach((some, key) => {
                const optionElement = document.createElement("OPTION");
                optionElement.textContent = key;
                optionElement.selected = some === this.value.get();
                this.select.appendChild(optionElement);
                this.values.push(some);
                this.options.set(some, optionElement);
            });
            this.terminator.with(common_3.Dom.bindEventListener(this.select, "change", () => this.value.set(this.values[this.select.selectedIndex])));
        }
    }
    exports.SelectInput = SelectInput;
    class NumericStepperInput {
        constructor(parent, printMapping, stepper) {
            this.parent = parent;
            this.printMapping = printMapping;
            this.stepper = stepper;
            this.terminator = new common_4.Terminator();
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = () => this.update();
            const buttons = this.parent.querySelectorAll("button");
            this.decreaseButton = buttons.item(0);
            this.increaseButton = buttons.item(1);
            this.input = this.parent.querySelector("input[type=text]");
            this.connect();
        }
        with(value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        }
        clear() {
            this.with(common_4.ObservableValueVoid.Instance);
        }
        connect() {
            this.terminator.with(common_3.Dom.configRepeatButton(this.decreaseButton, () => this.stepper.decrease(this.value)));
            this.terminator.with(common_3.Dom.configRepeatButton(this.increaseButton, () => this.stepper.increase(this.value)));
            this.terminator.with(common_3.Dom.bindEventListener(this.input, "focusin", (focusEvent) => {
                const blur = (() => {
                    const lastFocus = focusEvent.relatedTarget;
                    return () => {
                        this.input.setSelectionRange(0, 0);
                        if (lastFocus === null) {
                            this.input.blur();
                        }
                        else {
                            lastFocus.focus();
                        }
                    };
                })();
                const keyboardListener = (event) => {
                    switch (event.key) {
                        case "ArrowUp": {
                            event.preventDefault();
                            this.stepper.increase(this.value);
                            this.input.select();
                            break;
                        }
                        case "ArrowDown": {
                            event.preventDefault();
                            this.stepper.decrease(this.value);
                            this.input.select();
                            break;
                        }
                        case "Escape": {
                            event.preventDefault();
                            this.update();
                            blur();
                            break;
                        }
                        case "Enter": {
                            event.preventDefault();
                            const number = this.parse();
                            if (null === number || !this.value.set(number)) {
                                this.update();
                            }
                            blur();
                        }
                    }
                };
                this.input.addEventListener("focusout", () => this.input.removeEventListener("keydown", keyboardListener), { once: true });
                this.input.addEventListener("keydown", keyboardListener);
                window.addEventListener("mouseup", () => {
                    if (this.input.selectionStart === this.input.selectionEnd)
                        this.input.select();
                }, { once: true });
            }));
        }
        parse() {
            return this.printMapping.parse(this.input.value);
        }
        update() {
            this.input.value = this.printMapping.print(this.value.get());
        }
        terminate() {
            this.terminator.terminate();
            this.value.removeObserver(this.observer);
        }
    }
    exports.NumericStepperInput = NumericStepperInput;
    class NumericInput {
        constructor(input, printMapping) {
            this.input = input;
            this.printMapping = printMapping;
            this.terminator = new common_4.Terminator();
            this.value = common_4.ObservableValueVoid.Instance;
            this.observer = () => this.update();
            this.connect();
        }
        with(value) {
            this.value.removeObserver(this.observer);
            this.value = value;
            this.value.addObserver(this.observer);
            this.update();
        }
        clear() {
            this.with(common_4.ObservableValueVoid.Instance);
        }
        connect() {
            this.terminator.with(common_3.Dom.bindEventListener(this.input, "focusin", (focusEvent) => {
                const blur = (() => {
                    const lastFocus = focusEvent.relatedTarget;
                    return () => {
                        this.input.setSelectionRange(0, 0);
                        if (lastFocus === null) {
                            this.input.blur();
                        }
                        else {
                            lastFocus.focus();
                        }
                    };
                })();
                const keyboardListener = (event) => {
                    switch (event.key) {
                        case "Escape": {
                            event.preventDefault();
                            this.update();
                            blur();
                            break;
                        }
                        case "Enter": {
                            event.preventDefault();
                            const number = this.parse();
                            if (null === number || !this.value.set(number)) {
                                this.update();
                            }
                            blur();
                        }
                    }
                };
                this.input.addEventListener("focusout", () => this.input.removeEventListener("keydown", keyboardListener), { once: true });
                this.input.addEventListener("keydown", keyboardListener);
                window.addEventListener("mouseup", () => {
                    if (this.input.selectionStart === this.input.selectionEnd)
                        this.input.select();
                }, { once: true });
            }));
        }
        parse() {
            return this.printMapping.parse(this.input.value);
        }
        update() {
            this.input.value = this.printMapping.print(this.value.get());
        }
        terminate() {
            this.terminator.terminate();
            this.value.removeObserver(this.observer);
        }
    }
    exports.NumericInput = NumericInput;
});
define("rotary/editor", ["require", "exports", "lib/common", "dom/inputs", "rotary/model", "dom/common", "lib/mapping", "rotary/motion"], function (require, exports, common_5, inputs_1, model_1, common_6, mapping_4, motion_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PowMotionEditor {
        constructor(element) {
            this.input = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='pow'][data-parameter='exponent']"), mapping_4.PrintMapping.float(2, "x^", ""), common_5.NumericStepper.Hundredth);
        }
        with(value) {
            this.input.with(value.exponent);
        }
        clear() {
            this.input.with(common_5.ObservableValueVoid.Instance);
        }
        terminate() {
            this.input.terminate();
        }
    }
    exports.PowMotionEditor = PowMotionEditor;
    class CShapeMotionEditor {
        constructor(element) {
            this.input = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='cshape'][data-parameter='slope']"), mapping_4.PrintMapping.float(2, "", ""), common_5.NumericStepper.Hundredth);
        }
        with(value) {
            this.input.with(value.slope);
        }
        clear() {
            this.input.with(common_5.ObservableValueVoid.Instance);
        }
        terminate() {
            this.input.terminate();
        }
    }
    exports.CShapeMotionEditor = CShapeMotionEditor;
    class SmoothStepMotionEditor {
        constructor(element) {
            this.input0 = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='smoothstep'][data-parameter='edge0']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.Hundredth);
            this.input1 = new inputs_1.NumericStepperInput(element.querySelector("fieldset[data-motion='smoothstep'][data-parameter='edge1']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.Hundredth);
        }
        with(value) {
            this.input0.with(value.edge0);
            this.input1.with(value.edge1);
        }
        clear() {
            this.input0.with(common_5.ObservableValueVoid.Instance);
            this.input1.with(common_5.ObservableValueVoid.Instance);
        }
        terminate() {
            this.input0.terminate();
            this.input1.terminate();
        }
    }
    exports.SmoothStepMotionEditor = SmoothStepMotionEditor;
    class MotionEditor {
        constructor(editor, element) {
            this.editor = editor;
            this.element = element;
            this.terminator = new common_5.Terminator();
            this.motionTypeValue = this.terminator.with(new common_5.ObservableValueImpl(model_1.MotionTypes[0]));
            this.editable = common_5.Options.None;
            this.subscription = common_5.Options.None;
            this.typeSelectInput = this.terminator.with(new inputs_1.SelectInput(element.querySelector("select[data-parameter='motion']"), model_1.MotionTypes));
            this.typeSelectInput.with(this.motionTypeValue);
            this.powMotionEditor = this.terminator.with(new PowMotionEditor(element));
            this.cShapeMotionEditor = this.terminator.with(new CShapeMotionEditor(element));
            this.smoothStepMotionEditor = this.terminator.with(new SmoothStepMotionEditor(element));
            this.terminator.with(this.motionTypeValue.addObserver(motionType => this.editable.ifPresent(value => value.set(new motionType()))));
        }
        with(value) {
            this.subscription.ifPresent(_ => _.terminate());
            this.editable = common_5.Options.None;
            this.subscription = common_5.Options.valueOf(value.addObserver(value => this.updateMotionType(value)));
            this.updateMotionType(value.get());
            this.editable = common_5.Options.valueOf(value);
        }
        clear() {
            this.subscription.ifPresent(_ => _.terminate());
            this.subscription = common_5.Options.None;
            this.editable = common_5.Options.None;
            this.element.removeAttribute("data-motion");
            this.powMotionEditor.clear();
            this.cShapeMotionEditor.clear();
            this.smoothStepMotionEditor.clear();
        }
        terminate() {
            this.terminator.terminate();
        }
        updateMotionType(motion) {
            const motionType = motion.constructor;
            this.motionTypeValue.set(motionType);
            if (motion instanceof motion_2.LinearMotion) {
                this.element.setAttribute("data-motion", "linear");
                this.powMotionEditor.clear();
                this.cShapeMotionEditor.clear();
                this.smoothStepMotionEditor.clear();
            }
            else if (motion instanceof motion_2.PowMotion) {
                this.element.setAttribute("data-motion", "pow");
                this.powMotionEditor.with(motion);
                this.cShapeMotionEditor.clear();
                this.smoothStepMotionEditor.clear();
            }
            else if (motion instanceof motion_2.CShapeMotion) {
                this.element.setAttribute("data-motion", "cshape");
                this.powMotionEditor.clear();
                this.cShapeMotionEditor.with(motion);
                this.smoothStepMotionEditor.clear();
            }
            else if (motion instanceof motion_2.SmoothStepMotion) {
                this.element.setAttribute("data-motion", "smoothstep");
                this.powMotionEditor.clear();
                this.cShapeMotionEditor.clear();
                this.smoothStepMotionEditor.with(motion);
            }
        }
    }
    exports.MotionEditor = MotionEditor;
    class RotaryTrackEditor {
        constructor(executor, document) {
            this.executor = executor;
            this.terminator = new common_5.Terminator();
            this.subject = common_5.Options.None;
            this.segments = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='segments']"), mapping_4.PrintMapping.integer(""), common_5.NumericStepper.Integer));
            this.width = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='width']"), mapping_4.PrintMapping.integer("px"), common_5.NumericStepper.Integer));
            this.widthPadding = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='width-padding']"), mapping_4.PrintMapping.integer("px"), common_5.NumericStepper.Integer));
            this.length = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='length']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.Hundredth));
            this.lengthRatio = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='length-ratio']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.Hundredth));
            this.fill = this.terminator.with(new inputs_1.SelectInput(document.querySelector("select[data-parameter='fill']"), model_1.Fills));
            this.rgb = this.terminator.with(new inputs_1.NumericInput(document.querySelector("input[data-parameter='rgb']"), mapping_4.PrintMapping.RGB));
            this.motion = new MotionEditor(this, document.querySelector(".track-editor"));
            this.phaseOffset = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='phase-offset']"), mapping_4.PrintMapping.UnipolarPercent, common_5.NumericStepper.Hundredth));
            this.frequency = this.terminator.with(new inputs_1.NumericStepperInput(document.querySelector("fieldset[data-parameter='frequency']"), mapping_4.PrintMapping.integer("x"), common_5.NumericStepper.Integer));
            this.reverse = this.terminator.with(new inputs_1.Checkbox(document.querySelector("input[data-parameter='reverse']")));
            this.terminator.with(common_6.Dom.bindEventListener(document.querySelector("button.delete"), "click", event => {
                event.preventDefault();
                this.subject.ifPresent(() => executor.deleteTrack());
            }));
        }
        edit(model) {
            this.segments.with(model.segments);
            this.width.with(model.width);
            this.widthPadding.with(model.widthPadding);
            this.length.with(model.length);
            this.lengthRatio.with(model.lengthRatio);
            this.fill.with(model.fill);
            this.rgb.with(model.rgb);
            this.motion.with(model.motion);
            this.phaseOffset.with(model.phaseOffset);
            this.frequency.with(model.frequency);
            this.reverse.with(model.reverse);
            this.subject = common_5.Options.valueOf(model);
        }
        clear() {
            this.subject = common_5.Options.None;
            this.segments.clear();
            this.width.clear();
            this.widthPadding.clear();
            this.length.clear();
            this.lengthRatio.clear();
            this.fill.clear();
            this.rgb.clear();
            this.motion.clear();
            this.phaseOffset.clear();
            this.frequency.clear();
            this.reverse.clear();
        }
        terminate() {
            this.clear();
            this.terminator.terminate();
        }
    }
    exports.RotaryTrackEditor = RotaryTrackEditor;
});
define("rotary/render", ["require", "exports", "rotary/model", "lib/common"], function (require, exports, model_2, common_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RotaryRenderer {
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
            const phase = model.map(position);
            const segments = model.segments.get();
            const scale = model.length.get() / segments;
            const width = model.width.get();
            const thickness = model.widthPadding.get() * 0.5;
            const r0 = radiusMin + thickness;
            const r1 = radiusMin + thickness + width;
            for (let i = 0; i < segments; i++) {
                const angleMin = phase + i * scale;
                const angleMax = angleMin + scale * model.lengthRatio.get();
                this.drawSection(model, r0, r1, angleMin, angleMax, model.fill.get());
            }
        }
        drawSection(model, radiusMin, radiusMax, angleMin, angleMax, fill) {
            console.assert(radiusMin < radiusMax, `radiusMax(${radiusMax}) must be greater then radiusMin(${radiusMin})`);
            console.assert(angleMin < angleMax, `angleMax(${angleMax}) must be greater then angleMin(${angleMin})`);
            const radianMin = angleMin * common_7.TAU;
            const radianMax = angleMax * common_7.TAU;
            this.context.globalAlpha = model === this.highlight || null === this.highlight ? 1.0 : 0.2;
            if (fill === model_2.Fill.Flat) {
                this.context.fillStyle = model.opaque();
            }
            else if (fill === model_2.Fill.Stroke || fill === model_2.Fill.Line) {
                this.context.strokeStyle = model.opaque();
            }
            else {
                const gradient = this.context.createConicGradient(radianMin, 0.0, 0.0);
                const offset = Math.min(angleMax - angleMin, 1.0);
                if (fill === model_2.Fill.Positive) {
                    gradient.addColorStop(0.0, model.transparent());
                    gradient.addColorStop(offset, model.opaque());
                    gradient.addColorStop(offset, model.transparent());
                }
                else if (fill === model_2.Fill.Negative) {
                    gradient.addColorStop(0.0, model.opaque());
                    gradient.addColorStop(offset, model.transparent());
                }
                this.context.fillStyle = gradient;
            }
            if (fill === model_2.Fill.Line) {
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
            if (fill === model_2.Fill.Stroke || fill === model_2.Fill.Line) {
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
    exports.RotaryRenderer = RotaryRenderer;
});
define("rotary/ui", ["require", "exports", "lib/common", "dom/inputs", "rotary/editor", "dom/common", "lib/math", "lib/mapping"], function (require, exports, common_8, inputs_2, editor_1, common_9, math_2, mapping_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RotaryUI {
        constructor(form, selectors, template, model, renderer) {
            this.form = form;
            this.selectors = selectors;
            this.template = template;
            this.model = model;
            this.renderer = renderer;
            this.terminator = new common_8.Terminator();
            this.editor = new editor_1.RotaryTrackEditor(this, document);
            this.map = new Map();
            this.random = new math_2.Mulberry32(0x123abc456);
            this.terminator.with(new inputs_2.NumericStepperInput(document.querySelector("[data-parameter='start-radius']"), mapping_5.PrintMapping.integer("px"), new common_8.NumericStepper(1))).with(model.radiusMin);
            this.terminator.with(model.tracks.addObserver((event) => {
                switch (event.type) {
                    case common_8.CollectionEventType.Add: {
                        this.createSelector(event.item);
                        this.reorderSelectors();
                        break;
                    }
                    case common_8.CollectionEventType.Remove: {
                        this.removeSelector(event.item);
                        this.reorderSelectors();
                        break;
                    }
                    case common_8.CollectionEventType.Order: {
                        this.reorderSelectors();
                        break;
                    }
                }
            }));
            this.terminator.with(common_9.Dom.bindEventListener(form.querySelector("#unshift-new-track"), "click", event => {
                event.preventDefault();
                this.select(this.model.createTrack(0).randomize(this.random));
            }));
            this.model.tracks.forEach(track => this.createSelector(track));
            this.reorderSelectors();
            if (0 < this.model.tracks.size())
                this.select(this.model.tracks.get(0));
        }
        static create(rotary, renderer) {
            const form = document.querySelector("form.track-nav");
            const selectors = form.querySelector("#track-selectors");
            const template = selectors.querySelector("#template-selector-track");
            template.remove();
            return new RotaryUI(form, selectors, template, rotary, renderer);
        }
        createNew(model, copy) {
            if (this.editor.subject.isEmpty()) {
                this.select(this.model.createTrack(0).randomize(this.random));
                return;
            }
            model = null === model ? this.editor.subject.get() : model;
            const index = this.model.tracks.indexOf(model);
            console.assert(-1 !== index, "Could not find model");
            const newModel = copy
                ? this.model.copyTrack(model, index + 1)
                : this.model.createTrack(index + 1).randomize(this.random);
            this.select(newModel);
        }
        deleteTrack() {
            this.editor.subject.ifPresent(model => {
                const beforeIndex = this.model.tracks.indexOf(model);
                console.assert(-1 !== beforeIndex, "Could not find model");
                this.model.removeTrack(model);
                const numTracks = this.model.tracks.size();
                if (0 < numTracks) {
                    this.select(this.model.tracks.get(Math.min(beforeIndex, numTracks - 1)));
                }
                else {
                    this.editor.clear();
                }
            });
        }
        select(model) {
            console.assert(model != undefined, "Cannot select");
            this.editor.edit(model);
            const selector = this.map.get(model);
            console.assert(selector != undefined, "Cannot select");
            selector.radio.checked = true;
        }
        hasSelected() {
            return this.editor.subject.nonEmpty();
        }
        showHighlight(model) {
            this.renderer.showHighlight(model);
        }
        releaseHighlight() {
            this.renderer.releaseHighlight();
        }
        createSelector(track) {
            const element = this.template.cloneNode(true);
            const radio = element.querySelector("input[type=radio]");
            const button = element.querySelector("button");
            const selector = new RotaryTrackSelector(this, track, element, radio, button);
            this.map.set(track, selector);
        }
        removeSelector(track) {
            const selector = this.map.get(track);
            const deleted = this.map.delete(track);
            console.assert(selector !== undefined && deleted, "Cannot remove selector");
            selector.terminate();
            if (this.editor.subject.contains(track))
                this.editor.clear();
        }
        reorderSelectors() {
            common_9.Dom.emptyNode(this.selectors);
            this.model.tracks.forEach((track, index) => {
                const selector = this.map.get(track);
                console.assert(selector !== undefined, "Cannot reorder selector");
                this.selectors.appendChild(selector.element);
                selector.setIndex(index);
            });
        }
    }
    exports.RotaryUI = RotaryUI;
    class RotaryTrackSelector {
        constructor(ui, model, element, radio, button) {
            this.ui = ui;
            this.model = model;
            this.element = element;
            this.radio = radio;
            this.button = button;
            this.terminator = new common_8.Terminator();
            this.terminator.with(common_9.Dom.bindEventListener(this.radio, "change", () => this.ui.select(this.model)));
            this.terminator.with(common_9.Dom.bindEventListener(this.element, "mouseenter", () => this.ui.showHighlight(model)));
            this.terminator.with(common_9.Dom.bindEventListener(this.element, "mouseleave", () => this.ui.releaseHighlight()));
            this.terminator.with(common_9.Dom.bindEventListener(this.button, "click", (event) => {
                event.preventDefault();
                this.ui.createNew(this.model, event.shiftKey);
            }));
        }
        setIndex(index) {
            this.element.querySelector("span").textContent = String(index + 1);
        }
        terminate() {
            this.element.remove();
            this.terminator.terminate();
        }
    }
    exports.RotaryTrackSelector = RotaryTrackSelector;
});
define("lib/chords", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Chords {
        static toString(midiNote) {
            const octave = Math.floor(midiNote / 12);
            const semitone = midiNote % 12;
            return Chords.Semitones[semitone] + (octave - 2);
        }
        static toStrings(midiNotes) {
            let result = "";
            for (let i = 0; i < midiNotes.length; ++i) {
                result += Chords.toString(midiNotes[i]);
                if (i < midiNotes.length - 1)
                    result += " ";
            }
            return result;
        }
        static compose(scale, rootKey, variation, numKeys) {
            const chord = new Uint8Array(numKeys);
            for (let i = 0; i < numKeys; i++) {
                const index = variation + i * 2;
                const interval = scale[index % 7] + Math.floor(index / 7) * 12;
                chord[i] = rootKey + interval;
            }
            return chord;
        }
    }
    exports.Chords = Chords;
    Chords.Major = new Uint8Array([0, 2, 4, 5, 7, 9, 11]);
    Chords.Minor = new Uint8Array([0, 2, 3, 5, 7, 8, 10]);
    Chords.Semitones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
});
define("lib/dsp", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DSP {
    }
    exports.DSP = DSP;
    DSP.midiToHz = (note = 60.0, baseFrequency = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0);
    exports.pulsarDelay = (context, input, output, delayTimeL, delayTimeR, delayTime, feedback, lpf, hpf) => {
        const preSplitter = context.createChannelSplitter(2);
        const preDelayL = context.createDelay();
        const preDelayR = context.createDelay();
        preDelayL.delayTime.value = delayTimeL;
        preDelayR.delayTime.value = delayTimeR;
        input.connect(preSplitter);
        preSplitter.connect(preDelayL, 0, 0);
        preSplitter.connect(preDelayR, 1, 0);
        const feedbackMerger = context.createChannelMerger(2);
        preDelayL.connect(feedbackMerger, 0, 1);
        preDelayR.connect(feedbackMerger, 0, 0);
        const feedbackLowpass = context.createBiquadFilter();
        feedbackLowpass.type = "lowpass";
        feedbackLowpass.frequency.value = lpf;
        feedbackLowpass.Q.value = -3.0;
        const feedbackHighpass = context.createBiquadFilter();
        feedbackHighpass.type = "highpass";
        feedbackHighpass.frequency.value = hpf;
        feedbackHighpass.Q.value = -3.0;
        const feedbackDelay = context.createDelay();
        feedbackDelay.delayTime.value = delayTime;
        const feedbackGain = context.createGain();
        feedbackGain.gain.value = feedback;
        const feedbackSplitter = context.createChannelSplitter(2);
        feedbackMerger
            .connect(feedbackLowpass)
            .connect(feedbackHighpass)
            .connect(feedbackGain)
            .connect(feedbackDelay)
            .connect(feedbackSplitter);
        feedbackSplitter.connect(feedbackMerger, 0, 1);
        feedbackSplitter.connect(feedbackMerger, 1, 0);
        feedbackGain.connect(output);
    };
});
define("rotary/export", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exportVideo = () => __awaiter(void 0, void 0, void 0, function* () {
        const chunks = [];
        let bytesTotal = 0 | 0;
        const encoder = new VideoEncoder({
            output: ((chunk, metadata) => {
                console.log(chunk, metadata);
                chunks.push(chunk);
                bytesTotal += chunk.byteLength;
            }),
            error: (error) => {
                console.warn(error);
            }
        });
        encoder.configure({
            width: 512,
            height: 512,
            codec: "vp8"
        });
        console.log(`encoder.state = ${encoder.state}`);
        console.log("create canvas");
        const canvas = document.querySelector("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d", { alpha: true });
        context.fillStyle = "red";
        context.fillRect(64, 64, 64, 64);
        console.log(`flush encodeQueueSize: ${encoder.encodeQueueSize}`);
        encoder.encode(new VideoFrame(canvas));
        context.fillStyle = "green";
        context.fillRect(96, 96, 64, 64);
        console.log(`flush encodeQueueSize: ${encoder.encodeQueueSize}`);
        encoder.encode(new VideoFrame(canvas));
        yield encoder.flush();
        console.log(`flushed encodeQueueSize: ${encoder.encodeQueueSize}`);
        console.log("close");
        encoder.close();
        const bytes = new Uint8Array(bytesTotal);
        const view = new DataView(bytes.buffer);
        for (const chunk of chunks) {
            chunk.copyTo(view);
        }
        console.log(bytes);
    });
});
define("dom/menu", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ListItemDefaultData {
        constructor(label, shortcut = "", checked = false) {
            this.label = label;
            this.shortcut = shortcut;
            this.checked = checked;
        }
        toString() {
            return this.label;
        }
    }
    exports.ListItemDefaultData = ListItemDefaultData;
    class ListItem {
        constructor(data) {
            this.data = data;
            this.separatorBefore = false;
            this.selectable = true;
            this.permanentChildren = [];
            this.transientChildren = [];
            this.transientChildrenCallback = null;
            this.openingCallback = null;
            this.triggerCallback = null;
            this.isOpening = false;
        }
        static root() {
            return new ListItem(null);
        }
        static default(label, shortcut, checked) {
            return new ListItem(new ListItemDefaultData(label, shortcut, checked));
        }
        addListItem(listItem) {
            if (this.isOpening) {
                this.transientChildren.push(listItem);
            }
            else {
                this.permanentChildren.push(listItem);
            }
            return this;
        }
        opening() {
            if (null !== this.openingCallback) {
                this.openingCallback(this);
            }
        }
        trigger() {
            if (null === this.triggerCallback) {
                console.log("You selected '" + this.data + "'");
            }
            else {
                this.triggerCallback(this);
            }
        }
        isSelectable(value = true) {
            this.selectable = value;
            return this;
        }
        addSeparatorBefore() {
            this.separatorBefore = true;
            return this;
        }
        addRuntimeChildrenCallback(callback) {
            this.transientChildrenCallback = callback;
            return this;
        }
        onOpening(callback) {
            this.openingCallback = callback;
            return this;
        }
        onTrigger(callback) {
            this.triggerCallback = callback;
            return this;
        }
        hasChildren() {
            return 0 < this.permanentChildren.length || null !== this.transientChildrenCallback;
        }
        collectChildren() {
            if (null === this.transientChildrenCallback) {
                return this.permanentChildren;
            }
            this.isOpening = true;
            this.transientChildrenCallback(this);
            this.isOpening = false;
            return this.permanentChildren.concat(this.transientChildren);
        }
        removeTransientChildren() {
            this.transientChildren.splice(0, this.transientChildren.length);
        }
    }
    exports.ListItem = ListItem;
    class Controller {
        constructor() {
            this.root = null;
            this.layer = null;
            this.onClose = null;
            this.mouseDownHandler = event => {
                if (null === this.root) {
                    throw new Error("No root");
                }
                if (!Menu.Controller.reduceAll(m => {
                    const rect = m.element.getBoundingClientRect();
                    return event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom;
                })) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    this.close();
                }
            };
        }
        open(listItem, onClose, x, y, docked) {
            if (null === this.layer) {
                this.layer = document.createElement("div");
                this.layer.classList.add("menu-layer");
                document.body.appendChild(this.layer);
            }
            else if (null !== this.root) {
                this.close();
            }
            this.root = new Menu(listItem, docked);
            this.root.moveTo(x, y);
            this.root.attach(this.layer, null);
            this.onClose = onClose;
            window.addEventListener("mousedown", this.mouseDownHandler, true);
        }
        close() {
            if (null === this.root) {
                throw new Error("Cannot close root.");
            }
            this.onClose();
            this.onClose = null;
            this.root.dispose();
            this.root = null;
        }
        onDispose(pullDown) {
            if (this.root === pullDown) {
                window.removeEventListener("mousedown", this.mouseDownHandler, true);
                this.root = null;
            }
        }
        shutdown() {
            this.iterateAll(menu => menu.element.classList.add("shutdown"));
        }
        iterateAll(callback) {
            let menu = this.root;
            do {
                callback(menu);
                menu = menu.childMenu;
            } while (menu !== null);
        }
        reduceAll(callback) {
            let menu = this.root;
            let result = 0;
            do {
                result |= callback(menu);
                menu = menu.childMenu;
            } while (menu !== null);
            return result;
        }
    }
    class Menu {
        constructor(listItem, docked = false) {
            this.listItem = listItem;
            this.childMenu = null;
            this.element = document.createElement("nav");
            this.container = document.createElement("div");
            this.scrollUp = document.createElement("div");
            this.scrollDown = document.createElement("div");
            this.selectedDiv = null;
            this.x = 0 | 0;
            this.y = 0 | 0;
            this.element.classList.add("menu");
            this.element.addEventListener("contextmenu", event => {
                event.preventDefault();
                event.stopImmediatePropagation();
            }, true);
            if (docked) {
                this.element.classList.add("docked");
            }
            this.container = document.createElement("div");
            this.container.classList.add("container");
            this.scrollUp = document.createElement("div");
            this.scrollUp.textContent = "▲";
            this.scrollUp.classList.add("transparent");
            this.scrollUp.classList.add("scroll");
            this.scrollUp.classList.add("up");
            this.scrollDown = document.createElement("div");
            this.scrollDown.textContent = "▼";
            this.scrollDown.classList.add("transparent");
            this.scrollDown.classList.add("scroll");
            this.scrollDown.classList.add("down");
            this.element.appendChild(this.scrollUp);
            this.element.appendChild(this.container);
            this.element.appendChild(this.scrollDown);
            for (const listItem of this.listItem.collectChildren()) {
                listItem.opening();
                if (listItem.separatorBefore) {
                    this.container.appendChild(document.createElement("hr"));
                }
                const div = document.createElement("div");
                if (listItem.selectable) {
                    div.classList.add("selectable");
                }
                else {
                    div.classList.remove("selectable");
                }
                if (listItem.hasChildren()) {
                    div.classList.add("has-children");
                }
                div.onmouseenter = () => {
                    if (null !== this.selectedDiv) {
                        this.selectedDiv.classList.remove("selected");
                        this.selectedDiv = null;
                    }
                    div.classList.add("selected");
                    this.selectedDiv = div;
                    const hasChildren = listItem.hasChildren();
                    if (null !== this.childMenu) {
                        if (hasChildren && this.childMenu.listItem === listItem) {
                            return;
                        }
                        this.childMenu.dispose();
                        this.childMenu = null;
                    }
                    if (hasChildren) {
                        const divRect = div.getBoundingClientRect();
                        this.childMenu = new Menu(listItem);
                        this.childMenu.moveTo(divRect.left + divRect.width, divRect.top - 8);
                        this.childMenu.attach(this.element.parentElement, this);
                    }
                };
                div.onmouseleave = event => {
                    if (this.isChild(event.relatedTarget)) {
                        return;
                    }
                    div.classList.remove("selected");
                    this.selectedDiv = null;
                    if (null !== this.childMenu) {
                        this.childMenu.dispose();
                        this.childMenu = null;
                    }
                };
                div.onmouseup = event => {
                    event.preventDefault();
                    if (null === this.childMenu) {
                        div.addEventListener("animationend", () => {
                            listItem.trigger();
                            Menu.Controller.close();
                        }, { once: true });
                        div.classList.add("triggered");
                        Menu.Controller.shutdown();
                    }
                    return true;
                };
                const renderer = Menu.Renderer.get(listItem.data.constructor);
                if (renderer) {
                    renderer(div, listItem.data);
                }
                else {
                    throw new Error("No renderer found for " + listItem.data);
                }
                this.container.appendChild(div);
            }
        }
        moveTo(x, y) {
            this.x = x | 0;
            this.y = y | 0;
            this.element.style.transform = "translate(" + this.x + "px, " + this.y + "px)";
        }
        attach(parentNode, parentMenu = null) {
            parentNode.appendChild(this.element);
            const clientRect = this.element.getBoundingClientRect();
            if (clientRect.left + clientRect.width > parentNode.clientWidth) {
                if (null === parentMenu || undefined === parentMenu) {
                    this.moveTo(this.x - clientRect.width, this.y);
                }
                else {
                    this.moveTo(parentMenu.x - clientRect.width, this.y);
                }
            }
            if (clientRect.height >= parentNode.clientHeight) {
                this.moveTo(this.x, 0);
                this.makeScrollable();
            }
            else if (clientRect.top + clientRect.height > parentNode.clientHeight) {
                this.moveTo(this.x, parentNode.clientHeight - clientRect.height);
            }
        }
        dispose() {
            if (null !== this.childMenu) {
                this.childMenu.dispose();
                this.childMenu = null;
            }
            Menu.Controller.onDispose(this);
            this.element.remove();
            this.element = null;
            this.listItem.removeTransientChildren();
            this.listItem = null;
            this.selectedDiv = null;
        }
        domElement() {
            return this.element;
        }
        isChild(target) {
            if (null === this.childMenu) {
                return false;
            }
            while (null !== target) {
                if (target === this.element) {
                    return false;
                }
                if (target === this.childMenu.domElement()) {
                    return true;
                }
                target = target.parentNode;
            }
            return false;
        }
        makeScrollable() {
            const scroll = direction => this.container.scrollTop += direction;
            this.element.classList.add("overflowing");
            this.element.addEventListener("wheel", event => scroll(Math.sign(event.deltaY) * 6), { passive: false });
            const canScroll = (direction) => {
                if (0 > direction && 0 === this.container.scrollTop) {
                    return false;
                }
                if (0 < direction && this.container.scrollTop === this.container.scrollHeight - this.container.clientHeight) {
                    return false;
                }
                return true;
            };
            const setup = (button, direction) => {
                button.onmouseenter = () => {
                    if (!canScroll(direction)) {
                        return;
                    }
                    button.classList.add("scrolling");
                    let active = true;
                    const scrolling = () => {
                        scroll(direction);
                        if (!canScroll(direction)) {
                            active = false;
                        }
                        if (active) {
                            window.requestAnimationFrame(scrolling);
                        }
                        else {
                            button.classList.remove("scrolling");
                        }
                    };
                    window.requestAnimationFrame(scrolling);
                    button.onmouseleave = () => {
                        active = false;
                        button.onmouseup = null;
                    };
                };
            };
            setup(this.scrollUp, -8);
            setup(this.scrollDown, 8);
        }
    }
    exports.Menu = Menu;
    Menu.Controller = new Controller();
    Menu.Renderer = new Map();
    Menu.Renderer.set(ListItemDefaultData, (element, data) => {
        element.classList.add("default");
        element.innerHTML =
            `<svg class="check-icon"><use xlink:href="#menu-checked"></use></svg>
             <span class="label">${data.label}</span>
             <span class="shortcut">${data.shortcut}</span>
             <svg class="children-icon"><use xlink:href="#menu-children"></use></svg>`;
        if (data.checked) {
            element.classList.add("checked");
        }
    });
    class MenuBar {
        constructor() {
            this.offsetX = 0;
            this.offsetY = 0;
            this.openListItem = null;
        }
        static install() {
            return new MenuBar();
        }
        offset(x, y) {
            this.offsetX = x;
            this.offsetY = y;
            return this;
        }
        addButton(button, listItem) {
            button.onmousedown = () => this.open(button, listItem);
            button.onmouseenter = () => {
                if (null !== this.openListItem && this.openListItem !== listItem) {
                    this.open(button, listItem);
                }
            };
            return this;
        }
        open(button, listItem) {
            button.classList.add("selected");
            const rect = button.getBoundingClientRect();
            const x = rect.left + this.offsetX;
            const y = rect.bottom + this.offsetY;
            const onClose = () => {
                this.openListItem = null;
                button.classList.remove("selected");
            };
            Menu.Controller.open(listItem, onClose, x, y, true);
            this.openListItem = listItem;
        }
    }
    exports.MenuBar = MenuBar;
});
define("app/main", ["require", "exports", "rotary/model", "rotary/ui", "rotary/render", "lib/math", "lib/chords", "lib/dsp", "lib/common", "rotary/export", "dom/menu"], function (require, exports, model_3, ui_1, render_1, math_3, chords_1, dsp_1, common_10, export_1, menu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const canvas = document.querySelector("canvas");
    const labelSize = document.querySelector("label.size");
    const c2D = canvas.getContext("2d", { alpha: true });
    const model = new model_3.RotaryModel().randomize(new math_3.Mulberry32(Math.floor(0x987123F * Math.random())));
    const renderer = new render_1.RotaryRenderer(c2D, model);
    const ui = ui_1.RotaryUI.create(model, renderer);
    const pickerOpts = { types: [{ description: "rotary", accept: { "json/*": [".json"] } }] };
    const nav = document.querySelector("nav#app-menu");
    menu_1.MenuBar.install()
        .offset(0, 0)
        .addButton(nav.querySelector("[data-menu='file']"), menu_1.ListItem.root()
        .addListItem(menu_1.ListItem.default("Open...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const fileHandles = yield window.showOpenFilePicker(pickerOpts);
        if (0 === fileHandles.length) {
            return;
        }
        const fileStream = yield fileHandles[0].getFile();
        const text = yield fileStream.text();
        const format = yield JSON.parse(text);
        model.deserialize(format);
    })))
        .addListItem(menu_1.ListItem.default("Save...", "", false)
        .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
        const fileHandle = yield window.showSaveFilePicker(pickerOpts);
        const fileStream = yield fileHandle.createWritable();
        yield fileStream.write(new Blob([JSON.stringify(model.serialize())], { type: "application/json" }));
        yield fileStream.close();
    })))
        .addListItem(menu_1.ListItem.default("Export", "", false)
        .onTrigger(() => export_1.exportVideo()))
        .addListItem(menu_1.ListItem.default("Clear", "", false)
        .onTrigger(() => model.clear()))
        .addListItem(menu_1.ListItem.default("Randomize", "", false)
        .onTrigger(() => model.randomize(new math_3.Mulberry32(Math.floor(0x987123F * Math.random())))))
        .addListItem(menu_1.ListItem.default("Randomize Track(s)", "", false)
        .onTrigger(() => model.randomizeTracks(new math_3.Mulberry32(Math.floor(0x987123F * Math.random()))))))
        .addButton(nav.querySelector("[data-menu='edit']"), menu_1.ListItem.root()
        .addListItem(menu_1.ListItem.default("Create Track", "", false)
        .onTrigger(() => {
        ui.createNew(null, false);
    }))
        .addListItem(menu_1.ListItem.default("Copy Track", "", false)
        .onOpening(item => item.isSelectable(ui.hasSelected()))
        .onTrigger(() => {
        ui.createNew(null, true);
    }))
        .addListItem(menu_1.ListItem.default("Delete Track", "", false)
        .onOpening(item => item.isSelectable(ui.hasSelected()))
        .onTrigger(() => {
        ui.deleteTrack();
    })))
        .addButton(nav.querySelector("[data-menu='view']"), menu_1.ListItem.root()
        .addListItem(menu_1.ListItem.default("Nothing yet", "", false)))
        .addButton(nav.querySelector("[data-menu='help']"), menu_1.ListItem.root()
        .addListItem(menu_1.ListItem.default("Nothing yet", "", false)));
    const progressIndicator = document.getElementById("progress");
    const radiant = parseInt(progressIndicator.getAttribute("r"), 10) * 2.0 * Math.PI;
    progressIndicator.setAttribute("stroke-dasharray", radiant.toFixed(2));
    const setProgress = value => progressIndicator.setAttribute("stroke-dashoffset", ((1.0 - value) * radiant).toFixed(2));
    const context = new AudioContext();
    if (context.state !== "running") {
        window.addEventListener("mousedown", () => context.resume(), { once: true });
    }
    else {
    }
    const compose = chords_1.Chords.compose(chords_1.Chords.Minor, 60, 0, 5);
    const gains = [];
    const sum = context.createGain();
    for (let i = 0; i < model.tracks.size(); i++) {
        const t = model.tracks.size() - i - 1;
        const oscillator = context.createOscillator();
        const o = Math.floor(t / compose.length);
        const n = t % compose.length;
        oscillator.frequency.value = dsp_1.DSP.midiToHz(compose[n] + o * 12);
        oscillator.start();
        const gainNode = context.createGain();
        gainNode.gain.value = 0.0;
        oscillator.connect(gainNode);
        gainNode.connect(sum);
        gains[i] = gainNode;
    }
    let frame = 0;
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const impulse = yield common_10.readAudio(context, "../impulse/Deep Space.ogg");
        const convolverNode = context.createConvolver();
        convolverNode.buffer = impulse;
        const wetGain = context.createGain();
        wetGain.gain.value = 0.5;
        sum.connect(convolverNode).connect(wetGain).connect(context.destination);
        sum.connect(context.destination);
        dsp_1.pulsarDelay(context, sum, context.destination, 0.500, 0.750, 0.250, 0.5, 20000.0, 20.0);
        console.log("ready...");
        let prevTime = NaN;
        const seconds = 8.0;
        const enterFrame = (time) => {
            if (!isNaN(prevTime)) {
            }
            prevTime = time;
            let progress = context.currentTime * 0.125;
            progress -= Math.floor(progress);
            const size = model.measureRadius() * 2;
            const ratio = Math.ceil(devicePixelRatio);
            for (let i = 0; i < gains.length; i++) {
                const value = model.tracks.get(i).ratio(progress);
                gains[i].gain.linearRampToValueAtTime(0.0 < value ? 0.04 * value * value * value : 0.0, context.currentTime + 0.04);
            }
            canvas.width = size * ratio;
            canvas.height = size * ratio;
            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;
            labelSize.textContent = `${size}`;
            c2D.clearRect(0.0, 0.0, size, size);
            c2D.save();
            c2D.scale(ratio, ratio);
            c2D.translate(size >> 1, size >> 1);
            renderer.draw(progress);
            c2D.restore();
            setProgress(progress);
            frame++;
            requestAnimationFrame(enterFrame);
        };
        requestAnimationFrame(enterFrame);
    }))();
});
//# sourceMappingURL=main.js.map