import {BoundNumericValue, Serializer, Terminable, Terminator} from "../lib/common"
import {Linear} from "../lib/mapping"

export const fromFormat = (format: MovementFormat) => {
    switch (format.class) {
        case Exponential.name: {
            const movement = new Exponential()
            movement.deserialize(format as ExponentialFormat)
            return movement
        }
        case CShape.name: {
            const movement = new CShape()
            movement.deserialize(format as CShapeFormat)
            return movement
        }
    }
    throw new Error("Unknown movement format")
}

export declare interface MovementFormat {
    class: string
}

export interface Movement<FORMAT> extends Serializer<FORMAT>, Terminable {
    map(x: number): number
}

export declare interface ExponentialFormat extends MovementFormat {
    exponent: number
}

export class Exponential implements Movement<ExponentialFormat> {
    private readonly terminator: Terminator = new Terminator()

    readonly exponent = this.terminator.with(new BoundNumericValue(new Linear(-4.0, 4.0), 2.0))

    serialize(): ExponentialFormat {
        return {class: this.constructor.name, exponent: this.exponent.get()}
    }

    deserialize(format: ExponentialFormat): void {
        this.exponent.set(format.exponent)
    }

    map(x: number): number {
        return Math.pow(x, this.exponent.get())
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

export declare interface CShapeFormat extends MovementFormat {
    shape: number
}

export class CShape implements Movement<CShapeFormat> {
    private readonly terminator: Terminator = new Terminator()

    readonly shape = this.terminator.with(new BoundNumericValue(new Linear(-2.0, 2.0), 2.0))

    private o: number
    private c: number

    constructor() {
        this.terminator.with(this.shape.addObserver(() => this.update()))
        this.update()
    }

    serialize(): CShapeFormat {
        return {class: this.constructor.name, shape: this.shape.get()}
    }

    deserialize(format: CShapeFormat): void {
        this.shape.set(format.shape)
    }

    map(x: number): number {
        // https://www.desmos.com/calculator/bpbuua3l0j
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private update(): void {
        this.o = Math.pow(2.0, this.shape.get())
        this.c = Math.pow(2.0, this.o - 1)
    }
}