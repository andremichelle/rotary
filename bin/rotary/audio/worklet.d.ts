import { RotaryModel } from "../model.js";
import { ObservableValueImpl } from "../../lib/common.js";
export declare class RotaryWorkletNode extends AudioWorkletNode {
    private readonly terminator;
    readonly transport: ObservableValueImpl<boolean>;
    private version;
    private updatingFormat;
    private $phase;
    constructor(context: BaseAudioContext, model: RotaryModel);
    phase(): number;
    rewind(): void;
    uploadSample(key: number, sample: Promise<AudioBuffer> | AudioBuffer | Float32Array | Float32Array[], loop?: boolean): void;
}
