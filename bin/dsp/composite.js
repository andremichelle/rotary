import { ArrayUtils, Options } from "../lib/common.js";
import { Linear, Volume } from "../lib/mapping.js";
import { dbToGain, gainToDb, VALUE_INTERPOLATION_TIME } from "./common.js";
export const interpolateParameterValueIfRunning = (context, audioParam, value) => {
    if (context.state === "running") {
        audioParam.value = value;
    }
    else {
        audioParam.linearRampToValueAtTime(value, context.currentTime + VALUE_INTERPOLATION_TIME);
    }
};
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
    terminate() {
        this.connected.ifPresent(pair => pair[0].disconnect(this.inputNode, pair[1]));
        this.connected = Options.None;
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
        this.channelstrips = [];
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
        this.channelstrips.push(channelstrip);
        return channelstrip;
    }
    removeChannelstrip(channelstrip) {
        const index = this.channelstrips.indexOf(channelstrip);
        if (-1 === index) {
            throw new Error("Unknown Channelstrip");
        }
        this.channelstrips.splice(index, 1);
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
        return this.channelstrips.some(strip => strip.solo, this.channelstrips);
    }
    setParameterValue(audioParam, value) {
        interpolateParameterValueIfRunning(this.context, audioParam, value);
    }
}
export class PulsarDelay {
    constructor(context, format) {
        this.context = context;
        this.incoming = Options.None;
        this.outgoing = Options.None;
        this.preSplitter = context.createChannelSplitter(2);
        this.preDelayL = context.createDelay();
        this.preDelayR = context.createDelay();
        this.preSplitter.connect(this.preDelayL, 0, 0);
        this.preSplitter.connect(this.preDelayR, 1, 0);
        this.feedbackMerger = context.createChannelMerger(2);
        this.preDelayL.connect(this.feedbackMerger, 0, 1);
        this.preDelayR.connect(this.feedbackMerger, 0, 0);
        this.feedbackLowpass = context.createBiquadFilter();
        this.feedbackLowpass.type = "lowpass";
        this.feedbackLowpass.Q.value = -3.0;
        this.feedbackHighpass = context.createBiquadFilter();
        this.feedbackHighpass.type = "highpass";
        this.feedbackHighpass.Q.value = -3.0;
        this.feedbackDelay = context.createDelay();
        this.feedbackGain = context.createGain();
        this.feedbackSplitter = context.createChannelSplitter(2);
        this.feedbackMerger
            .connect(this.feedbackLowpass)
            .connect(this.feedbackHighpass)
            .connect(this.feedbackGain)
            .connect(this.feedbackDelay)
            .connect(this.feedbackSplitter);
        this.feedbackSplitter.connect(this.feedbackMerger, 0, 1);
        this.feedbackSplitter.connect(this.feedbackMerger, 1, 0);
        if (format === undefined) {
            this.setPreDelayTimeL(0.125);
            this.setPreDelayTimeR(0.500);
            this.setFeedbackDelayTime(0.250);
            this.setFeedbackGain(0.6);
            this.setFeedbackLowpass(12000.0);
            this.setFeedbackHighpass(480.0);
        }
        else {
            this.deserialize(format);
        }
    }
    connectToInput(output, outputIndex = 0 | 0) {
        console.assert(this.incoming.isEmpty());
        output.connect(this.preSplitter, outputIndex, 0);
        this.incoming = Options.valueOf([output, outputIndex]);
    }
    connectToOutput(input, inputIndex = 0 | 0) {
        console.assert(this.outgoing.isEmpty());
        this.feedbackGain.connect(input, 0, inputIndex);
        this.outgoing = Options.valueOf([input, inputIndex]);
    }
    setPreDelayTimeL(seconds) {
        this.setParameterValue(this.preDelayL.delayTime, seconds);
    }
    getPreDelayTimeL() {
        return this.preDelayL.delayTime.value;
    }
    setPreDelayTimeR(seconds) {
        this.setParameterValue(this.preDelayR.delayTime, seconds);
    }
    getPreDelayTimeR() {
        return this.preDelayR.delayTime.value;
    }
    setFeedbackDelayTime(seconds) {
        this.setParameterValue(this.feedbackDelay.delayTime, seconds);
    }
    getFeedbackDelayTime() {
        return this.feedbackDelay.delayTime.value;
    }
    setFeedbackGain(gain) {
        this.setParameterValue(this.feedbackGain.gain, gain);
    }
    getFeedbackGain() {
        return this.feedbackGain.gain.value;
    }
    setFeedbackLowpass(frequency) {
        this.setParameterValue(this.feedbackLowpass.frequency, frequency);
    }
    getFeedbackLowpass() {
        return this.feedbackLowpass.frequency.value;
    }
    setFeedbackHighpass(frequency) {
        this.setParameterValue(this.feedbackHighpass.frequency, frequency);
    }
    getFeedbackHighpass() {
        return this.feedbackHighpass.frequency.value;
    }
    deserialize(format) {
        this.setPreDelayTimeL(format.preDelayTimeL);
        this.setPreDelayTimeR(format.preDelayTimeR);
        this.setFeedbackDelayTime(format.feedbackDelayTime);
        this.setFeedbackGain(format.feedbackGain);
        this.setFeedbackLowpass(format.feedbackLowpass);
        this.setFeedbackHighpass(format.feedbackHighpass);
        return this;
    }
    serialize() {
        return {
            preDelayTimeL: this.getPreDelayTimeL(),
            preDelayTimeR: this.getPreDelayTimeR(),
            feedbackDelayTime: this.getFeedbackDelayTime(),
            feedbackGain: this.getFeedbackGain(),
            feedbackLowpass: this.getFeedbackLowpass(),
            feedbackHighpass: this.getFeedbackHighpass()
        };
    }
    terminate() {
        this.preDelayL.disconnect();
        this.preDelayR.disconnect();
        this.preSplitter.disconnect();
        this.feedbackMerger.disconnect();
        this.feedbackLowpass.disconnect();
        this.feedbackHighpass.disconnect();
        this.feedbackGain.disconnect();
        this.feedbackDelay.disconnect();
        this.feedbackSplitter.disconnect(this.feedbackMerger);
        this.incoming.ifPresent(pair => pair[0].disconnect(this.preSplitter, pair[1], 0));
        this.outgoing.ifPresent(pair => this.feedbackGain.disconnect(pair[0], 0, pair[1]));
        this.incoming = Options.None;
        this.outgoing = Options.None;
    }
    setParameterValue(audioParam, value) {
        interpolateParameterValueIfRunning(this.context, audioParam, value);
    }
}
//# sourceMappingURL=composite.js.map