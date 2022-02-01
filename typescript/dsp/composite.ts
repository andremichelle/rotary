// noinspection JSUnusedGlobalSymbols

import {ArrayUtils, BoundNumericValue, Option, Options, Serializer, Terminable, Terminator} from "../lib/common.js"
import {Linear, Volume} from "../lib/mapping.js"
import {dbToGain, gainToDb, VALUE_INTERPOLATION_TIME} from "./common.js"


export const interpolateParameterValueIfRunning = (context: BaseAudioContext, audioParam: AudioParam, value: number): void => {
    if (context.state === "running") {
        audioParam.value = value
    } else {
        audioParam.linearRampToValueAtTime(value, context.currentTime + VALUE_INTERPOLATION_TIME)
    }
}

export class Channelstrip implements Terminable {
    static GAIN_MAPPING = new Linear(-18.0, +18.0)

    private readonly inputNode: GainNode
    private readonly volumeNode: GainNode
    private readonly panningNode: StereoPannerNode
    private readonly auxSendNodes: GainNode[]

    private connected: Option<[AudioNode, number]> = Options.None

    solo: boolean = false

    private volume: number = 1.0
    private mute: boolean = false

    constructor(private readonly mixer: Mixer, numAux: number = 0) {
        this.inputNode = mixer.context.createGain()
        this.panningNode = mixer.context.createStereoPanner()
        this.volumeNode = mixer.context.createGain()
        this.auxSendNodes = ArrayUtils.fill(numAux, index => {
            const sendNode = mixer.context.createGain()
            sendNode.gain.value = 0.0
            this.volumeNode.connect(sendNode).connect(mixer.auxSend(index))
            return sendNode
        })
        this.inputNode.connect(this.panningNode).connect(this.volumeNode).connect(mixer.outputNode)
    }

    public connectToInput(output: AudioNode, outputIndex: number): void {
        console.assert(this.connected.isEmpty())
        output.connect(this.inputNode, outputIndex, 0)
        this.connected = Options.valueOf([output, outputIndex])
    }

    public setInputDecibel(db: number): void {
        this.mixer.setParameterValue(this.inputNode.gain, dbToGain(Channelstrip.GAIN_MAPPING.y(db)))
    }

    public getInputDecibel(): number {
        return Channelstrip.GAIN_MAPPING.x(gainToDb(this.inputNode.gain.value))
    }

    public setPanning(bipolar: number): void {
        this.mixer.setParameterValue(this.panningNode.pan, bipolar)
    }

    public getPanning(): number {
        return this.panningNode.pan.value
    }

    public setVolume(unipolar: number): void {
        if (this.volume === unipolar) {
            return
        }
        this.volume = unipolar
        this.updateVolume()
    }

    public getVolume(): number {
        return this.volume
    }

    public setMute(value: boolean): void {
        if (this.mute === value) {
            return
        }
        this.mute = value
        this.updateVolume()
    }

    public getMute(): boolean {
        return this.mute
    }

    public setSolo(value: boolean): void {
        if (this.solo === value) {
            return
        }
        this.solo = value
        this.mixer.onChannelstripSoloChanged()
    }

    public getSolo(): boolean {
        return this.solo
    }

    public setAuxSend(index: number, volume: number): void {
        console.assert(0 <= index && index < this.auxSendNodes.length, "index out fo bounds")
        this.mixer.setParameterValue(this.auxSendNodes[index].gain, dbToGain(Volume.Default.y(volume)))
    }

    updateVolume(): void {
        this.mixer.setParameterValue(this.volumeNode.gain, this.computeVolume())
    }

    terminate(): void {
        this.connected.ifPresent(pair => pair[0].disconnect(this.inputNode, pair[1]))
        this.connected = Options.None
        this.volumeNode.disconnect()
        this.panningNode.disconnect()
        this.auxSendNodes.forEach(gainNode => gainNode.disconnect())
        if (this.solo) {
            this.solo = false
            this.mixer.onChannelstripSoloChanged()
        }
    }

    private computeVolume(): number {
        return this.mute || (this.mixer.isAnyChannelSolo() && !this.solo) ? 0.0 : dbToGain(Volume.Default.y(this.volume))
    }
}

export class Mixer {
    private readonly channelstrips: Channelstrip[] = []
    private readonly auxSendNodes: GainNode[]
    private readonly auxReturnNodes: GainNode[]

    readonly outputNode: GainNode

    constructor(readonly context: BaseAudioContext, readonly numAux: number = 0) {
        this.outputNode = context.createGain()

        this.auxSendNodes = ArrayUtils.fill(numAux, () => context.createGain())
        this.auxReturnNodes = ArrayUtils.fill(numAux, () => {
            const gainNode = context.createGain()
            gainNode.connect(this.outputNode)
            return gainNode
        })
    }

    public createChannelstrip(): Channelstrip {
        const channelstrip = new Channelstrip(this, this.numAux)
        this.channelstrips.push(channelstrip)
        return channelstrip
    }

    public removeChannelstrip(channelstrip: Channelstrip): void {
        const index = this.channelstrips.indexOf(channelstrip)
        if (-1 === index) {
            throw new Error("Unknown Channelstrip")
        }
        this.channelstrips.splice(index, 1)
        channelstrip.terminate()
    }

    public masterOutput(): AudioNode {
        return this.outputNode
    }

    public auxSend(index: number): AudioNode {
        return this.auxSendNodes[index]
    }

    public auxReturn(index: number): AudioNode {
        return this.auxReturnNodes[index]
    }

    public setAuxReturnDecibel(index: number, volume: number): void {
        console.assert(0 <= index && index < this.numAux, "index out fo bounds")
        this.setParameterValue(this.auxReturnNodes[index].gain, dbToGain(Volume.Default.y(volume)))
    }

    onChannelstripSoloChanged() {
        this.channelstrips.forEach(strip => strip.updateVolume())
    }

    isAnyChannelSolo(): boolean {
        return this.channelstrips.some(strip => strip.solo, this.channelstrips)
    }

    setParameterValue(audioParam: AudioParam, value: number) {
        interpolateParameterValueIfRunning(this.context, audioParam, value)
    }
}

export interface PulsarDelayFormat {
    preDelayTimeL: number
    preDelayTimeR: number
    feedbackDelayTime: number
    feedbackGain: number
    feedbackLowpass: number
    feedbackHighpass: number
}

export class PulsarDelaySettings implements Serializer<PulsarDelayFormat> {
    readonly preDelayTimeL: BoundNumericValue = new BoundNumericValue(Linear.Identity, 0.125)
    readonly preDelayTimeR: BoundNumericValue = new BoundNumericValue(Linear.Identity, 0.500)
    readonly feedbackDelayTime: BoundNumericValue = new BoundNumericValue(Linear.Identity, 0.250)
    readonly feedbackGain: BoundNumericValue = new BoundNumericValue(Linear.Identity, 0.6)
    readonly feedbackLowpass: BoundNumericValue = new BoundNumericValue(new Linear(20.0, 20000.0), 12000.0)
    readonly feedbackHighpass: BoundNumericValue = new BoundNumericValue(new Linear(20.0, 20000.0), 480.0)

    deserialize(format: PulsarDelayFormat): PulsarDelaySettings {
        this.preDelayTimeL.set(format.preDelayTimeL)
        this.preDelayTimeR.set(format.preDelayTimeR)
        this.feedbackDelayTime.set(format.feedbackDelayTime)
        this.feedbackGain.set(format.feedbackGain)
        this.feedbackLowpass.set(format.feedbackLowpass)
        this.feedbackHighpass.set(format.feedbackHighpass)
        return this
    }

    serialize(): PulsarDelayFormat {
        return {
            preDelayTimeL: this.preDelayTimeL.get(),
            preDelayTimeR: this.preDelayTimeR.get(),
            feedbackDelayTime: this.feedbackDelayTime.get(),
            feedbackGain: this.feedbackGain.get(),
            feedbackLowpass: this.feedbackLowpass.get(),
            feedbackHighpass: this.feedbackHighpass.get()
        }
    }
}

export class PulsarDelay implements Serializer<PulsarDelayFormat>, Terminable {
    private readonly preSplitter: ChannelSplitterNode
    private readonly preDelayL: DelayNode
    private readonly preDelayR: DelayNode
    private readonly feedbackMerger: ChannelMergerNode
    private readonly feedbackLowpass: BiquadFilterNode
    private readonly feedbackHighpass: BiquadFilterNode
    private readonly feedbackDelay: DelayNode
    private readonly feedbackGain: GainNode
    private readonly feedbackSplitter: ChannelSplitterNode

    private incoming: Option<[AudioNode, number]> = Options.None
    private outgoing: Option<[AudioNode, number]> = Options.None

    constructor(private readonly context: BaseAudioContext, format?: PulsarDelayFormat) {
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

    public connectToInput(output: AudioNode, outputIndex: number = 0 | 0): void {
        console.assert(this.incoming.isEmpty())
        output.connect(this.preSplitter, outputIndex, 0)
        this.incoming = Options.valueOf([output, outputIndex])
    }

    public connectToOutput(input: AudioNode, inputIndex: number = 0 | 0): void {
        console.assert(this.outgoing.isEmpty())
        this.feedbackGain.connect(input, 0, inputIndex)
        this.outgoing = Options.valueOf([input, inputIndex])
    }

    public watchSettings(settings: PulsarDelaySettings): Terminable {
        const terminator = new Terminator()
        terminator.with(settings.preDelayTimeL.addObserver(seconds => this.setPreDelayTimeL(seconds)))
        terminator.with(settings.preDelayTimeR.addObserver(seconds => this.setPreDelayTimeR(seconds)))
        terminator.with(settings.feedbackDelayTime.addObserver(seconds => this.setFeedbackDelayTime(seconds)))
        terminator.with(settings.feedbackGain.addObserver(gain => this.setFeedbackGain(gain)))
        terminator.with(settings.feedbackLowpass.addObserver(frequency => this.setFeedbackLowpass(frequency)))
        terminator.with(settings.feedbackHighpass.addObserver(frequency => this.setFeedbackHighpass(frequency)))
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

    deserialize(format: PulsarDelayFormat): PulsarDelay {
        this.setPreDelayTimeL(format.preDelayTimeL)
        this.setPreDelayTimeR(format.preDelayTimeR)
        this.setFeedbackDelayTime(format.feedbackDelayTime)
        this.setFeedbackGain(format.feedbackGain)
        this.setFeedbackLowpass(format.feedbackLowpass)
        this.setFeedbackHighpass(format.feedbackHighpass)
        return this
    }

    serialize(): PulsarDelayFormat {
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
        this.preDelayL.disconnect()
        this.preDelayR.disconnect()
        this.preSplitter.disconnect()
        this.feedbackMerger.disconnect()
        this.feedbackLowpass.disconnect()
        this.feedbackHighpass.disconnect()
        this.feedbackGain.disconnect()
        this.feedbackDelay.disconnect()
        this.feedbackSplitter.disconnect(this.feedbackMerger)
        this.incoming.ifPresent(pair => pair[0].disconnect(this.preSplitter, pair[1], 0))
        this.outgoing.ifPresent(pair => this.feedbackGain.disconnect(pair[0], 0, pair[1]))
        this.incoming = Options.None
        this.outgoing = Options.None
    }

    private setParameterValue(audioParam: AudioParam, value: number) {
        interpolateParameterValueIfRunning(this.context, audioParam, value)
    }
}