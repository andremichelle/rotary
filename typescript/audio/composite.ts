// noinspection JSUnusedGlobalSymbols

import {
    BoundNumericValue,
    NoArgType,
    NumericStepper,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    PrintMapping,
    readAudio,
    Settings,
    Terminable,
    Terminator
} from "../lib/common.js"
import {Exp, Linear} from "../lib/mapping.js"
import {ControlBuilder, UIControllerLayout} from "../dom/controls.js"
import {interpolateParameterValueIfRunning} from "./common.js"

type CompositeSettingsData = PulsarDelayData | ConvolverData | FlangerData

export interface CompositeSettingsFormat<DATA extends CompositeSettingsData> {
    class: string
    data: DATA
}

export abstract class CompositeSettings<DATA extends CompositeSettingsData> extends Settings<DATA> {
    static from(format: CompositeSettingsFormat<any>): CompositeSettings<any> {
        switch (format.class) {
            case PulsarDelaySettings.name:
                return new PulsarDelaySettings().deserialize(format)
            case ConvolverSettings.name:
                return new ConvolverSettings().deserialize(format)
            case FlangerSettings.name:
                return new FlangerSettings().deserialize(format)
        }
        throw new Error("Unknown movement format")
    }
}

export abstract class DefaultComposite<SETTINGS extends CompositeSettings<CompositeSettingsData>> implements Terminable {
    private incoming: Option<[AudioNode, number]> = Options.None
    private outgoing: Option<[AudioNode, number]> = Options.None

    private input: AudioNode = null
    private output: AudioNode = null

    protected constructor() {
    }

    protected setInputOutput(input: AudioNode, output: AudioNode): void {
        this.input = input
        this.output = output
    }

    public abstract watchSettings(settings: SETTINGS): Terminable

    public connectToInput(output: AudioNode, outputIndex: number = 0 | 0): void {
        console.assert(null !== this.input && this.incoming.isEmpty())
        output.connect(this.input, outputIndex, 0)
        this.incoming = Options.valueOf([output, outputIndex])
    }

    public connectToOutput(input: AudioNode, inputIndex: number = 0 | 0): void {
        console.assert(null !== this.output && this.outgoing.isEmpty())
        this.output.connect(input, 0, inputIndex)
        this.outgoing = Options.valueOf([input, inputIndex])
    }

    terminate(): void {
        this.incoming.ifPresent(pair => pair[0].disconnect(this.input, pair[1], 0))
        this.outgoing.ifPresent(pair => this.output.disconnect(pair[0], 0, pair[1]))
        this.incoming = Options.None
        this.outgoing = Options.None
    }
}

export const ConvolverFiles = new Map<string, string>([
    ["None", null],
    ["Church", "impulse/Church.ogg"],
    ["Deep Space", "impulse/DeepSpace.ogg"],
    ["Hangar", "impulse/Hangar.ogg"],
    ["Large Echo Hall", "impulse/LargeWideEchoHall.ogg"],
    ["Plate Small", "impulse/PlateSmall.ogg"],
    ["Plate Medium", "impulse/PlateMedium.ogg"],
    ["Plate Large", "impulse/PlateLarge.ogg"],
    ["Prime Long", "impulse/PrimeLong.ogg"],
])

export interface ConvolverData {
    url: string
}

export class ConvolverSettings extends CompositeSettings<ConvolverData> {
    readonly url: ObservableValue<string> = this.bindValue(new ObservableValueImpl<string>(null))

    deserialize(format: CompositeSettingsFormat<ConvolverData>): ConvolverSettings {
        this.url.set(super.unpack(format).url)
        return this
    }

    serialize(): CompositeSettingsFormat<ConvolverData> {
        return super.pack({url: this.url.get()})
    }
}

export class Convolver extends DefaultComposite<ConvolverSettings> {
    private readonly convolverNode: ConvolverNode
    private ready: boolean = false
    private url: string = null

    constructor(private readonly context: BaseAudioContext, format?: ConvolverData) {
        super()
        this.convolverNode = context.createConvolver()
        this.setInputOutput(this.convolverNode, this.convolverNode)
        if (undefined !== format) {
            this.deserialize(format)
        }
    }

    watchSettings(settings: ConvolverSettings): Terminable {
        return settings.url.addObserver(url => this.setURL(url), true)
    }

    async setURL(url: string): Promise<void> {
        try {
            this.ready = false
            this.convolverNode.buffer = null === url ? null : await readAudio(this.context, url)
            this.ready = true
        } catch (e) {
            console.warn(e)
        }
    }

    getURL(): string {
        return this.url
    }

    isReady(): boolean {
        return this.ready
    }

    deserialize(data: ConvolverData): Convolver {
        this.ready = false
        this.setURL(data.url).then(() => this.ready = true)
        return this
    }

    serialize(): ConvolverData {
        return {url: this.getURL()}
    }
}

export declare interface PulsarDelayData {
    preDelayTimeL: number
    preDelayTimeR: number
    feedbackDelayTime: number
    feedbackGain: number
    feedbackLowpass: number
    feedbackHighpass: number
}

export class PulsarDelaySettings extends CompositeSettings<PulsarDelayData> {
    readonly preDelayTimeL = this.bindValue(new BoundNumericValue(Linear.Identity, 0.125))
    readonly preDelayTimeR = this.bindValue(new BoundNumericValue(Linear.Identity, 0.500))
    readonly feedbackDelayTime = this.bindValue(new BoundNumericValue(Linear.Identity, 0.250))
    readonly feedbackGain = this.bindValue(new BoundNumericValue(Linear.Identity, 0.6))
    readonly feedbackLowpass = this.bindValue(new BoundNumericValue(new Linear(20.0, 20000.0), 12000.0))
    readonly feedbackHighpass = this.bindValue(new BoundNumericValue(new Linear(20.0, 20000.0), 480.0))

    serialize(): CompositeSettingsFormat<PulsarDelayData> {
        return super.pack({
            preDelayTimeL: this.preDelayTimeL.get(),
            preDelayTimeR: this.preDelayTimeR.get(),
            feedbackDelayTime: this.feedbackDelayTime.get(),
            feedbackGain: this.feedbackGain.get(),
            feedbackLowpass: this.feedbackLowpass.get(),
            feedbackHighpass: this.feedbackHighpass.get()
        })
    }

    deserialize(format: CompositeSettingsFormat<PulsarDelayData>): PulsarDelaySettings {
        const data: PulsarDelayData = super.unpack(format)
        this.preDelayTimeL.set(data.preDelayTimeL)
        this.preDelayTimeR.set(data.preDelayTimeR)
        this.feedbackDelayTime.set(data.feedbackDelayTime)
        this.feedbackGain.set(data.feedbackGain)
        this.feedbackLowpass.set(data.feedbackLowpass)
        this.feedbackHighpass.set(data.feedbackHighpass)
        return this
    }
}

export class PulsarDelay extends DefaultComposite<PulsarDelaySettings> {
    private readonly preSplitter: ChannelSplitterNode
    private readonly preDelayL: DelayNode
    private readonly preDelayR: DelayNode
    private readonly feedbackMerger: ChannelMergerNode
    private readonly feedbackLowpass: BiquadFilterNode
    private readonly feedbackHighpass: BiquadFilterNode
    private readonly feedbackDelay: DelayNode
    private readonly feedbackGain: GainNode
    private readonly feedbackSplitter: ChannelSplitterNode

    constructor(private readonly context: BaseAudioContext, format?: PulsarDelayData) {
        super()
        this.preSplitter = context.createChannelSplitter(2)
        this.preDelayL = context.createDelay()
        this.preDelayR = context.createDelay()
        this.preSplitter.connect(this.preDelayL, 0, 0)
        this.preSplitter.connect(this.preDelayR, 1, 0)
        this.feedbackMerger = context.createChannelMerger(2)
        this.preDelayL.connect(this.feedbackMerger, 0, 1)
        this.preDelayR.connect(this.feedbackMerger, 0, 0)
        this.feedbackLowpass = context.createBiquadFilter()
        this.feedbackLowpass.type = "lowpass"
        this.feedbackLowpass.Q.value = -3.0
        this.feedbackHighpass = context.createBiquadFilter()
        this.feedbackHighpass.type = "highpass"
        this.feedbackHighpass.Q.value = -3.0
        this.feedbackDelay = context.createDelay()
        this.feedbackGain = context.createGain()
        this.feedbackSplitter = context.createChannelSplitter(2)
        this.feedbackMerger
            .connect(this.feedbackLowpass)
            .connect(this.feedbackHighpass)
            .connect(this.feedbackGain)
            .connect(this.feedbackDelay)
            .connect(this.feedbackSplitter)
        this.feedbackSplitter.connect(this.feedbackMerger, 0, 1)
        this.feedbackSplitter.connect(this.feedbackMerger, 1, 0)
        this.setInputOutput(this.preSplitter, this.feedbackGain)

        if (format === undefined) {
            this.setPreDelayTimeL(0.125)
            this.setPreDelayTimeR(0.500)
            this.setFeedbackDelayTime(0.250)
            this.setFeedbackGain(0.6)
            this.setFeedbackLowpass(12000.0)
            this.setFeedbackHighpass(480.0)
        } else {
            this.deserialize(format)
        }
    }

    public watchSettings(settings: PulsarDelaySettings): Terminable {
        const terminator = new Terminator()
        terminator.with(settings.preDelayTimeL.addObserver(seconds => this.setPreDelayTimeL(seconds), true))
        terminator.with(settings.preDelayTimeR.addObserver(seconds => this.setPreDelayTimeR(seconds), true))
        terminator.with(settings.feedbackDelayTime.addObserver(seconds => this.setFeedbackDelayTime(seconds), true))
        terminator.with(settings.feedbackGain.addObserver(gain => this.setFeedbackGain(gain), true))
        terminator.with(settings.feedbackLowpass.addObserver(frequency => this.setFeedbackLowpass(frequency), true))
        terminator.with(settings.feedbackHighpass.addObserver(frequency => this.setFeedbackHighpass(frequency), true))
        return terminator
    }

    public setPreDelayTimeL(seconds: number): void {
        this.setParameterValue(this.preDelayL.delayTime, seconds)
    }

    public getPreDelayTimeL(): number {
        return this.preDelayL.delayTime.value
    }

    public setPreDelayTimeR(seconds: number): void {
        this.setParameterValue(this.preDelayR.delayTime, seconds)
    }

    public getPreDelayTimeR(): number {
        return this.preDelayR.delayTime.value
    }

    public setFeedbackDelayTime(seconds: number): void {
        this.setParameterValue(this.feedbackDelay.delayTime, seconds)
    }

    public getFeedbackDelayTime(): number {
        return this.feedbackDelay.delayTime.value
    }

    public setFeedbackGain(gain: number): void {
        this.setParameterValue(this.feedbackGain.gain, gain)
    }

    public getFeedbackGain(): number {
        return this.feedbackGain.gain.value
    }

    public setFeedbackLowpass(frequency: number): void {
        this.setParameterValue(this.feedbackLowpass.frequency, frequency)
    }

    public getFeedbackLowpass(): number {
        return this.feedbackLowpass.frequency.value
    }

    public setFeedbackHighpass(frequency: number): void {
        this.setParameterValue(this.feedbackHighpass.frequency, frequency)
    }

    public getFeedbackHighpass(): number {
        return this.feedbackHighpass.frequency.value
    }

    deserialize(format: PulsarDelayData): PulsarDelay {
        this.setPreDelayTimeL(format.preDelayTimeL)
        this.setPreDelayTimeR(format.preDelayTimeR)
        this.setFeedbackDelayTime(format.feedbackDelayTime)
        this.setFeedbackGain(format.feedbackGain)
        this.setFeedbackLowpass(format.feedbackLowpass)
        this.setFeedbackHighpass(format.feedbackHighpass)
        return this
    }

    serialize(): PulsarDelayData {
        return {
            preDelayTimeL: this.getPreDelayTimeL(),
            preDelayTimeR: this.getPreDelayTimeR(),
            feedbackDelayTime: this.getFeedbackDelayTime(),
            feedbackGain: this.getFeedbackGain(),
            feedbackLowpass: this.getFeedbackLowpass(),
            feedbackHighpass: this.getFeedbackHighpass()
        }
    }

    terminate(): void {
        super.terminate()
        this.preDelayL.disconnect()
        this.preDelayR.disconnect()
        this.preSplitter.disconnect()
        this.feedbackMerger.disconnect()
        this.feedbackLowpass.disconnect()
        this.feedbackHighpass.disconnect()
        this.feedbackGain.disconnect()
        this.feedbackDelay.disconnect()
        this.feedbackSplitter.disconnect(this.feedbackMerger)
    }

    private setParameterValue(audioParam: AudioParam, value: number) {
        interpolateParameterValueIfRunning(this.context, audioParam, value)
    }
}

export interface FlangerData {
    delayTime: number
    feedback: number
    rate: number
    depth: number
}

export class FlangerSettings extends CompositeSettings<FlangerData> {
    readonly delayTime = this.bindValue(new BoundNumericValue(new Linear(0.005, 0.200), 0.007))
    readonly feedback = this.bindValue(new BoundNumericValue(Linear.Identity, 0.6))
    readonly rate = this.bindValue(new BoundNumericValue(new Exp(0.01, 10.0), 0.1))
    readonly depth = this.bindValue(new BoundNumericValue(Linear.Identity, 0.1))

    public deserialize(format: CompositeSettingsFormat<FlangerData>): FlangerSettings {
        const data = super.unpack(format)
        this.delayTime.set(data.delayTime)
        this.feedback.set(data.feedback)
        this.rate.set(data.rate)
        this.depth.set(data.depth)
        return this
    }

    public serialize(): CompositeSettingsFormat<FlangerData> {
        return super.pack({
            delayTime: this.delayTime.get(),
            feedback: this.feedback.get(),
            rate: this.rate.get(),
            depth: this.depth.get()
        })
    }
}

export class Flanger extends DefaultComposite<FlangerSettings> {
    private readonly delayNode: DelayNode
    private readonly feedbackGainNode: GainNode
    private readonly depthNode: GainNode
    private readonly lfoNode: OscillatorNode

    constructor(private readonly context: BaseAudioContext, format?: FlangerData) {
        super()
        this.delayNode = context.createDelay()
        this.feedbackGainNode = context.createGain()
        this.depthNode = context.createGain()
        this.lfoNode = context.createOscillator()
        this.lfoNode.connect(this.depthNode).connect(this.delayNode.delayTime)
        this.lfoNode.start()
        if (format === undefined) {
            this.setDelayTime(0.007)
            this.setFeedback(0.9)
            this.setLfoRate(0.1)
            this.setDepth(0.001)
        } else {
            this.deserialize(format)
        }
        this.delayNode.connect(this.feedbackGainNode).connect(this.delayNode)
        this.setInputOutput(this.delayNode, this.feedbackGainNode)
    }

    public watchSettings(settings: FlangerSettings): Terminable {
        const terminator: Terminator = new Terminator()
        terminator.with(settings.delayTime.addObserver(seconds => this.setDelayTime(seconds), true))
        terminator.with(settings.feedback.addObserver(gain => this.setFeedback(gain), true))
        terminator.with(settings.rate.addObserver(frequency => this.setLfoRate(frequency), true))
        terminator.with(settings.depth.addObserver(value => this.setDepth(value), true))
        return terminator
    }

    public setDelayTime(seconds: number): void {
        this.setParameterValue(this.delayNode.delayTime, seconds)
    }

    public getDelayTime(): number {
        return this.delayNode.delayTime.value
    }

    public setLfoRate(frequency: number): void {
        this.setParameterValue(this.lfoNode.frequency, frequency)
    }

    public getLfoRate(): number {
        return this.lfoNode.frequency.value
    }

    public setFeedback(gain: number): void {
        this.setParameterValue(this.feedbackGainNode.gain, gain)
    }

    public getFeedback(): number {
        return this.feedbackGainNode.gain.value
    }

    public setDepth(value: number): void {
        this.setParameterValue(this.depthNode.gain, value / 100.0)
    }

    public getDepth(): number {
        return this.depthNode.gain.value * 100.0
    }

    public deserialize(format: FlangerData): Flanger {
        this.setDelayTime(format.delayTime)
        this.setFeedback(format.feedback)
        this.setLfoRate(format.rate)
        this.setDepth(format.depth)
        return this
    }

    public serialize(): FlangerData {
        return {
            delayTime: this.getDelayTime(),
            feedback: this.getFeedback(),
            rate: this.getLfoRate(),
            depth: this.getDepth(),
        }
    }

    public terminate(): void {
        super.terminate()
        this.delayNode.disconnect()
        this.feedbackGainNode.disconnect()
        this.lfoNode.disconnect()
        this.depthNode.disconnect()
    }

    private setParameterValue(audioParam: AudioParam, value: number) {
        interpolateParameterValueIfRunning(this.context, audioParam, value)
    }
}

export const CompositeSettingsUIBuilder = new class implements ControlBuilder<CompositeSettings<any>> {
    availableTypes = new Map<string, NoArgType<CompositeSettings<any>>>([
        ["PulsarDelay", PulsarDelaySettings],
        ["Convolver", ConvolverSettings],
        ["Flanger", FlangerSettings]
    ])

    build(layout: UIControllerLayout, settings: CompositeSettings<any>): void {
        if (settings instanceof PulsarDelaySettings) {
            layout.createNumericStepper("Pre-Delay L", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.preDelayTimeL)
            layout.createNumericStepper("Pre-Delay R", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.preDelayTimeR)
            layout.createNumericStepper("Delay ???", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.feedbackDelayTime)
            layout.createNumericStepper("Feedback ???", PrintMapping.UnipolarPercent,
                new NumericStepper(0.001)).with(settings.feedbackGain)
            layout.createNumericStepper("Lowpass ???", PrintMapping.integer("Hz"),
                new NumericStepper(1)).with(settings.feedbackLowpass)
            layout.createNumericStepper("Highpass ???", PrintMapping.integer("Hz"),
                new NumericStepper(1)).with(settings.feedbackHighpass)
        } else if (settings instanceof ConvolverSettings) {
            layout.createSelect("Impulse", ConvolverFiles).with(settings.url)
        } else if (settings instanceof FlangerSettings) {
            layout.createNumericStepper("delay", PrintMapping.float(3, "", "s"),
                new NumericStepper(0.001)).with(settings.delayTime)
            layout.createNumericStepper("feedback", PrintMapping.UnipolarPercent,
                new NumericStepper(0.01)).with(settings.feedback)
            layout.createNumericStepper("rate", PrintMapping.float(2, "", "Hz"),
                new NumericStepper(0.01)).with(settings.rate)
            layout.createNumericStepper("depth", PrintMapping.UnipolarPercent,
                new NumericStepper(0.01)).with(settings.depth)
        }
    }
}