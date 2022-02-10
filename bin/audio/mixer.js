import { dbToGain, gainToDb, interpolateParameterValueIfRunning } from "./common.js";
import { ArrayUtils, Options } from "../lib/common.js";
import { Linear, Volume } from "../lib/mapping.js";
export class Channelstrip {
    constructor(mixer, numAux = 0) {
        this.mixer = mixer;
        this.connected = Options.None;
        this.solo = false;
        this.volume = 1.0;
        this.mute = false;
        this.inputNode = mixer.context.createGain();
        this.panningNode = mixer.context.createStereoPanner();
        this.volumeNode = mixer.context.createGain();
        this.auxSendNodes = ArrayUtils.fill(numAux, index => {
            const sendNode = mixer.context.createGain();
            sendNode.gain.value = 0.0;
            this.volumeNode.connect(sendNode).connect(mixer.auxSend(index));
            return sendNode;
        });
        this.inputNode.connect(this.panningNode).connect(this.volumeNode).connect(mixer.outputNode);
    }
    connectToInput(output, outputIndex) {
        console.assert(this.connected.isEmpty());
        output.connect(this.inputNode, outputIndex, 0);
        this.connected = Options.valueOf([output, outputIndex]);
    }
    setInputDecibel(db) {
        this.mixer.setParameterValue(this.inputNode.gain, dbToGain(Channelstrip.GAIN_MAPPING.y(db)));
    }
    getInputDecibel() {
        return Channelstrip.GAIN_MAPPING.x(gainToDb(this.inputNode.gain.value));
    }
    setPanning(bipolar) {
        this.mixer.setParameterValue(this.panningNode.pan, bipolar);
    }
    getPanning() {
        return this.panningNode.pan.value;
    }
    getPanningParam() {
        return this.panningNode.pan;
    }
    setVolume(unipolar) {
        if (this.volume === unipolar) {
            return;
        }
        this.volume = unipolar;
        this.updateVolume();
    }
    getVolume() {
        return this.volume;
    }
    setMute(value) {
        if (this.mute === value) {
            return;
        }
        this.mute = value;
        this.updateVolume();
    }
    getMute() {
        return this.mute;
    }
    setSolo(value) {
        if (this.solo === value) {
            return;
        }
        this.solo = value;
        this.mixer.onChannelstripSoloChanged();
    }
    getSolo() {
        return this.solo;
    }
    setAuxSend(index, volume) {
        console.assert(0 <= index && index < this.auxSendNodes.length, "index out fo bounds");
        this.mixer.setParameterValue(this.auxSendNodes[index].gain, dbToGain(Volume.Default.y(volume)));
    }
    updateVolume() {
        this.mixer.setParameterValue(this.volumeNode.gain, this.computeVolume());
    }
    disconnect() {
        this.connected.ifPresent(pair => pair[0].disconnect(this.inputNode, pair[1]));
        this.connected = Options.None;
    }
    terminate() {
        this.disconnect();
        this.volumeNode.disconnect();
        this.panningNode.disconnect();
        this.auxSendNodes.forEach(gainNode => gainNode.disconnect());
        if (this.solo) {
            this.solo = false;
            this.mixer.onChannelstripSoloChanged();
        }
    }
    computeVolume() {
        return this.mute || (this.mixer.isAnyChannelSolo() && !this.solo) ? 0.0 : dbToGain(Volume.Default.y(this.volume));
    }
}
Channelstrip.GAIN_MAPPING = new Linear(-18.0, +18.0);
export class Mixer {
    constructor(context, numAux = 0) {
        this.context = context;
        this.numAux = numAux;
        this.channelstrips = new Set();
        this.outputNode = context.createGain();
        this.auxSendNodes = ArrayUtils.fill(numAux, () => context.createGain());
        this.auxReturnNodes = ArrayUtils.fill(numAux, () => {
            const gainNode = context.createGain();
            gainNode.connect(this.outputNode);
            return gainNode;
        });
    }
    createChannelstrip() {
        const channelstrip = new Channelstrip(this, this.numAux);
        this.channelstrips.add(channelstrip);
        return channelstrip;
    }
    removeChannelstrip(channelstrip) {
        const deleted = this.channelstrips.delete(channelstrip);
        console.assert(deleted);
        channelstrip.terminate();
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
    setAuxReturnDecibel(index, volume) {
        console.assert(0 <= index && index < this.numAux, "index out fo bounds");
        this.setParameterValue(this.auxReturnNodes[index].gain, dbToGain(Volume.Default.y(volume)));
    }
    onChannelstripSoloChanged() {
        this.channelstrips.forEach(strip => strip.updateVolume());
    }
    isAnyChannelSolo() {
        return Array.from(this.channelstrips).some(strip => strip.solo, this.channelstrips);
    }
    setParameterValue(audioParam, value) {
        interpolateParameterValueIfRunning(this.context, audioParam, value);
    }
}
//# sourceMappingURL=mixer.js.map