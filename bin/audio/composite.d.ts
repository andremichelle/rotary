import { NoArgType, Observable, ObservableImpl, ObservableValue, Observer, Serializer, Terminable, Terminator } from "../lib/common.js";
import { UIControllerLayout } from "../dom/controls.js";
declare type Data = PulsarDelayData | ConvolverData | FlangerData;
export interface CompositeSettingsFormat<DATA extends Data> {
    class: string;
    data: DATA;
}
export declare abstract class CompositeSettings<DATA extends Data> implements Observable<CompositeSettings<DATA>>, Serializer<CompositeSettingsFormat<DATA>>, Terminable {
    static from(format: CompositeSettingsFormat<any>): CompositeSettings<any>;
    protected readonly terminator: Terminator;
    protected readonly observable: ObservableImpl<CompositeSettings<DATA>>;
    abstract deserialize(format: CompositeSettingsFormat<DATA>): CompositeSettings<DATA>;
    abstract serialize(): CompositeSettingsFormat<DATA>;
    protected pack(data?: DATA): CompositeSettingsFormat<DATA>;
    protected unpack(format: CompositeSettingsFormat<DATA>): DATA;
    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T>;
    addObserver(observer: Observer<CompositeSettings<DATA>>): Terminable;
    removeObserver(observer: Observer<CompositeSettings<DATA>>): boolean;
    terminate(): void;
}
export declare abstract class DefaultComposite<SETTINGS extends CompositeSettings<Data>> implements Terminable {
    private incoming;
    private outgoing;
    private input;
    private output;
    protected constructor();
    protected setInputOutput(input: AudioNode, output: AudioNode): void;
    abstract watchSettings(settings: SETTINGS): Terminable;
    connectToInput(output: AudioNode, outputIndex?: number): void;
    connectToOutput(input: AudioNode, inputIndex?: number): void;
    terminate(): void;
}
export declare const ConvolverFiles: Map<string, string>;
export interface ConvolverData {
    url: string;
}
export declare class ConvolverSettings extends CompositeSettings<ConvolverData> {
    readonly url: ObservableValue<string>;
    deserialize(format: CompositeSettingsFormat<ConvolverData>): ConvolverSettings;
    serialize(): CompositeSettingsFormat<ConvolverData>;
}
export declare class Convolver extends DefaultComposite<ConvolverSettings> {
    private readonly context;
    private readonly convolverNode;
    private ready;
    private url;
    constructor(context: BaseAudioContext, format?: ConvolverData);
    watchSettings(settings: ConvolverSettings): Terminable;
    setURL(url: string): Promise<void>;
    getURL(): string;
    isReady(): boolean;
    deserialize(data: ConvolverData): Convolver;
    serialize(): ConvolverData;
}
export declare interface PulsarDelayData {
    preDelayTimeL: number;
    preDelayTimeR: number;
    feedbackDelayTime: number;
    feedbackGain: number;
    feedbackLowpass: number;
    feedbackHighpass: number;
}
export declare class PulsarDelaySettings extends CompositeSettings<PulsarDelayData> {
    readonly preDelayTimeL: ObservableValue<number>;
    readonly preDelayTimeR: ObservableValue<number>;
    readonly feedbackDelayTime: ObservableValue<number>;
    readonly feedbackGain: ObservableValue<number>;
    readonly feedbackLowpass: ObservableValue<number>;
    readonly feedbackHighpass: ObservableValue<number>;
    serialize(): CompositeSettingsFormat<PulsarDelayData>;
    deserialize(format: CompositeSettingsFormat<PulsarDelayData>): PulsarDelaySettings;
}
export declare class PulsarDelay extends DefaultComposite<PulsarDelaySettings> {
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
    constructor(context: BaseAudioContext, format?: PulsarDelayData);
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
    deserialize(format: PulsarDelayData): PulsarDelay;
    serialize(): PulsarDelayData;
    terminate(): void;
    private setParameterValue;
}
export interface FlangerData {
    delayTime: number;
    feedback: number;
    rate: number;
    depth: number;
}
export declare class FlangerSettings extends CompositeSettings<FlangerData> {
    readonly delayTime: ObservableValue<number>;
    readonly feedback: ObservableValue<number>;
    readonly rate: ObservableValue<number>;
    readonly depth: ObservableValue<number>;
    deserialize(format: CompositeSettingsFormat<FlangerData>): FlangerSettings;
    serialize(): CompositeSettingsFormat<FlangerData>;
}
export declare class Flanger extends DefaultComposite<FlangerSettings> {
    private readonly context;
    private readonly delayNode;
    private readonly feedbackGainNode;
    private readonly depthNode;
    private readonly lfoNode;
    constructor(context: BaseAudioContext, format?: FlangerData);
    watchSettings(settings: FlangerSettings): Terminable;
    setDelayTime(seconds: number): void;
    getDelayTime(): number;
    setLfoRate(frequency: number): void;
    getLfoRate(): number;
    setFeedback(gain: number): void;
    getFeedback(): number;
    setDepth(value: number): void;
    getDepth(): number;
    deserialize(format: FlangerData): Flanger;
    serialize(): FlangerData;
    terminate(): void;
    private setParameterValue;
}
export declare const CompositeSettingsUIBuilder: {
    availableTypes: Map<string, NoArgType<CompositeSettings<any>>>;
    build(layout: UIControllerLayout, settings: CompositeSettings<any>): void;
};
export {};
