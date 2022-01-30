import {ArrayUtils, BoundNumericValue, ObservableValueImpl, Terminator} from "../lib/common.js"
import {Linear, Volume} from "../lib/mapping.js"
import {dbToGain} from "../dsp/common.js"

export class ChannelstripModel {
    readonly gain = new BoundNumericValue(Channelstrip.GAIN_MAPPING, 0.5)
    readonly volume = new BoundNumericValue(Linear.Identity, 1.0)
    readonly panning = new BoundNumericValue(Linear.Bipolar, 0.0)
    readonly auxSends: BoundNumericValue[]
    readonly mute = new ObservableValueImpl<boolean>(false)
    readonly solo = new ObservableValueImpl<boolean>(false)

    constructor(numAux: number) {
        this.auxSends = ArrayUtils.fill(numAux, () => new BoundNumericValue(Linear.Identity, 0.0))
    }
}

export class Channelstrip {
    static GAIN_MAPPING = new Linear(-18.0, +18.0)

    private readonly terminator: Terminator = new Terminator()

    private readonly inputNode: GainNode
    private readonly volumeNode: GainNode
    private readonly auxSendNode: GainNode[]
    private readonly panningNode: StereoPannerNode

    constructor(readonly mixer: Mixer, readonly model: ChannelstripModel) {
        this.inputNode = mixer.context.createGain()
        this.inputNode.gain.value = dbToGain(Channelstrip.GAIN_MAPPING.y(model.gain.get()))
        this.panningNode = mixer.context.createStereoPanner()
        this.panningNode.pan.value = model.panning.get()
        this.volumeNode = mixer.context.createGain()
        this.auxSendNode = ArrayUtils.fill(model.auxSends.length, index => {
            const gainNode = mixer.context.createGain()
            const observer = () => gainNode.gain.value = model.auxSends[index].get()
            observer()
            this.terminator.with(model.auxSends[index].addObserver(observer))
            this.volumeNode.connect(gainNode).connect(mixer.auxSend(index))
            return gainNode
        })
        this.inputNode.connect(this.panningNode).connect(this.volumeNode).connect(mixer.outputNode)


        this.terminator.with(model.volume.addObserver(() => this.updateVolume()))
        this.terminator.with(model.mute.addObserver(() => this.updateVolume()))
        this.terminator.with(model.solo.addObserver(() => this.mixer.onChannelstripSoloChanged()))
    }

    init(): void {
        this.updateVolume()
    }

    input(): AudioNode {
        return this.inputNode
    }

    updateVolume(): void {
        this.volumeNode.gain.value = this.computeVolume()
    }

    computeVolume = (): number => this.model.mute.get()
    || (this.mixer.isAnyChannelSolo() && !this.model.solo.get())
        ? 0.0 : dbToGain(Volume.Default.y(this.model.volume.get()))
}

export class MixerModel {
    readonly volume = new BoundNumericValue(Linear.Identity, 1.0)
    readonly channels: ChannelstripModel[]

    constructor(readonly numChannels: number, readonly numAux: number) {
        this.channels = ArrayUtils.fill(numChannels, () => new ChannelstripModel(numAux))
    }
}

export class Mixer {
    readonly channelstrips: Channelstrip[]

    readonly outputNode: GainNode
    readonly auxSendNodes: GainNode[]
    readonly auxReturnNodes: GainNode[]

    constructor(readonly context: BaseAudioContext, readonly model: MixerModel) {
        this.outputNode = context.createGain()
        this.outputNode.gain.value = dbToGain(Volume.Default.y(model.volume.get()))

        this.auxSendNodes = ArrayUtils.fill(model.numAux, () => context.createGain())
        this.auxReturnNodes = ArrayUtils.fill(model.numAux, () => {
            const gainNode = context.createGain()
            gainNode.connect(this.outputNode)
            return gainNode
        })

        this.channelstrips = ArrayUtils.fill(model.numChannels, (index) => new Channelstrip(this, model.channels[index]))
        this.channelstrips.forEach(strip => strip.init()) // we need the array to be populated
    }

    masterOutput(): AudioNode {
        return this.outputNode
    }

    auxSend(index: number): AudioNode {
        return this.auxSendNodes[index]
    }

    auxReturn(index: number): AudioNode {
        return this.auxReturnNodes[index]
    }

    onChannelstripSoloChanged() {
        this.channelstrips.forEach(strip => strip.updateVolume())
    }

    isAnyChannelSolo(): boolean {
        return this.channelstrips.some(strip => strip.model.solo.get(), this.channelstrips)
    }
}