import { Linear } from "./mapping.js";
export const TAU = Math.PI * 2.0;
export class TerminableVoid {
    terminate() {
    }
}
TerminableVoid.Instance = new TerminableVoid();
export class Terminator {
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
export class Options {
    static valueOf(value) {
        return null === value || undefined === value ? Options.None : new Options.Some(value);
    }
}
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
export class ObservableImpl {
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
export class ObservableValueVoid {
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
ObservableValueVoid.Instance = new ObservableValueVoid();
export var CollectionEventType;
(function (CollectionEventType) {
    CollectionEventType[CollectionEventType["Add"] = 0] = "Add";
    CollectionEventType[CollectionEventType["Remove"] = 1] = "Remove";
    CollectionEventType[CollectionEventType["Order"] = 2] = "Order";
})(CollectionEventType || (CollectionEventType = {}));
export class CollectionEvent {
    constructor(collection, type, item = null, index = -1) {
        this.collection = collection;
        this.type = type;
        this.item = item;
        this.index = index;
    }
}
export class ObservableCollection {
    constructor() {
        this.observable = new ObservableImpl();
        this.values = [];
    }
    static observeNested(collection, observer) {
        const itemObserver = _ => observer(collection);
        const observers = new Map();
        collection.forEach((observable) => observers.set(observable, observable.addObserver(itemObserver)));
        collection.addObserver((event) => {
            if (event.type === CollectionEventType.Add) {
                observers.set(event.item, event.item.addObserver(itemObserver));
            }
            else if (event.type === CollectionEventType.Remove) {
                const observer = observers.get(event.item);
                console.assert(observer !== undefined);
                observers.delete(event.item);
                observer.terminate();
            }
            else if (event.type === CollectionEventType.Order) {
            }
            observer(collection);
        });
        return {
            terminate() {
                observers.forEach((value) => value.terminate());
                observers.clear();
            }
        };
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
    first() {
        return 0 < this.values.length ? Options.valueOf(this.values[0]) : Options.None;
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
export class ObservableValueImpl {
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
export class BoundNumericValue {
    constructor(range = Linear.Identity, value = 0.5) {
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
export class NumericStepper {
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
NumericStepper.Integer = new NumericStepper(1);
NumericStepper.Hundredth = new NumericStepper(0.01);
export class PrintMapping {
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
            return Math.round(value) | 0;
        }, value => String(value), "", postUnit);
    }
    static float(numPrecision, preUnit, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return value;
        }, value => value.toFixed(numPrecision), preUnit, postUnit);
    }
    parse(text) {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
    }
    print(value) {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`;
    }
}
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
export const binarySearch = (values, key) => {
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
export class UniformRandomMapping {
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
        const index = binarySearch(this.values, y);
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
export const readBinary = (url) => {
    return new Promise((resolve, reject) => {
        const r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.responseType = "arraybuffer";
        r.onload = ignore => resolve(r.response);
        r.onerror = event => reject(event);
        r.send(null);
    });
};
export const readAudio = (context, url) => {
    return readBinary(url).then(buffer => decodeAudioData(context, buffer));
};
export const decodeAudioData = (context, buffer) => {
    return context.decodeAudioData(buffer);
};
//# sourceMappingURL=common.js.map