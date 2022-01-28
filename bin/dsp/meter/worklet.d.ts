export declare class MeterWorklet extends AudioWorkletNode {
    private width;
    static load(context: AudioContext): Promise<void>;
    private minDb;
    private maxDb;
    private labelStepsDb;
    private maxPeaks;
    private maxSquares;
    private maxPeakHoldValue;
    private releasePeakHoldTime;
    private peakHoldDuration;
    private clipHoldDuration;
    private height;
    private meterPadding;
    private meterWidth;
    private scale;
    private readonly canvas;
    private readonly graphics;
    private readonly gradient;
    private readonly updater;
    constructor(context: AudioContext, width?: number);
    readonly domElement: HTMLElement;
    update(): void;
    renderScale(): void;
    renderMeter(gain: number, y: number, h: number): void;
    dbToX(db: any): number;
    dbToNorm(db: any): number;
}
