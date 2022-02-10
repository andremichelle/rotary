export interface Voice {
    process(outputs: Float32Array[][]): boolean;
    stop(): any;
}
export declare class VoiceManager {
    private readonly voices;
    constructor();
    add(index: number, voice: Voice): void;
    stopAll(): void;
    stopByIndex(index: number): void;
    process(outputs: Float32Array[][]): void;
}
