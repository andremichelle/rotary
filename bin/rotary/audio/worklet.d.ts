import { RotaryModel } from "../model/rotary.js";
import { Terminable } from "../../lib/common.js";
import { Transport, TransportListener } from "../../audio/sequencing.js";
export declare class RotaryWorkletNode extends AudioWorkletNode implements TransportListener {
    private readonly model;
    private readonly terminator;
    private version;
    private updatingFormat;
    private $position;
    constructor(context: BaseAudioContext, model: RotaryModel);
    position(): number;
    uploadSample(key: number, sample: Promise<AudioBuffer> | AudioBuffer | Float32Array | Float32Array[], loop?: boolean): void;
    listenToTransport(transport: Transport): Terminable;
    private createUpdateFormatMessage;
    private static createUploadSampleMessage;
}
