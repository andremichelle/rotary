import { RotaryModel } from "../model.js";
import { ObservableValueImpl } from "../../lib/common.js";
export declare class RotaryWorkletNode extends AudioWorkletNode {
    static build(context: BaseAudioContext): Promise<RotaryWorkletNode>;
    readonly transport: ObservableValueImpl<boolean>;
    private $phase;
    constructor(context: BaseAudioContext);
    phase(): number;
    rewind(): void;
    updateFormat(model: RotaryModel): void;
    uploadSample(key: number, sample: AudioBuffer | Float32Array | Float32Array[], loop?: boolean): void;
}
