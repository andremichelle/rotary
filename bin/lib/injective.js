import { BoundNumericValue, ObservableImpl, Terminator } from "./common.js";
import { Linear } from "./mapping.js";
import { Func } from "./math.js";
const InjectiveTypes = [];
export class Injective {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
    }
    static from(format) {
        switch (format.class) {
            case IdentityInjective.name:
                return new IdentityInjective();
            case PowInjective.name:
                return new PowInjective().deserialize(format);
            case TShapeInjective.name:
                return new TShapeInjective().deserialize(format);
            case CShapeInjective.name:
                return new CShapeInjective().deserialize(format);
            case SmoothStepInjective.name:
                return new SmoothStepInjective().deserialize(format);
        }
        throw new Error("Unknown movement format");
    }
    static random(random) {
        return new InjectiveTypes[Math.floor(random.nextDouble(0.0, InjectiveTypes.length))]().randomize(random);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
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
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this)));
        return this.terminator.with(property);
    }
    terminate() {
        this.terminator.terminate();
    }
}
export class IdentityInjective extends Injective {
    fx(x) {
        return x;
    }
    fy(y) {
        return y;
    }
    serialize() {
        return super.pack();
    }
    deserialize(format) {
        super.unpack(format);
        return this;
    }
    copy() {
        return new IdentityInjective();
    }
    randomize(random) {
        return this;
    }
}
export class PowInjective extends Injective {
    constructor() {
        super(...arguments);
        this.range = new Linear(1.0, 16.0);
        this.exponent = this.bindValue(new BoundNumericValue(this.range, 2.0));
    }
    fx(x) {
        return Math.pow(x, this.exponent.get());
    }
    fy(y) {
        return Math.pow(y, 1.0 / this.exponent.get());
    }
    serialize() {
        return super.pack({ exponent: this.exponent.get() });
    }
    deserialize(format) {
        this.exponent.set(super.unpack(format).exponent);
        return this;
    }
    copy() {
        const copy = new PowInjective();
        copy.exponent.set(this.exponent.get());
        return copy;
    }
    randomize(random) {
        this.exponent.set(random.nextDouble(2.0, 4.0));
        return this;
    }
}
export class CShapeInjective extends Injective {
    constructor() {
        super();
        this.range = new Linear(0.0, 2.0);
        this.slope = this.bindValue(new BoundNumericValue(this.range, 1.0));
        this.terminator.with(this.slope.addObserver(() => this.update()));
        this.update();
    }
    fx(x) {
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5;
    }
    fy(y) {
        return Math.sign(y - 0.5) * Math.pow(Math.abs(y - 0.5) / this.c, 1.0 / this.o) + 0.5;
    }
    serialize() {
        return super.pack({ slope: this.slope.get() });
    }
    deserialize(format) {
        this.slope.set(super.unpack(format).slope);
        return this;
    }
    copy() {
        const copy = new CShapeInjective();
        copy.slope.set(this.slope.get());
        return copy;
    }
    randomize(random) {
        this.slope.set(random.nextDouble(0.5, 2.0));
        return this;
    }
    update() {
        this.o = Math.pow(2.0, this.slope.get());
        this.c = Math.pow(2.0, this.o - 1);
    }
}
export class TShapeInjective extends Injective {
    constructor() {
        super();
        this.range = Linear.Bipolar;
        this.shape = this.bindValue(new BoundNumericValue(this.range, 0.5));
    }
    fx(x) {
        return Func.tx(x, this.shape.get());
    }
    fy(y) {
        return Func.ty(y, this.shape.get());
    }
    serialize() {
        return super.pack({ shape: this.shape.get() });
    }
    deserialize(format) {
        this.shape.set(super.unpack(format).shape);
        return this;
    }
    copy() {
        const copy = new TShapeInjective();
        copy.shape.set(this.shape.get());
        return copy;
    }
    randomize(random) {
        this.shape.set(random.nextDouble(this.range.min, this.range.max));
        return this;
    }
}
export class SmoothStepInjective extends Injective {
    constructor() {
        super();
        this.edge0 = this.bindValue(new BoundNumericValue(Linear.Identity, 0.25));
        this.edge1 = this.bindValue(new BoundNumericValue(Linear.Identity, 0.75));
    }
    fx(x) {
        return Func.smoothStep(Func.step(this.edge0.get(), this.edge1.get(), x));
    }
    fy(y) {
        return Math.min(1.0, Math.max(0.0, this.edge0.get()
            + Func.smoothStepInverse(y) * (this.edge1.get() - this.edge0.get())));
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
        const copy = new SmoothStepInjective();
        copy.edge0.set(this.edge0.get());
        copy.edge1.set(this.edge1.get());
        return copy;
    }
    randomize(random) {
        this.edge0.set(random.nextDouble(0.125, 0.375));
        this.edge1.set(random.nextDouble(0.625, 0.875));
        return this;
    }
}
InjectiveTypes.push(IdentityInjective);
InjectiveTypes.push(PowInjective);
InjectiveTypes.push(CShapeInjective);
InjectiveTypes.push(TShapeInjective);
InjectiveTypes.push(SmoothStepInjective);
//# sourceMappingURL=injective.js.map