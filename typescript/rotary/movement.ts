import {BoundNumericValue, Linear, Serializer, Terminable, Terminator} from "../lib/common";

export interface Movement<FORMAT> extends Serializer<FORMAT>, Terminable {
    map(x: number): number

    readonly name: (() => string)
}

declare interface ExponentialFormat {
    exponent: number
}

export class Exponential implements Movement<ExponentialFormat> {
    private readonly terminator: Terminator = new Terminator()
    readonly exponent = this.terminator.with(new BoundNumericValue(new Linear(-4.0, 4.0), 2.0))

    serialize(): ExponentialFormat {
        return {exponent: this.exponent.get()}
    }

    deserialize(format: ExponentialFormat): void {
        this.exponent.set(format.exponent)
    }

    map(x: number): number {
        return Math.pow(x, this.exponent.get())
    }

    name(): string {
        return this.constructor.name
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

declare interface CShapeFormat {
    shape: number
}

export class CShape implements Movement<CShapeFormat> {
    private readonly terminator: Terminator = new Terminator()
    private readonly shape = this.terminator.with(new BoundNumericValue(new Linear(-2.0, 2.0), 2.0))

    private o: number
    private c: number

    constructor() {
        this.terminator.with(this.shape.addObserver(() => this.update()))
        this.update()
    }

    serialize(): CShapeFormat {
        return {shape: this.shape.get()}
    }

    deserialize(format: CShapeFormat): void {
        this.shape.set(format.shape)
    }

    map(x: number): number {
        // https://www.desmos.com/calculator/bpbuua3l0j
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5
    }

    name(): string {
        return this.constructor.name
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private update(): void {
        this.o = Math.pow(2.0, this.shape.get())
        this.c = Math.pow(2.0, this.o - 1)
    }
}