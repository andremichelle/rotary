import { BoundNumericValue, Iterator, Observable, ObservableCollection, ObservableValue, Observer, Serializer, Terminable } from "../lib/common.js";
import { Random } from "../lib/math.js";
import { MotionFormat, MotionType } from "./motion.js";
export declare interface RotaryFormat {
    radiusMin: number;
    tracks: RotaryTrackFormat[];
}
export declare interface RotaryTrackFormat {
    segments: number;
    width: number;
    widthPadding: number;
    length: number;
    lengthRatio: number;
    outline: number;
    fill: number;
    rgb: number;
    motion: MotionFormat<any>;
    phaseOffset: number;
    bend: number;
    frequency: number;
    reverse: boolean;
}
export declare class RotaryModel implements Serializer<RotaryFormat>, Terminable {
    static MAX_TRACKS: number;
    private readonly terminator;
    readonly tracks: ObservableCollection<RotaryTrackModel>;
    readonly radiusMin: BoundNumericValue;
    readonly exportSize: BoundNumericValue;
    readonly phaseOffset: BoundNumericValue;
    readonly loopDuration: BoundNumericValue;
    constructor();
    randomize(random: Random): RotaryModel;
    randomizeTracks(random: Random): RotaryModel;
    randomizePalette(random: Random): RotaryModel;
    test(): RotaryModel;
    createTrack(index?: number): RotaryTrackModel | null;
    copyTrack(source: RotaryTrackModel, insertIndex?: number): RotaryTrackModel;
    removeTrack(track: RotaryTrackModel): boolean;
    clear(): void;
    measureRadius(): number;
    terminate(): void;
    serialize(): RotaryFormat;
    deserialize(format: RotaryFormat): RotaryModel;
}
export declare enum Fill {
    Flat = 0,
    Stroke = 1,
    Line = 2,
    Positive = 3,
    Negative = 4
}
export declare const MotionTypes: Map<string, MotionType>;
export declare const Fills: Map<string, Fill>;
export declare enum Edge {
    Min = 0,
    Max = 1
}
export declare class FilterResult {
    readonly edge: Edge;
    readonly index: number;
    readonly position: number;
    constructor(edge: Edge, index: number, position: number);
}
export declare class RotaryTrackModel implements Observable<RotaryTrackModel>, Serializer<RotaryTrackFormat>, Terminable {
    readonly root: RotaryModel;
    private readonly terminator;
    private readonly observable;
    readonly segments: ObservableValue<any>;
    readonly width: ObservableValue<any>;
    readonly widthPadding: ObservableValue<any>;
    readonly length: ObservableValue<any>;
    readonly lengthRatio: ObservableValue<any>;
    readonly outline: ObservableValue<any>;
    readonly fill: ObservableValue<any>;
    readonly rgb: ObservableValue<any>;
    readonly motion: ObservableValue<any>;
    readonly phaseOffset: ObservableValue<any>;
    readonly bend: ObservableValue<any>;
    readonly frequency: ObservableValue<any>;
    readonly reverse: ObservableValue<any>;
    private readonly gradient;
    private readonly motionTerminator;
    constructor(root: RotaryModel);
    bindValue(property: ObservableValue<any>): ObservableValue<any>;
    addObserver(observer: Observer<RotaryTrackModel>): Terminable;
    removeObserver(observer: Observer<RotaryTrackModel>): boolean;
    ratio(phase: number): number;
    index(phase: number): number;
    test(): void;
    opaque(): string;
    transparent(): string;
    randomize(random: Random): RotaryTrackModel;
    terminate(): void;
    serialize(): RotaryTrackFormat;
    deserialize(format: RotaryTrackFormat): RotaryTrackModel;
    translatePhase(x: number): number;
    filterSections(p0: number, p1: number, offset: number): Iterator<FilterResult>;
    private branchFilterSection;
    private seekSection;
    private updateGradient;
}
