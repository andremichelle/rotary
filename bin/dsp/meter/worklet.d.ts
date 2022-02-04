export declare class NoUIMeterWorklet extends AudioWorkletNode {
    readonly passCount: number;
    readonly channelCount: number;
    static readonly PEAK_HOLD_DURATION: number;
    static readonly CLIP_HOLD_DURATION: number;
    protected readonly maxPeaks: Float32Array[];
    protected readonly maxSquares: Float32Array[];
    protected readonly maxPeakHoldValue: Float32Array[];
    protected readonly releasePeakHoldTime: Float32Array[];
    constructor(context: BaseAudioContext, passCount: number, channelCount: number);
}
export declare class StereoMeterWorklet extends NoUIMeterWorklet {
    private readonly meterHPadding;
    private readonly meterSegmentWidth;
    private readonly meterSegmentHeight;
    private readonly meterSegmentHGap;
    private readonly meterSegmentVGap;
    private readonly meterSegmentCount;
    private readonly meterWidth;
    private readonly width;
    private readonly height;
    private readonly labelStepsDb;
    private readonly maxDb;
    private readonly minDb;
    private readonly canvas;
    private readonly graphics;
    private readonly gradient;
    private readonly updater;
    private scale;
    constructor(context: AudioContext);
    readonly domElement: HTMLElement;
    update(): void;
    renderScale(): void;
    renderMeter(gain: number, y: number, h: number): void;
    dbToX(db: number): number;
    dbToIndex(db: number): number;
    dbToNorm(db: number): number;
}
