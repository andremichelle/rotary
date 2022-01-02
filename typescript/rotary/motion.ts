import {BoundNumericValue, ObservableValueImpl, Serializer, Terminable, Terminator} from "../lib/common"
import {Linear, LinearInteger} from "../lib/mapping"
import {Random, SmoothStep} from "../lib/math"

// TODO LinearMotion

type Data = PowData | CShapeData | SmoothStepData

export declare interface MotionFormat<DATA extends Data> {
    phaseOffset: number
    frequency: number
    reverse: boolean

    class: string
    data: DATA
}

const available: { new(): Motion<any> }[] = []

export abstract class Motion<DATA extends Data> implements Serializer<MotionFormat<DATA>>, Terminable {
    static from(format: MotionFormat<any>): Motion<any> {
        switch (format.class) {
            case PowMotion.name:
                return new PowMotion().deserialize(format)
            case CShapeMotion.name:
                return new CShapeMotion().deserialize(format)
        }
        throw new Error("Unknown movement format")
    }

    static random(random: Random): Motion<any> {
        return new available[Math.floor(random.nextDouble(0.0, available.length))]().randomize(random)
    }

    protected readonly terminator: Terminator = new Terminator()

    readonly phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0))
    readonly frequency = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 16), 1.0))
    readonly reverse = this.terminator.with(new ObservableValueImpl<boolean>(false))

    abstract map(x: number): number

    abstract deserialize(format: MotionFormat<DATA>): Motion<DATA>

    abstract serialize(): MotionFormat<DATA>

    randomize(random: Random): Motion<DATA> {
        this.phaseOffset.set(random.nextDouble(0.0, 1.0))
        this.frequency.set(Math.floor(random.nextDouble(1.0, 4.0)))
        this.reverse.set(random.nextDouble(0.0, 1.0) < 0.5)
        return this
    }

    pack(data: DATA): MotionFormat<DATA> {
        return {
            class: this.constructor.name,
            phaseOffset: this.phaseOffset.get(),
            frequency: this.frequency.get(),
            reverse: this.reverse.get(),
            data: data
        }
    }

    unpack(format: MotionFormat<DATA>): DATA {
        console.assert(this.constructor.name === format.class)
        this.phaseOffset.set(format.phaseOffset)
        this.frequency.set(format.frequency)
        this.reverse.set(format.reverse)
        return format.data
    }

    moveTo(phase: number): number {
        const x = this.phaseOffset.get() + phase * (this.reverse.get() ? -1.0 : 1.0) * this.frequency.get()
        return this.map(x - Math.floor(x))
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

declare interface PowData {
    exponent: number
}

export class PowMotion extends Motion<PowData> {
    readonly exponent = this.terminator.with(new BoundNumericValue(new Linear(-3.0, 3.0), 2.0))

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

    randomize(random: Random): Motion<PowData> {
        super.randomize(random)
        // this.exponent.set(random.nextDouble(-3.0, 3.0))
        return this
    }
}

declare interface CShapeData {
    shape: number
}

export class CShapeMotion extends Motion<CShapeData> {
    readonly shape = this.terminator.with(new BoundNumericValue(new Linear(-2.0, 2.0), 2.0))

    private o: number
    private c: number

    constructor() {
        super()
        this.terminator.with(this.shape.addObserver(() => this.update()))
        this.update()
    }

    map(x: number): number {
        // https://www.desmos.com/calculator/bpbuua3l0j
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5
    }

    serialize(): MotionFormat<CShapeData> {
        return super.pack({shape: this.shape.get()})
    }

    deserialize(format: MotionFormat<CShapeData>): CShapeMotion {
        this.shape.set(super.unpack(format).shape)
        return this
    }

    randomize(random: Random): Motion<CShapeData> {
        super.randomize(random)
        // this.shape.set(random.nextDouble(-2.0, 2.0))
        return this
    }

    private update(): void {
        this.o = Math.pow(2.0, this.shape.get())
        this.c = Math.pow(2.0, this.o - 1)
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
        return SmoothStep.edge(this.edge0.get(), this.edge1.get(), x)
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

    randomize(random: Random): Motion<SmoothStepData> {
        super.randomize(random)
        // this.edge0.set(random.nextDouble(0.0, 0.495))
        // this.edge1.set(random.nextDouble(0.505, 1.0))
        return this
    }
}

available.push(PowMotion)
available.push(CShapeMotion)
available.push(SmoothStepMotion)