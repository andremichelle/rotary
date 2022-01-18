export declare class MeterWorklet extends AudioWorkletNode {
    private height;
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
    private width;
    private meterPadding;
    private meterHeight;
    private scale;
    private readonly canvas;
    private readonly graphics;
    private readonly gradient;
    private readonly updater;
    constructor(context: AudioContext, height?: number);
    readonly domElement: HTMLCanvasElement;
    attachToScreen(): void;
    update(): void;
    renderScale(): void;
    renderMeter(gain: any, x: any, w: any): void;
    dbToY(db: any): number;
    dbToNorm(db: any): number;
}
