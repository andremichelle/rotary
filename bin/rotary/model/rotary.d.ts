import { CompositeSettings, CompositeSettingsFormat } from "../../audio/composite.js";
import { BoundNumericValue, Observable, ObservableCollection, ObservableValue, Observer, Serializer, Terminable } from "../../lib/common.js";
import { RenderConfiguration } from "../render.js";
import { Random } from "../../lib/math.js";
import { RotaryTrackFormat, RotaryTrackModel } from "./track.js";
export declare interface RotaryExportFormat {
    fps: number;
    subFrames: number;
    size: number;
}
export declare interface RotaryFormat {
    radiusMin: number;
    phaseOffset: number;
    bpm: number;
    stretch: number;
    exportSettings: RotaryExportFormat;
    tracks: RotaryTrackFormat[];
    seed: number;
    aux: CompositeSettingsFormat<any>[];
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
    readonly radiusMin: ObservableValue<number>;
    readonly phaseOffset: ObservableValue<number>;
    readonly inactiveAlpha: ObservableValue<number>;
    readonly bpm: ObservableValue<number>;
    readonly master_gain: ObservableValue<number>;
    readonly limiter_threshold: ObservableValue<number>;
    readonly stretch: ObservableValue<number>;
    readonly motion: ObservableValue<number>;
    readonly seed: ObservableValue<number>;
    readonly aux: ObservableValue<CompositeSettings<any>>[];
    constructor();
    addObserver(observer: Observer<RotaryModel>, notify: boolean): Terminable;
    removeObserver(observer: Observer<RotaryModel>): boolean;
    randomize(random: Random): RotaryModel;
    randomizeTracks(random: Random): RotaryModel;
    randomizePalette(random: Random): RotaryModel;
    test(): RotaryModel;
    createTrack(index?: number): RotaryTrackModel | null;
    copyTrack(source: RotaryTrackModel, insertIndex?: number): RotaryTrackModel;
    removeTrack(track: RotaryTrackModel): boolean;
    duration(): number;
    clear(): void;
    measureRadius(): number;
    intersects(phase: number): boolean;
    terminate(): void;
    serialize(): RotaryFormat;
    deserialize(format: RotaryFormat): RotaryModel;
    private bindValue;
}
