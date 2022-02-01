import { Terminable } from "../lib/common.js";
import { Linear } from "../lib/mapping.js";
export declare const interpolateParameterValueIfRunning: (context: BaseAudioContext, audioParam: AudioParam, value: number) => void;
export declare class Channelstrip implements Terminable {
    private readonly mixer;
    static GAIN_MAPPING: Linear;
    private readonly inputNode;
    private readonly volumeNode;
    private readonly panningNode;
    private readonly auxSendNodes;
    private connected;
    solo: boolean;
    private volume;
    private mute;
    constructor(mixer: Mixer, numAux?: number);
    connectToInput(output: AudioNode, outputIndex: number): void;
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
export interface PulsarDelayFormat {
    preDelayTimeL: number;
    preDelayTimeR: number;
    feedbackDelayTime: number;
    feedbackGain: number;
    feedbackLowpass: number;
    feedbackHighpass: number;
}
export declare class PulsarDelay implements Terminable {
    private readonly context;
    private readonly preSplitter;
    private readonly preDelayL;
    private readonly preDelayR;
    private readonly feedbackMerger;
    private readonly feedbackLowpass;
    private readonly feedbackHighpass;
    private readonly feedbackDelay;
    private readonly feedbackGain;
    private readonly feedbackSplitter;
    private incoming;
    private outgoing;
    constructor(context: BaseAudioContext, format?: PulsarDelayFormat);
    connectToInput(output: AudioNode, outputIndex?: number): void;
    connectToOutput(input: AudioNode, inputIndex?: number): void;
    setPreDelayTimeL(seconds: number): void;
    setPreDelayTimeR(seconds: number): void;
    setFeedbackDelayTime(seconds: number): void;
    setFeedbackGain(gain: number): void;
    setFeedbackLowpass(frequency: number): void;
    setFeedbackHighpass(frequency: number): void;
    terminate(): void;
    private setParameterValue;
}
