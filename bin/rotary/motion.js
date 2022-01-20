import { BoundNumericValue, Terminator } from "../lib/common.js";
import { Linear } from "../lib/mapping.js";
import { Func } from "../lib/math.js";
const MotionTypes = [];
export class Motion {
    constructor() {
        this.terminator = new Terminator();
    }
    static from(format) {
        switch (format.class) {
            case LinearMotion.name:
                return new LinearMotion();
            case PowMotion.name:
                return new PowMotion().deserialize(format);
            case TShapeMotion.name:
                return new TShapeMotion().deserialize(format);
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
export class LinearMotion extends Motion {
    map(x) {
        return x;
    }
    serialize() {
        return super.pack.call(this);
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
export class PowMotion extends Motion {
    constructor() {
        super(...arguments);
        this.range = new Linear(1.0, 16.0);
        this.exponent = this.terminator.with(new BoundNumericValue(this.range, 2.0));
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
export class CShapeMotion extends Motion {
    constructor() {
        super();
        this.range = new Linear(0.0, 8.0);
        this.slope = this.terminator.with(new BoundNumericValue(this.range, 1.0));
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
export class TShapeMotion extends Motion {
    constructor() {
        super();
        this.range = Linear.Bipolar;
        this.shape = this.terminator.with(new BoundNumericValue(this.range, 0.5));
    }
    map(x) {
        return Func.tx(x, this.shape.get());
    }
    serialize() {
        return super.pack({ shape: this.shape.get() });
    }
    deserialize(format) {
        this.shape.set(super.unpack(format).shape);
        return this;
    }
    copy() {
        const motion = new TShapeMotion();
        motion.shape.set(this.shape.get());
        return motion;
    }
    randomize(random) {
        this.shape.set(random.nextDouble(this.range.min, this.range.max));
        return this;
    }
}
export class SmoothStepMotion extends Motion {
    constructor() {
        super();
        this.edge0 = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.25));
        this.edge1 = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.75));
    }
    map(x) {
        return Func.smoothStep(Func.step(this.edge0.get(), this.edge1.get(), x));
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
MotionTypes.push(LinearMotion);
MotionTypes.push(PowMotion);
MotionTypes.push(CShapeMotion);
MotionTypes.push(TShapeMotion);
MotionTypes.push(SmoothStepMotion);
//# sourceMappingURL=motion.js.map