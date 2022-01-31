import { BoundNumericValue, ObservableValueImpl } from "../lib/common.js";
import { Linear } from "../lib/mapping.js";
export declare class ChannelstripModel {
    readonly gain: BoundNumericValue;
    readonly volume: BoundNumericValue;
    readonly panning: BoundNumericValue;
    readonly auxSends: BoundNumericValue[];
    readonly mute: ObservableValueImpl<boolean>;
    readonly solo: ObservableValueImpl<boolean>;
    constructor(numAux: number);
}
export declare class Channelstrip {
    readonly mixer: Mixer;
    readonly model: ChannelstripModel;
    static GAIN_MAPPING: Linear;
    private readonly terminator;
    private readonly inputNode;
    private readonly volumeNode;
    private readonly auxSendNode;
    private readonly panningNode;
    constructor(mixer: Mixer, model: ChannelstripModel);
    init(): void;
    input(): AudioNode;
    updateVolume(): void;
    computeVolume: () => number;
}
export declare class MixerModel {
    readonly numChannels: number;
    readonly numAux: number;
    readonly volume: BoundNumericValue;
    readonly channels: ChannelstripModel[];
    constructor(numChannels: number, numAux: number);
}
export declare class Mixer {
    readonly context: BaseAudioContext;
    readonly model: MixerModel;
    readonly channelstrips: Channelstrip[];
    readonly outputNode: GainNode;
    readonly auxSendNodes: GainNode[];
    readonly auxReturnNodes: GainNode[];
    constructor(context: BaseAudioContext, model: MixerModel);
    masterOutput(): AudioNode;
    auxSend(index: number): AudioNode;
    auxReturn(index: number): AudioNode;
    onChannelstripSoloChanged(): void;
    isAnyChannelSolo(): boolean;
}
