export enum Shape { // https://www.desmos.com/calculator/dxhdwn1xiu
    Sine, Triangle, SawtoothUp, SawtoothDown, Random
}

export type Message = { type: "set-shape", shape: Shape } | { type: "set-frequency", hz: number }