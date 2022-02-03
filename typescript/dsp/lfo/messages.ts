export enum Shape { // https://www.desmos.com/calculator/dxhdwn1xiu
    Sine, Triangle, SawtoothUp, SawtoothDown, Random
}

export type Message = SetShape | SetFrequency

export class SetShape {
    readonly type = 'shape'

    constructor(readonly shape: Shape) {
    }
}

export class SetFrequency {
    readonly type = 'frequency'

    constructor(readonly hz: number) {
    }
}