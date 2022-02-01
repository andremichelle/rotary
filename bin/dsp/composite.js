import { ArrayUtils, BoundNumericValue, Options, Terminator } from "../lib/common.js";
import { Exp, Linear, Volume } from "../lib/mapping.js";
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
export class PulsarDelaySettings {
    constructor() {
        this.preDelayTimeL = new BoundNumericValue(Linear.Identity, 0.125);
        this.preDelayTimeR = new BoundNumericValue(Linear.Identity, 0.500);
        this.feedbackDelayTime = new BoundNumericValue(Linear.Identity, 0.250);
        this.feedbackGain = new BoundNumericValue(Linear.Identity, 0.6);
        this.feedbackLowpass = new BoundNumericValue(new Linear(20.0, 20000.0), 12000.0);
        this.feedbackHighpass = new BoundNumericValue(new Linear(20.0, 20000.0), 480.0);
    }
    deserialize(format) {
        this.preDelayTimeL.set(format.preDelayTimeL);
        this.preDelayTimeR.set(format.preDelayTimeR);
        this.feedbackDelayTime.set(format.feedbackDelayTime);
        this.feedbackGain.set(format.feedbackGain);
        this.feedbackLowpass.set(format.feedbackLowpass);
        this.feedbackHighpass.set(format.feedbackHighpass);
        return this;
    }
    serialize() {
        return {
            preDelayTimeL: this.preDelayTimeL.get(),
            preDelayTimeR: this.preDelayTimeR.get(),
            feedbackDelayTime: this.feedbackDelayTime.get(),
            feedbackGain: this.feedbackGain.get(),
            feedbackLowpass: this.feedbackLowpass.get(),
            feedbackHighpass: this.feedbackHighpass.get()
        };
    }
}
export class DefaultIO {
    constructor() {
        this.incoming = Options.None;
        this.outgoing = Options.None;
        this.input = null;
        this.output = null;
    }
    setIO(input, output) {
        this.input = input;
        this.output = output;
    }
    connectToInput(output, outputIndex = 0 | 0) {
        console.assert(null !== this.input && this.incoming.isEmpty());
        output.connect(this.input, outputIndex, 0);
        this.incoming = Options.valueOf([output, outputIndex]);
    }
    connectToOutput(input, inputIndex = 0 | 0) {
        console.assert(null !== this.output && this.outgoing.isEmpty());
        this.output.connect(input, 0, inputIndex);
        this.outgoing = Options.valueOf([input, inputIndex]);
    }
    terminate() {
        this.incoming.ifPresent(pair => pair[0].disconnect(this.input, pair[1], 0));
        this.outgoing.ifPresent(pair => this.output.disconnect(pair[0], 0, pair[1]));
        this.incoming = Options.None;
        this.outgoing = Options.None;
    }
}
export class PulsarDelay extends DefaultIO {
    constructor(context, format) {
        super();
        this.context = context;
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
        this.setIO(this.preSplitter, this.feedbackGain);
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
    watchSettings(settings) {
        const terminator = new Terminator();
        terminator.with(settings.preDelayTimeL.addObserver(seconds => this.setPreDelayTimeL(seconds)));
        terminator.with(settings.preDelayTimeR.addObserver(seconds => this.setPreDelayTimeR(seconds)));
        terminator.with(settings.feedbackDelayTime.addObserver(seconds => this.setFeedbackDelayTime(seconds)));
        terminator.with(settings.feedbackGain.addObserver(gain => this.setFeedbackGain(gain)));
        terminator.with(settings.feedbackLowpass.addObserver(frequency => this.setFeedbackLowpass(frequency)));
        terminator.with(settings.feedbackHighpass.addObserver(frequency => this.setFeedbackHighpass(frequency)));
        return terminator;
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
        super.terminate();
        this.preDelayL.disconnect();
        this.preDelayR.disconnect();
        this.preSplitter.disconnect();
        this.feedbackMerger.disconnect();
        this.feedbackLowpass.disconnect();
        this.feedbackHighpass.disconnect();
        this.feedbackGain.disconnect();
        this.feedbackDelay.disconnect();
        this.feedbackSplitter.disconnect(this.feedbackMerger);
    }
    setParameterValue(audioParam, value) {
        interpolateParameterValueIfRunning(this.context, audioParam, value);
    }
}
export class FlangerSettings {
    constructor() {
        this.delayTime = new BoundNumericValue(new Linear(0.005, 0.200), 0.007);
        this.feedback = new BoundNumericValue(Linear.Identity, 0.9);
        this.rate = new BoundNumericValue(new Exp(0.01, 10.0), 0.1);
        this.depth = new BoundNumericValue(Linear.Identity, 0.1);
    }
    deserialize(format) {
        this.delayTime.set(format.delayTime);
        this.feedback.set(format.feedback);
        this.rate.set(format.rate);
        this.depth.set(format.depth);
        return this;
    }
    serialize() {
        return {
            delayTime: this.delayTime.get(),
            feedback: this.feedback.get(),
            rate: this.rate.get(),
            depth: this.depth.get()
        };
    }
}
export class Flanger extends DefaultIO {
    constructor(context, format) {
        super();
        this.context = context;
        this.delayNode = context.createDelay();
        this.feedbackGainNode = context.createGain();
        this.depthNode = context.createGain();
        this.lfoNode = context.createOscillator();
        this.lfoNode.connect(this.depthNode).connect(this.delayNode.delayTime);
        this.lfoNode.start();
        if (format === undefined) {
            this.setDelayTime(0.007);
            this.setFeedback(0.9);
            this.setLfoRate(0.1);
            this.setDepth(0.001);
        }
        else {
            this.deserialize(format);
        }
        this.delayNode.connect(this.feedbackGainNode).connect(this.delayNode);
        this.setIO(this.delayNode, this.feedbackGainNode);
    }
    setDelayTime(seconds) {
        this.setParameterValue(this.delayNode.delayTime, seconds);
    }
    getDelayTime() {
        return this.delayNode.delayTime.value;
    }
    setLfoRate(frequency) {
        this.setParameterValue(this.lfoNode.frequency, frequency);
    }
    getLfoRate() {
        return this.lfoNode.frequency.value;
    }
    setFeedback(gain) {
        this.setParameterValue(this.feedbackGainNode.gain, gain);
    }
    getFeedback() {
        return this.feedbackGainNode.gain.value;
    }
    setDepth(value) {
        this.setParameterValue(this.depthNode.gain, value / 100.0);
    }
    getDepth() {
        return this.depthNode.gain.value * 100.0;
    }
    deserialize(format) {
        this.setDelayTime(format.delayTime);
        this.setFeedback(format.feedback);
        this.setLfoRate(format.rate);
        this.setDepth(format.depth);
        return this;
    }
    serialize() {
        return {
            delayTime: this.getDelayTime(),
            feedback: this.getFeedback(),
            rate: this.getLfoRate(),
            depth: this.getDepth(),
        };
    }
    watchSettings(settings) {
        const terminator = new Terminator();
        terminator.with(settings.delayTime.addObserver(seconds => this.setDelayTime(seconds)));
        terminator.with(settings.feedback.addObserver(gain => this.setFeedback(gain)));
        terminator.with(settings.rate.addObserver(frequency => this.setLfoRate(frequency)));
        terminator.with(settings.depth.addObserver(value => this.setDepth(value)));
        return terminator;
    }
    terminate() {
        super.terminate();
        this.delayNode.disconnect();
        this.feedbackGainNode.disconnect();
        this.lfoNode.disconnect();
        this.depthNode.disconnect();
    }
    setParameterValue(audioParam, value) {
        interpolateParameterValueIfRunning(this.context, audioParam, value);
    }
}
//# sourceMappingURL=composite.js.map