import {BoundNumericValue, ObservableValueImpl, Serializer, Terminable, Terminator} from "../lib/common"
import {Linear, LinearInteger} from "../lib/mapping"

type Data = ExponentialData | CShapeData

export declare interface MotionFormat<DATA extends Data> {
    phaseOffset: number
    frequency: number
    reverse: boolean

    class: string
    data: DATA
}

export abstract class Motion<DATA extends Data> implements Serializer<MotionFormat<DATA>>, Terminable {
    static from(format: MotionFormat<any>) {
        switch (format.class) {
            case ExponentialMotion.name:
                return new ExponentialMotion().deserialize(format)
            case CShapeMotion.name:
                return new CShapeMotion().deserialize(format)
        }
        throw new Error("Unknown movement format")
    }

    protected readonly terminator: Terminator = new Terminator()

    readonly phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0))
    readonly frequency = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 16), 1.0))
    readonly reverse = this.terminator.with(new ObservableValueImpl<boolean>(false))

    abstract map(x: number): number

    abstract deserialize(format: MotionFormat<DATA>): Motion<DATA>

    abstract serialize(): MotionFormat<DATA>

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

export declare interface ExponentialData {
    exponent: number
}

export class ExponentialMotion extends Motion<ExponentialData> {
    readonly exponent = this.terminator.with(new BoundNumericValue(new Linear(-4.0, 4.0), 2.0))

    serialize(): MotionFormat<ExponentialData> {
        return super.pack({exponent: this.exponent.get()})
    }

    deserialize(format: MotionFormat<ExponentialData>): ExponentialMotion {
        this.exponent.set(super.unpack(format).exponent)
        return this
    }

    map(x: number): number {
        return Math.pow(x, this.exponent.get())
    }
}

export declare interface CShapeData {
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

    serialize(): MotionFormat<CShapeData> {
        return super.pack({shape: this.shape.get()})
    }

    deserialize(format: MotionFormat<CShapeData>): CShapeMotion {
        this.shape.set(super.unpack(format).shape)
        return this
    }

    map(x: number): number {
        // https://www.desmos.com/calculator/bpbuua3l0j
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5
    }

    private update(): void {
        this.o = Math.pow(2.0, this.shape.get())
        this.c = Math.pow(2.0, this.o - 1)
    }
}