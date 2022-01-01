import {BoundNumericValue, ObservableValueImpl, Serializer, Terminable, Terminator} from "../lib/common"
import {Linear, LinearInteger} from "../lib/mapping"

type Data = ExponentialData | CShapeData

export const fromFormat = (format: MovementFormat<any>) => {
    switch (format.class) {
        case Exponential.name:
            return new Exponential().deserialize(format)
        case CShape.name:
            return new CShape().deserialize(format)
    }
    throw new Error("Unknown movement format")
}

export declare interface MovementFormat<DATA extends Data> {
    phaseOffset: number
    frequency: number
    reverse: boolean

    class: string
    data: DATA
}

export abstract class Movement<DATA extends Data> implements Serializer<MovementFormat<DATA>>, Terminable {
    protected readonly terminator: Terminator = new Terminator()

    readonly phaseOffset = this.terminator.with(new BoundNumericValue(Linear.Identity, 0.0))
    readonly frequency = this.terminator.with(new BoundNumericValue(new LinearInteger(1, 16), 1.0))
    readonly reverse = this.terminator.with(new ObservableValueImpl<boolean>(false))

    abstract map(x: number): number

    abstract deserialize(format: MovementFormat<DATA>): Movement<DATA>

    abstract serialize(): MovementFormat<DATA>

    pack(data: DATA): MovementFormat<DATA> {
        return {
            class: this.constructor.name,
            phaseOffset: this.phaseOffset.get(),
            frequency: this.frequency.get(),
            reverse: this.reverse.get(),
            data: data
        }
    }

    unpack(format: MovementFormat<DATA>): DATA {
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

export class Exponential extends Movement<ExponentialData> {
    readonly exponent = this.terminator.with(new BoundNumericValue(new Linear(-4.0, 4.0), 2.0))

    serialize(): MovementFormat<ExponentialData> {
        return super.pack({exponent: this.exponent.get()})
    }

    deserialize(format: MovementFormat<ExponentialData>): Exponential {
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

export class CShape extends Movement<CShapeData> {
    readonly shape = this.terminator.with(new BoundNumericValue(new Linear(-2.0, 2.0), 2.0))

    private o: number
    private c: number

    constructor() {
        super()
        this.terminator.with(this.shape.addObserver(() => this.update()))
        this.update()
    }

    serialize(): MovementFormat<CShapeData> {
        return super.pack({shape: this.shape.get()})
    }

    deserialize(format: MovementFormat<CShapeData>): CShape {
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