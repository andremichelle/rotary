import {BoundNumericValue, Serializer, Terminable, Terminator} from "../lib/common.js"
import {Linear} from "../lib/mapping.js"
import {Func, Random} from "../lib/math.js"

type Data = PowData | CShapeData | TShapeData | SmoothStepData

export type MotionType = { new(): Motion<any> }

export declare interface MotionFormat<DATA extends Data> {
    class: string
    data: DATA
}

const MotionTypes: MotionType[] = []

export abstract class Motion<DATA extends Data> implements Serializer<MotionFormat<DATA>>, Terminable {
    static from(format: MotionFormat<any>): Motion<any> {
        switch (format.class) {
            case LinearMotion.name:
                return new LinearMotion()
            case PowMotion.name:
                return new PowMotion().deserialize(format)
            case TShapeMotion.name:
                return new TShapeMotion().deserialize(format)
            case CShapeMotion.name:
                return new CShapeMotion().deserialize(format)
            case SmoothStepMotion.name:
                return new SmoothStepMotion().deserialize(format)
        }
        throw new Error("Unknown movement format")
    }

    static random(random: Random): Motion<any> {
        return new MotionTypes[Math.floor(random.nextDouble(0.0, MotionTypes.length))]().randomize(random)
    }

    protected readonly terminator: Terminator = new Terminator()

    abstract map(x: number): number

    abstract deserialize(format: MotionFormat<DATA>): Motion<DATA>

    abstract serialize(): MotionFormat<DATA>

    abstract copy(): Motion<DATA>

    abstract randomize(random: Random): Motion<DATA>

    pack(data: DATA): MotionFormat<DATA> {
        return {
            class: this.constructor.name,
            data: data
        }
    }

    unpack(format: MotionFormat<DATA>): DATA {
        console.assert(this.constructor.name === format.class)
        return format.data
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

export class LinearMotion extends Motion<never> {
    map(x: number): number {
        return x
    }

    serialize(): MotionFormat<never> {
        return super.pack.call(this) // this might break in future version of typescript
    }

    deserialize(format: MotionFormat<never>): LinearMotion {
        super.unpack(format)
        return this
    }

    copy(): LinearMotion {
        return new LinearMotion()
    }

    randomize(random: Random): Motion<never> {
        return this
    }
}

declare interface PowData {
    exponent: number
}

export class PowMotion extends Motion<PowData> {
    private readonly range = new Linear(1.0, 16.0)

    readonly exponent = this.terminator.with(new BoundNumericValue(this.range, 2.0))

    map(x: number): number {
        return Math.pow(x, this.exponent.get())
    }

    serialize(): MotionFormat<PowData> {
        return super.pack({exponent: this.exponent.get()})
    }

    deserialize(format: MotionFormat<PowData>): PowMotion {
        this.exponent.set(super.unpack(format).exponent)
        return this
    }

    copy(): PowMotion {
        const motion = new PowMotion()
        motion.exponent.set(this.exponent.get())
        return motion
    }

    randomize(random: Random): Motion<PowData> {
        this.exponent.set(random.nextDouble(2.0, 4.0))
        return this
    }
}

declare interface CShapeData {
    slope: number
}

export class CShapeMotion extends Motion<CShapeData> {
    private readonly range = new Linear(0.0, 8.0)

    readonly slope = this.terminator.with(new BoundNumericValue(this.range, 1.0))

    private o: number
    private c: number

    constructor() {
        super()
        this.terminator.with(this.slope.addObserver(() => this.update()))
        this.update()
    }

    map(x: number): number {
        // https://www.desmos.com/calculator/bpbuua3l0j
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5
    }

    serialize(): MotionFormat<CShapeData> {
        return super.pack({slope: this.slope.get()})
    }

    deserialize(format: MotionFormat<CShapeData>): CShapeMotion {
        this.slope.set(super.unpack(format).slope)
        return this
    }

    copy(): CShapeMotion {
        const motion = new CShapeMotion()
        motion.slope.set(this.slope.get())
        return motion
    }

    randomize(random: Random): Motion<CShapeData> {
        this.slope.set(random.nextDouble(1.0, 4.0))
        return this
    }

    private update(): void {
        this.o = Math.pow(2.0, this.slope.get())
        this.c = Math.pow(2.0, this.o - 1)
    }
}

declare interface TShapeData {
    shape: number
}

export class TShapeMotion extends Motion<TShapeData> {
    private readonly range = Linear.Bipolar

    readonly shape = this.terminator.with(new BoundNumericValue(this.range, 0.5))

    constructor() {
        super()
    }

    map(x: number): number {
        return Func.tx(x, this.shape.get())
    }

    serialize(): MotionFormat<TShapeData> {
        return super.pack({shape: this.shape.get()})
    }

    deserialize(format: MotionFormat<TShapeData>): TShapeMotion {
        this.shape.set(super.unpack(format).shape)
        return this
    }

    copy(): TShapeMotion {
        const motion = new TShapeMotion()
        motion.shape.set(this.shape.get())
        return motion
    }

    randomize(random: Random): Motion<TShapeData> {
        this.shape.set(random.nextDouble(this.range.min, this.range.max))
        return this
    }
}

declare interface SmoothStepData {
    edge0: number
    edge1: number
}

export class SmoothStepMotion extends Motion<SmoothStepData> {
    readonly edge0 = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.25))
    readonly edge1 = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.75))

    constructor() {
        super()
    }

    map(x: number): number {
        return Func.smoothStep(Func.step(this.edge0.get(), this.edge1.get(), x))
    }

    deserialize(format: MotionFormat<SmoothStepData>): SmoothStepMotion {
        const data = this.unpack(format)
        this.edge0.set(data.edge0)
        this.edge1.set(data.edge1)
        return this
    }

    serialize(): MotionFormat<SmoothStepData> {
        return super.pack({edge0: this.edge0.get(), edge1: this.edge1.get()})
    }

    copy(): SmoothStepMotion {
        const motion = new SmoothStepMotion()
        motion.edge0.set(this.edge0.get())
        motion.edge1.set(this.edge1.get())
        return motion
    }

    randomize(random: Random): Motion<SmoothStepData> {
        this.edge0.set(random.nextDouble(0.125, 0.375))
        this.edge1.set(random.nextDouble(0.625, 0.875))
        return this
    }
}

MotionTypes.push(LinearMotion)
MotionTypes.push(PowMotion)
MotionTypes.push(CShapeMotion)
MotionTypes.push(TShapeMotion)
MotionTypes.push(SmoothStepMotion)