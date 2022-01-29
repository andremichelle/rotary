export declare class MeterWorklet extends AudioWorkletNode {
    static load(context: AudioContext): Promise<void>;
    private readonly width;
    private readonly height;
    private readonly meterPadding;
    private readonly meterWidth;
    private minDb;
    private maxDb;
    private labelStepsDb;
    private maxPeaks;
    private maxSquares;
    private maxPeakHoldValue;
    private releasePeakHoldTime;
    private peakHoldDuration;
    private clipHoldDuration;
    private scale;
    private readonly canvas;
    private readonly graphics;
    private readonly gradient;
    private readonly updater;
    constructor(context: AudioContext);
    readonly domElement: HTMLElement;
    update(): void;
    renderScale(): void;
    renderMeter(gain: number, y: number, h: number): void;
    dbToX(db: any): number;
    dbToNorm(db: any): number;
}
