import {
    binarySearch,
    BoundNumericValue,
    Observable,
    ObservableImpl,
    ObservableValue,
    ObservableValueImpl,
    Observer,
    Serializer,
    Terminable,
    Terminator
} from "./common.js"
import {Linear, LinearInteger} from "./mapping.js"
import {Func, Mulberry32, Random} from "./math.js"

type Data = PowData | CShapeData | TShapeData | SmoothStepData | MonoNoiseData

export type InjectiveType = { new(): Injective<any> }

export declare interface InjectiveFormat<DATA extends Data> {
    class: string
    data: DATA
}

const InjectiveTypes: InjectiveType[] = []

// noinspection JSUnusedGlobalSymbols
export abstract class Injective<DATA extends Data> implements Observable<Injective<DATA>>, Serializer<InjectiveFormat<DATA>>, Terminable {
    static from(format: InjectiveFormat<any>): Injective<any> {
        switch (format.class) {
            case IdentityInjective.name:
                return new IdentityInjective()
            case PowInjective.name:
                return new PowInjective().deserialize(format)
            case TShapeInjective.name:
                return new TShapeInjective().deserialize(format)
            case CShapeInjective.name:
                return new CShapeInjective().deserialize(format)
            case SmoothStepInjective.name:
                return new SmoothStepInjective().deserialize(format)
            case MonoNoiseInjective.name:
                return new MonoNoiseInjective().deserialize(format)
        }
        throw new Error("Unknown movement format")
    }

    static random(random: Random): Injective<any> {
        return new InjectiveTypes[Math.floor(random.nextDouble(0.0, InjectiveTypes.length))]().randomize(random)
    }

    protected readonly terminator: Terminator = new Terminator()
    protected readonly observable: ObservableImpl<Injective<DATA>> = new ObservableImpl<Injective<DATA>>()

    abstract fx(x: number): number

    abstract fy(y: number): number

    abstract deserialize(format: InjectiveFormat<DATA>): Injective<DATA>

    abstract serialize(): InjectiveFormat<DATA>

    abstract copy(): Injective<DATA>

    abstract randomize(random: Random): Injective<DATA>

    addObserver(observer: Observer<Injective<DATA>>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<Injective<DATA>>): boolean {
        return this.observable.removeObserver(observer)
    }

    pack(data?: DATA): InjectiveFormat<DATA> {
        return {
            class: this.constructor.name,
            data: data
        }
    }

    unpack(format: InjectiveFormat<DATA>): DATA {
        console.assert(this.constructor.name === format.class)
        return format.data
    }

    terminate(): void {
        this.terminator.terminate()
    }

    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T> {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false))
        return this.terminator.with(property)
    }
}

export class IdentityInjective extends Injective<never> {
    fx(x: number): number {
        return x
    }

    fy(y: number): number {
        return y
    }

    serialize(): InjectiveFormat<never> {
        return super.pack()
    }

    deserialize(format: InjectiveFormat<never>): IdentityInjective {
        super.unpack(format)
        return this
    }

    copy(): IdentityInjective {
        return new IdentityInjective()
    }

    randomize(random: Random): IdentityInjective {
        return this
    }
}

declare interface PowData {
    exponent: number
}

export class PowInjective extends Injective<PowData> {
    private readonly range = new Linear(1.0, 4.0)

    readonly exponent = this.bindValue(new BoundNumericValue(this.range, 2.0))

    fx(x: number): number {
        return Math.pow(x, this.exponent.get())
    }

    fy(y: number): number {
        return Math.pow(y, 1.0 / this.exponent.get())
    }

    serialize(): InjectiveFormat<PowData> {
        return super.pack({exponent: this.exponent.get()})
    }

    deserialize(format: InjectiveFormat<PowData>): PowInjective {
        this.exponent.set(super.unpack(format).exponent)
        return this
    }

    copy(): PowInjective {
        const copy = new PowInjective()
        copy.exponent.set(this.exponent.get())
        return copy
    }

    randomize(random: Random): PowInjective {
        this.exponent.set(random.nextDouble(2.0, 4.0))
        return this
    }
}

declare interface CShapeData {
    slope: number
}

// https://www.desmos.com/calculator/russ8nzeuj
export class CShapeInjective extends Injective<CShapeData> {
    private readonly range = new Linear(0.0, 2.0)

    readonly slope = this.bindValue(new BoundNumericValue(this.range, 1.0))

    private o: number
    private c: number

    constructor() {
        super()
        this.terminator.with(this.slope.addObserver(() => this.update(), true))
    }

    fx(x: number): number {
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5
    }

    fy(y: number): number {
        return Math.sign(y - 0.5) * Math.pow(Math.abs(y - 0.5) / this.c, 1.0 / this.o) + 0.5
    }

    serialize(): InjectiveFormat<CShapeData> {
        return super.pack({slope: this.slope.get()})
    }

    deserialize(format: InjectiveFormat<CShapeData>): CShapeInjective {
        this.slope.set(super.unpack(format).slope)
        return this
    }

    copy(): CShapeInjective {
        const copy = new CShapeInjective()
        copy.slope.set(this.slope.get())
        return copy
    }

    randomize(random: Random): CShapeInjective {
        this.slope.set(random.nextDouble(0.5, 2.0))
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

// https://www.desmos.com/calculator/p7pjn3bb6h
export class TShapeInjective extends Injective<TShapeData> {
    private readonly range = Linear.Bipolar

    readonly shape = this.bindValue(new BoundNumericValue(this.range, 0.5))

    constructor() {
        super()
    }

    fx(x: number): number {
        return Func.tx(x, this.shape.get())
    }

    fy(y: number): number {
        return Func.ty(y, this.shape.get())
    }

    serialize(): InjectiveFormat<TShapeData> {
        return super.pack({shape: this.shape.get()})
    }

    deserialize(format: InjectiveFormat<TShapeData>): TShapeInjective {
        this.shape.set(super.unpack(format).shape)
        return this
    }

    copy(): TShapeInjective {
        const copy = new TShapeInjective()
        copy.shape.set(this.shape.get())
        return copy
    }

    randomize(random: Random): TShapeInjective {
        this.shape.set(random.nextDouble(this.range.min, this.range.max))
        return this
    }
}

declare interface SmoothStepData {
    edge0: number
    edge1: number
}

export class SmoothStepInjective extends Injective<SmoothStepData> {
    readonly edge0 = this.bindValue(new BoundNumericValue(Linear.Identity, 0.25))
    readonly edge1 = this.bindValue(new BoundNumericValue(Linear.Identity, 0.75))

    constructor() {
        super()
    }

    fx(x: number): number {
        return Func.smoothStep(Func.step(this.edge0.get(), this.edge1.get(), x))
    }

    fy(y: number): number {
        return Math.min(1.0, Math.max(0.0, this.edge0.get()
            + Func.smoothStepInverse(y) * (this.edge1.get() - this.edge0.get())))
    }

    deserialize(format: InjectiveFormat<SmoothStepData>): SmoothStepInjective {
        const data = this.unpack(format)
        this.edge0.set(data.edge0)
        this.edge1.set(data.edge1)
        return this
    }

    serialize(): InjectiveFormat<SmoothStepData> {
        return super.pack({edge0: this.edge0.get(), edge1: this.edge1.get()})
    }

    copy(): SmoothStepInjective {
        const copy = new SmoothStepInjective()
        copy.edge0.set(this.edge0.get())
        copy.edge1.set(this.edge1.get())
        return copy
    }

    randomize(random: Random): SmoothStepInjective {
        this.edge0.set(random.nextDouble(0.125, 0.375))
        this.edge1.set(random.nextDouble(0.625, 0.875))
        return this
    }
}

declare interface MonoNoiseData {
    seed: number
    resolution: number
    roughness: number
    strength: number
}

export class MonoNoiseInjective extends Injective<MonoNoiseData> {
    // http://gamedev.stackexchange.com/questions/26391/is-there-a-family-of-monotonically-non-decreasing-noise-functions/26424#26424
    static monotoneRandom(random: Random, n: number, roughness: number, strength: number): Float32Array {
        const sequence = new Float32Array(n + 1)
        let sum = 0.0
        for (let i = 1; i <= n; ++i) {
            const x = Math.floor(random.nextDouble(0.0, roughness)) + 1.0
            sum += x
            sequence[i] = x
        }
        let nominator = 0.0
        for (let i = 1; i <= n; ++i) {
            nominator += sequence[i]
            sequence[i] = (nominator / sum) * strength + (1.0 - strength) * i / n
        }
        return sequence
    }

    readonly seed = this.bindValue(new ObservableValueImpl<number>(0xFFFFFF))
    readonly resolution = this.bindValue(new BoundNumericValue(new LinearInteger(0, 1024), 512))
    readonly roughness = this.bindValue(new BoundNumericValue(new Linear(0.0, 8.0), 4.0))
    readonly strength = this.bindValue(new BoundNumericValue(new Linear(0.0, 8.0), 0.2))

    private values: Float32Array = new Float32Array([0.0, 1.0])

    constructor() {
        super()

        this.terminator.with(this.seed.addObserver(() => this.update(), false))
        this.terminator.with(this.resolution.addObserver(() => this.update(), false))
        this.terminator.with(this.roughness.addObserver(() => this.update(), false))
        this.terminator.with(this.strength.addObserver(() => this.update(), false))
        this.update()
    }

    fx(y: number): number {
        if (y <= 0.0) return 0.0
        if (y >= 1.0) return 1.0
        const index = binarySearch(this.values, y)
        const a = this.values[index]
        const b = this.values[index + 1]
        const nInverse = 1.0 / this.resolution.get()
        return index * nInverse + nInverse / (b - a) * (y - a)
    }

    fy(x: number): number {
        if (x <= 0.0) return 0.0
        if (x >= 1.0) return 1.0
        const xd = x * this.resolution.get()
        const xi = xd | 0
        const a = xd - xi
        const q = this.values[xi]
        return q + a * (this.values[xi + 1] - q)
    }

    deserialize(format: InjectiveFormat<MonoNoiseData>): MonoNoiseInjective {
        const data = super.unpack(format)
        this.seed.set(data.seed)
        this.resolution.set(data.resolution)
        this.roughness.set(data.roughness)
        this.strength.set(data.strength)
        return this
    }

    serialize(): InjectiveFormat<MonoNoiseData> {
        return super.pack({
            seed: this.seed.get(),
            resolution: this.resolution.get(),
            roughness: this.roughness.get(),
            strength: this.strength.get()
        })
    }

    copy(): MonoNoiseInjective {
        const injective = new MonoNoiseInjective()
        injective.seed.set(this.seed.get())
        injective.resolution.set(this.resolution.get())
        injective.roughness.set(this.roughness.get())
        injective.strength.set(this.strength.get())
        return injective
    }

    randomize(random: Random): MonoNoiseInjective {
        this.seed.set(random.nextInt(0, 0xFFFFFFFF))
        return this
    }

    private update(): void {
        this.values = MonoNoiseInjective.monotoneRandom(new Mulberry32(this.seed.get()), this.resolution.get(), this.roughness.get(), this.strength.get())
    }
}

InjectiveTypes.push(IdentityInjective)
InjectiveTypes.push(PowInjective)
InjectiveTypes.push(CShapeInjective)
InjectiveTypes.push(TShapeInjective)
InjectiveTypes.push(SmoothStepInjective)
InjectiveTypes.push(MonoNoiseInjective)