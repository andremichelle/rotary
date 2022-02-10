import {dbToGain, gainToDb, interpolateParameterValueIfRunning} from "./common.js"
import {ArrayUtils, Option, Options, Terminable} from "../lib/common.js"
import {Linear, Volume} from "../lib/mapping.js"

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

    public getPanningParam(): AudioParam {
        return this.panningNode.pan
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

    disconnect(): void {
        this.connected.ifPresent(pair => pair[0].disconnect(this.inputNode, pair[1]))
        this.connected = Options.None
    }

    terminate(): void {
        this.disconnect()
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
    private readonly channelstrips: Set<Channelstrip> = new Set<Channelstrip>()
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
        this.channelstrips.add(channelstrip)
        return channelstrip
    }

    public removeChannelstrip(channelstrip: Channelstrip): void {
        const deleted = this.channelstrips.delete(channelstrip)
        console.assert(deleted)
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
        return Array.from(this.channelstrips).some(strip => strip.solo, this.channelstrips)
    }

    setParameterValue(audioParam: AudioParam, value: number) {
        interpolateParameterValueIfRunning(this.context, audioParam, value)
    }
}