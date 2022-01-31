import { ArrayUtils, BoundNumericValue, ObservableValueImpl, Terminator } from "../lib/common.js";
import { Linear, Volume } from "../lib/mapping.js";
import { dbToGain } from "../dsp/common.js";
export class ChannelstripModel {
    constructor(numAux) {
        this.gain = new BoundNumericValue(Channelstrip.GAIN_MAPPING, 0.5);
        this.volume = new BoundNumericValue(Linear.Identity, 1.0);
        this.panning = new BoundNumericValue(Linear.Bipolar, 0.0);
        this.mute = new ObservableValueImpl(false);
        this.solo = new ObservableValueImpl(false);
        this.auxSends = ArrayUtils.fill(numAux, () => new BoundNumericValue(Linear.Identity, 0.0));
    }
}
export class Channelstrip {
    constructor(mixer, model) {
        this.mixer = mixer;
        this.model = model;
        this.terminator = new Terminator();
        this.computeVolume = () => this.model.mute.get()
            || (this.mixer.isAnyChannelSolo() && !this.model.solo.get())
            ? 0.0 : dbToGain(Volume.Default.y(this.model.volume.get()));
        this.inputNode = mixer.context.createGain();
        this.inputNode.gain.value = dbToGain(Channelstrip.GAIN_MAPPING.y(model.gain.get()));
        this.panningNode = mixer.context.createStereoPanner();
        this.panningNode.pan.value = model.panning.get();
        this.volumeNode = mixer.context.createGain();
        this.auxSendNode = ArrayUtils.fill(model.auxSends.length, index => {
            const gainNode = mixer.context.createGain();
            const observer = () => gainNode.gain.value = model.auxSends[index].get();
            observer();
            this.terminator.with(model.auxSends[index].addObserver(observer));
            this.volumeNode.connect(gainNode).connect(mixer.auxSend(index));
            return gainNode;
        });
        this.inputNode.connect(this.panningNode).connect(this.volumeNode).connect(mixer.outputNode);
        this.terminator.with(model.volume.addObserver(() => this.updateVolume()));
        this.terminator.with(model.mute.addObserver(() => this.updateVolume()));
        this.terminator.with(model.solo.addObserver(() => this.mixer.onChannelstripSoloChanged()));
    }
    init() {
        this.updateVolume();
    }
    input() {
        return this.inputNode;
    }
    updateVolume() {
        this.volumeNode.gain.value = this.computeVolume();
    }
}
Channelstrip.GAIN_MAPPING = new Linear(-18.0, +18.0);
export class MixerModel {
    constructor(numChannels, numAux) {
        this.numChannels = numChannels;
        this.numAux = numAux;
        this.volume = new BoundNumericValue(Linear.Identity, 1.0);
        this.channels = ArrayUtils.fill(numChannels, () => new ChannelstripModel(numAux));
    }
}
export class Mixer {
    constructor(context, model) {
        this.context = context;
        this.model = model;
        this.outputNode = context.createGain();
        this.outputNode.gain.value = dbToGain(Volume.Default.y(model.volume.get()));
        this.auxSendNodes = ArrayUtils.fill(model.numAux, () => context.createGain());
        this.auxReturnNodes = ArrayUtils.fill(model.numAux, () => {
            const gainNode = context.createGain();
            gainNode.connect(this.outputNode);
            return gainNode;
        });
        this.channelstrips = ArrayUtils.fill(model.numChannels, (index) => new Channelstrip(this, model.channels[index]));
        this.channelstrips.forEach(strip => strip.init());
    }
    masterOutput() {
        return this.outputNode;
    }
    auxSend(index) {
        return this.auxSendNodes[index];
    }
    auxReturn(index) {
        return this.auxReturnNodes[index];
    }
    onChannelstripSoloChanged() {
        this.channelstrips.forEach(strip => strip.updateVolume());
    }
    isAnyChannelSolo() {
        return this.channelstrips.some(strip => strip.model.solo.get(), this.channelstrips);
    }
}
//# sourceMappingURL=mixer.js.map