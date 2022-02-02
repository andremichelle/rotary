import { BoundNumericValue, Iterator, Observable, ObservableBits, ObservableCollection, ObservableValue, ObservableValueImpl, Observer, Serializer, Terminable } from "../lib/common.js";
import { Random } from "../lib/math.js";
import { RenderConfiguration } from "./render.js";
import { CompositeSettings, CompositeSettingsFormat } from "../dsp/composite.js";
import { Injective, InjectiveFormat } from "../lib/injective.js";
export declare interface RotaryExportFormat {
    fps: number;
    subFrames: number;
    size: number;
}
export declare interface RotaryFormat {
    radiusMin: number;
    phaseOffset: number;
    loopDuration: number;
    exportSettings: RotaryExportFormat;
    tracks: RotaryTrackFormat[];
    aux: CompositeSettingsFormat<any>[];
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
    auxSends: number[];
    mute: boolean;
    solo: boolean;
}
export declare class RotaryExportSetting implements Terminable, Serializer<RotaryExportFormat> {
    private readonly terminator;
    readonly size: BoundNumericValue;
    readonly fps: BoundNumericValue;
    readonly subFrames: BoundNumericValue;
    deserialize(format: RotaryExportFormat): RotaryExportSetting;
    serialize(): RotaryExportFormat;
    getConfiguration(numFrames: number): RenderConfiguration;
    terminate(): void;
}
export declare class RotaryModel implements Observable<RotaryModel>, Serializer<RotaryFormat>, Terminable {
    static MAX_TRACKS: number;
    static NUM_AUX: number;
    private readonly terminator;
    private readonly observable;
    readonly tracks: ObservableCollection<RotaryTrackModel>;
    readonly exportSettings: RotaryExportSetting;
    readonly radiusMin: ObservableValue<any>;
    readonly phaseOffset: ObservableValue<any>;
    readonly loopDuration: ObservableValue<any>;
    readonly motion: ObservableValue<any>;
    readonly aux: ObservableValue<CompositeSettings<any>>[];
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
    intersects(phase: number): boolean;
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
export declare class QueryResult {
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
    readonly auxSends: BoundNumericValue[];
    readonly mute: ObservableValueImpl<boolean>;
    readonly solo: ObservableValueImpl<boolean>;
    constructor(root: RotaryModel);
    observeValue<T extends Observable<any>>(property: T): T;
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
    querySections(p0: number, p1: number): Iterator<QueryResult>;
    private branchQuerySection;
    private seekSection;
    private updateGradient;
}
