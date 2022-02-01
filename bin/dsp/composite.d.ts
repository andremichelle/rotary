import { BoundNumericValue, Serializer, Terminable } from "../lib/common.js";
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
export declare class PulsarDelaySettings implements Serializer<PulsarDelayFormat> {
    readonly preDelayTimeL: BoundNumericValue;
    readonly preDelayTimeR: BoundNumericValue;
    readonly feedbackDelayTime: BoundNumericValue;
    readonly feedbackGain: BoundNumericValue;
    readonly feedbackLowpass: BoundNumericValue;
    readonly feedbackHighpass: BoundNumericValue;
    deserialize(format: PulsarDelayFormat): PulsarDelaySettings;
    serialize(): PulsarDelayFormat;
}
export declare abstract class DefaultIO implements Terminable {
    private incoming;
    private outgoing;
    private input;
    private output;
    protected constructor();
    protected setIO(input: AudioNode, output: AudioNode): void;
    connectToInput(output: AudioNode, outputIndex?: number): void;
    connectToOutput(input: AudioNode, inputIndex?: number): void;
    terminate(): void;
}
export declare class PulsarDelay extends DefaultIO implements Serializer<PulsarDelayFormat>, Terminable {
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
    constructor(context: BaseAudioContext, format?: PulsarDelayFormat);
    watchSettings(settings: PulsarDelaySettings): Terminable;
    setPreDelayTimeL(seconds: number): void;
    getPreDelayTimeL(): number;
    setPreDelayTimeR(seconds: number): void;
    getPreDelayTimeR(): number;
    setFeedbackDelayTime(seconds: number): void;
    getFeedbackDelayTime(): number;
    setFeedbackGain(gain: number): void;
    getFeedbackGain(): number;
    setFeedbackLowpass(frequency: number): void;
    getFeedbackLowpass(): number;
    setFeedbackHighpass(frequency: number): void;
    getFeedbackHighpass(): number;
    deserialize(format: PulsarDelayFormat): PulsarDelay;
    serialize(): PulsarDelayFormat;
    terminate(): void;
    private setParameterValue;
}
export declare class FlangerSettings implements Serializer<FlangerFormat> {
    readonly delayTime: BoundNumericValue;
    readonly feedback: BoundNumericValue;
    readonly rate: BoundNumericValue;
    readonly depth: BoundNumericValue;
    deserialize(format: FlangerFormat): FlangerSettings;
    serialize(): FlangerFormat;
}
export interface FlangerFormat {
    delayTime: number;
    feedback: number;
    rate: number;
    depth: number;
}
export declare class Flanger extends DefaultIO implements Serializer<FlangerFormat>, Terminable {
    private readonly context;
    private readonly delayNode;
    private readonly feedbackGainNode;
    private readonly depthNode;
    private readonly lfoNode;
    constructor(context: BaseAudioContext, format?: FlangerFormat);
    setDelayTime(seconds: number): void;
    getDelayTime(): number;
    setLfoRate(frequency: number): void;
    getLfoRate(): number;
    setFeedback(gain: number): void;
    getFeedback(): number;
    setDepth(value: number): void;
    getDepth(): number;
    deserialize(format: FlangerFormat): Flanger;
    serialize(): FlangerFormat;
    watchSettings(settings: FlangerSettings): Terminable;
    terminate(): void;
    private setParameterValue;
}
