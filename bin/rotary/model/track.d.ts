import { Injective, InjectiveFormat } from "../../lib/injective.js";
import { BoundNumericValue, Iterator, Observable, ObservableBits, ObservableValue, ObservableValueImpl, Observer, Serializer, Terminable } from "../../lib/common.js";
import { Random } from "../../lib/math.js";
import { RotaryModel } from "./rotary.js";
export declare enum Fill {
    Flat = 0,
    Stroke = 1,
    Line = 2,
    Gradient = 3
}
export declare const Fills: Map<string, Fill>;
export declare enum Edge {
    Start = 0,
    End = 1
}
export declare class QueryResult {
    readonly edge: Edge;
    readonly index: number;
    readonly position: number;
    constructor(edge: Edge, index: number, position: number);
}
export declare interface RotaryTrackFormat {
    segments: number;
    exclude: number[];
    width: number;
    widthPadding: number;
    length: number;
    lengthRatio: number;
    outline: number;
    fill: number;
    rgb: number;
    motion: InjectiveFormat<any>;
    phaseOffset: number;
    bend: InjectiveFormat<any>;
    fragments: number;
    frequency: number;
    reverse: boolean;
    gain: number;
    volume: number;
    panning: number;
    aux: number[];
    mute: boolean;
    solo: boolean;
}
export declare class RotaryTrackModel implements Observable<RotaryTrackModel>, Serializer<RotaryTrackFormat>, Terminable {
    readonly root: RotaryModel;
    private readonly terminator;
    private readonly observable;
    private readonly gradient;
    readonly segments: BoundNumericValue;
    readonly exclude: ObservableBits;
    readonly width: BoundNumericValue;
    readonly widthPadding: BoundNumericValue;
    readonly length: BoundNumericValue;
    readonly lengthRatio: BoundNumericValue;
    readonly outline: BoundNumericValue;
    readonly fill: ObservableValueImpl<Fill>;
    readonly rgb: ObservableValueImpl<number>;
    readonly motion: ObservableValue<Injective<any>>;
    readonly bend: ObservableValue<Injective<any>>;
    readonly phaseOffset: BoundNumericValue;
    readonly frequency: BoundNumericValue;
    readonly fragments: BoundNumericValue;
    readonly reverse: ObservableValueImpl<boolean>;
    readonly gain: BoundNumericValue;
    readonly volume: BoundNumericValue;
    readonly panning: BoundNumericValue;
    readonly aux: BoundNumericValue[];
    readonly mute: ObservableValueImpl<boolean>;
    readonly solo: ObservableValueImpl<boolean>;
    constructor(root: RotaryModel);
    addObserver(observer: Observer<RotaryTrackModel>): Terminable;
    removeObserver(observer: Observer<RotaryTrackModel>): boolean;
    test(): void;
    opaque(): string;
    transparent(): string;
    randomize(random: Random): RotaryTrackModel;
    terminate(): void;
    serialize(): RotaryTrackFormat;
    deserialize(format: RotaryTrackFormat): RotaryTrackModel;
    globalToLocal(x: number): number;
    localToGlobal(y: number): number;
    globalToSegment(x: number): number;
    localToSegment(x: number): number;
    querySections(p0: number, p1: number): Iterator<QueryResult>;
    private branchQuerySection;
    private seekSection;
    private bindValue;
    private updateGradient;
}