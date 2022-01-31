import { Terminable } from "../lib/common.js";
import { Linear } from "../lib/mapping.js";
export declare class Channelstrip implements Terminable {
    private readonly mixer;
    static GAIN_MAPPING: Linear;
    private readonly inputNode;
    private readonly volumeNode;
    private readonly panningNode;
    private readonly auxSendNodes;
    solo: boolean;
    private volume;
    private mute;
    constructor(mixer: Mixer, numAux?: number);
    input(): AudioNode;
    setInputDecibel(db: number): void;
    getInputDecibel(): number;
    setPanning(bipolar: number): void;
    getPanning(): number;
    setVolume(unipolar: number): void;
    getVolume(): number;
    setMute(value: boolean): void;
    getMute(): boolean;
    setSolo(value: boolean): void;
    getSolo(): boolean;
    setAuxSend(index: number, volume: number): void;
    updateVolume(): void;
    terminate(): void;
    private computeVolume;
}
export declare class Mixer {
    readonly context: BaseAudioContext;
    readonly numAux: number;
    private readonly channelstrips;
    private readonly auxSendNodes;
    private readonly auxReturnNodes;
    readonly outputNode: GainNode;
    constructor(context: BaseAudioContext, numAux?: number);
    createChannelstrip(): Channelstrip;
    removeChannelstrip(channelstrip: Channelstrip): void;
    masterOutput(): AudioNode;
    auxSend(index: number): AudioNode;
    auxReturn(index: number): AudioNode;
    setAuxReturnDecibel(index: number, volume: number): void;
    onChannelstripSoloChanged(): void;
    isAnyChannelSolo(): boolean;
    setParameterValue(audioParam: AudioParam, value: number): void;
}
