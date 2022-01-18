import { BoundNumericValue, Observable, ObservableCollection, ObservableValueImpl, Observer, Serializer, Terminable } from "../lib/common.js";
import { Random } from "../lib/math.js";
import { Motion, MotionFormat, MotionType } from "./motion.js";
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
export declare class RotaryTrackModel implements Observable<RotaryTrackModel>, Serializer<RotaryTrackFormat>, Terminable {
    readonly root: RotaryModel;
    private readonly terminator;
    readonly segments: BoundNumericValue;
    readonly width: BoundNumericValue;
    readonly widthPadding: BoundNumericValue;
    readonly length: BoundNumericValue;
    readonly lengthRatio: BoundNumericValue;
    readonly outline: BoundNumericValue;
    readonly fill: ObservableValueImpl<Fill>;
    readonly rgb: ObservableValueImpl<number>;
    readonly motion: ObservableValueImpl<Motion<any>>;
    readonly phaseOffset: BoundNumericValue;
    readonly bend: BoundNumericValue;
    readonly frequency: BoundNumericValue;
    readonly reverse: ObservableValueImpl<boolean>;
    private readonly gradient;
    private readonly observers;
    constructor(root: RotaryModel);
    addObserver(observer: Observer<RotaryTrackModel>): Terminable;
    removeObserver(observer: Observer<RotaryTrackModel>): boolean;
    map(phase: number): number;
    ratio(phase: number): number;
    index(phase: number): number;
    test(): void;
    opaque(): string;
    transparent(): string;
    randomize(random: Random): RotaryTrackModel;
    terminate(): void;
    serialize(): RotaryTrackFormat;
    deserialize(format: RotaryTrackFormat): RotaryTrackModel;
    private updateGradient;
}
