import { Iterator, Observable, ObservableCollection, ObservableValue, Observer, Serializer, Terminable } from "../lib/common.js";
import { Random } from "../lib/math.js";
import { Injective, InjectiveFormat } from "../lib/injective.js";
export declare interface RotaryFormat {
    radiusMin: number;
    exportSize: number;
    phaseOffset: number;
    loopDuration: number;
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
    motion: InjectiveFormat<any>;
    phaseOffset: number;
    bend: InjectiveFormat<any>;
    fragments: number;
    frequency: number;
    reverse: boolean;
}
export declare class RotaryModel implements Observable<RotaryModel>, Serializer<RotaryFormat>, Terminable {
    static MAX_TRACKS: number;
    private readonly terminator;
    private readonly observable;
    readonly tracks: ObservableCollection<RotaryTrackModel>;
    readonly radiusMin: ObservableValue<any>;
    readonly exportSize: ObservableValue<any>;
    readonly phaseOffset: ObservableValue<any>;
    readonly loopDuration: ObservableValue<any>;
    constructor();
    addObserver(observer: Observer<RotaryModel>): Terminable;
    removeObserver(observer: Observer<RotaryModel>): boolean;
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
    private bindValue;
}
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
    private readonly gradient;
    readonly segments: ObservableValue<any>;
    readonly width: ObservableValue<any>;
    readonly widthPadding: ObservableValue<any>;
    readonly length: ObservableValue<any>;
    readonly lengthRatio: ObservableValue<any>;
    readonly outline: ObservableValue<any>;
    readonly fill: ObservableValue<any>;
    readonly rgb: ObservableValue<any>;
    readonly motion: ObservableValue<Injective<any>>;
    readonly bend: ObservableValue<Injective<any>>;
    readonly phaseOffset: ObservableValue<any>;
    readonly frequency: ObservableValue<any>;
    readonly fragments: ObservableValue<any>;
    readonly reverse: ObservableValue<any>;
    constructor(root: RotaryModel);
    bindValue(property: ObservableValue<any>): ObservableValue<any>;
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
    localToSegment(phase: number): number;
    filterSections(p0: number, p1: number): Iterator<FilterResult>;
    private branchFilterSection;
    private seekSection;
    private updateGradient;
}
