import { Transport, TransportListener } from "../sequencing.js";
import { ObservableValueImpl, Terminable } from "../../lib/common.js";
export declare class Metronome extends AudioWorkletNode implements TransportListener {
    readonly enabled: ObservableValueImpl<boolean>;
    constructor(context: BaseAudioContext);
    setBpm(value: number): void;
    listenToTransport(transport: Transport): Terminable;
}
