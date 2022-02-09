import { RotaryModel } from "../model.js";
import { Terminable } from "../../lib/common.js";
import { Transport, TransportListener } from "../../audio/sequencing.js";
export declare class RotaryWorkletNode extends AudioWorkletNode implements TransportListener {
    private readonly terminator;
    private version;
    private updatingFormat;
    private $phase;
    constructor(context: BaseAudioContext, model: RotaryModel);
    phase(): number;
    uploadSample(key: number, sample: Promise<AudioBuffer> | AudioBuffer | Float32Array | Float32Array[], loop?: boolean): void;
    listenToTransport(transport: Transport): Terminable;
}
