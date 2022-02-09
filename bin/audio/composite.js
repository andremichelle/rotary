var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ArrayUtils, BoundNumericValue, NumericStepper, ObservableImpl, ObservableValueImpl, Options, PrintMapping, readAudio, Terminator } from "../lib/common.js";
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
export class CompositeSettings {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
    }
    static from(format) {
        switch (format.class) {
            case PulsarDelaySettings.name:
                return new PulsarDelaySettings().deserialize(format);
            case ConvolverSettings.name:
                return new ConvolverSettings().deserialize(format);
            case FlangerSettings.name:
                return new FlangerSettings().deserialize(format);
        }
        throw new Error("Unknown movement format");
    }
    pack(data) {
        return {
            class: this.constructor.name,
            data: data
        };
    }
    unpack(format) {
        console.assert(this.constructor.name === format.class);
        return format.data;
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false));
        return this.terminator.with(property);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.terminator.terminate();
    }
}
export class DefaultComposite {
    constructor() {
        this.incoming = Options.None;
        this.outgoing = Options.None;
        this.input = null;
        this.output = null;
    }
    setInputOutput(input, output) {
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
export const ConvolverFiles = new Map([
    ["None", null],
    ["Church", "impulse/Church.ogg"],
    ["Deep Space", "impulse/DeepSpace.ogg"],
    ["Hangar", "impulse/Hangar.ogg"],
    ["Large Echo Hall", "impulse/LargeWideEchoHall.ogg"],
    ["Plate Small", "impulse/PlateSmall.ogg"],
    ["Plate Medium", "impulse/PlateMedium.ogg"],
    ["Plate Large", "impulse/PlateLarge.ogg"],
    ["Prime Long", "impulse/PrimeLong.ogg"],
]);
export class ConvolverSettings extends CompositeSettings {
    constructor() {
        super(...arguments);
        this.url = this.bindValue(new ObservableValueImpl(null));
    }
    deserialize(format) {
        this.url.set(super.unpack(format).url);
        return this;
    }
    serialize() {
        return super.pack({ url: this.url.get() });
    }
}
export class Convolver extends DefaultComposite {
    constructor(context, format) {
        super();
        this.context = context;
        this.ready = false;
        this.url = null;
        this.convolverNode = context.createConvolver();
        this.setInputOutput(this.convolverNode, this.convolverNode);
        if (undefined !== format) {
            this.deserialize(format);
        }
    }
    watchSettings(settings) {
        return settings.url.addObserver(url => this.setURL(url), true);
    }
    setURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.ready = false;
                this.convolverNode.buffer = null === url ? null : yield readAudio(this.context, url);
                this.ready = true;
            }
            catch (e) {
                console.warn(e);
            }
        });
    }
    getURL() {
        return this.url;
    }
    isReady() {
        return this.ready;
    }
    deserialize(data) {
        this.ready = false;
        this.setURL(data.url).then(() => this.ready = true);
        return this;
    }
    serialize() {
        return { url: this.getURL() };
    }
}
export class PulsarDelaySettings extends CompositeSettings {
    constructor() {
        super(...arguments);
        this.preDelayTimeL = this.bindValue(new BoundNumericValue(Linear.Identity, 0.125));
        this.preDelayTimeR = this.bindValue(new BoundNumericValue(Linear.Identity, 0.500));
        this.feedbackDelayTime = this.bindValue(new BoundNumericValue(Linear.Identity, 0.250));
        this.feedbackGain = this.bindValue(new BoundNumericValue(Linear.Identity, 0.6));
        this.feedbackLowpass = this.bindValue(new BoundNumericValue(new Linear(20.0, 20000.0), 12000.0));
        this.feedbackHighpass = this.bindValue(new BoundNumericValue(new Linear(20.0, 20000.0), 480.0));
    }
    serialize() {
        return super.pack({
            preDelayTimeL: this.preDelayTimeL.get(),
            preDelayTimeR: this.preDelayTimeR.get(),
            feedbackDelayTime: this.feedbackDelayTime.get(),
            feedbackGain: this.feedbackGain.get(),
            feedbackLowpass: this.feedbackLowpass.get(),
            feedbackHighpass: this.feedbackHighpass.get()
        });
    }
    deserialize(format) {
        const data = super.unpack(format);
        this.preDelayTimeL.set(data.preDelayTimeL);
        this.preDelayTimeR.set(data.preDelayTimeR);
        this.feedbackDelayTime.set(data.feedbackDelayTime);
        this.feedbackGain.set(data.feedbackGain);
        this.feedbackLowpass.set(data.feedbackLowpass);
        this.feedbackHighpass.set(data.feedbackHighpass);
        return this;
    }
}
export class PulsarDelay extends DefaultComposite {
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
        this.setInputOutput(this.preSplitter, this.feedbackGain);
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
        terminator.with(settings.preDelayTimeL.addObserver(seconds => this.setPreDelayTimeL(seconds), true));
        terminator.with(settings.preDelayTimeR.addObserver(seconds => this.setPreDelayTimeR(seconds), true));
        terminator.with(settings.feedbackDelayTime.addObserver(seconds => this.setFeedbackDelayTime(seconds), true));
        terminator.with(settings.feedbackGain.addObserver(gain => this.setFeedbackGain(gain), true));
        terminator.with(settings.feedbackLowpass.addObserver(frequency => this.setFeedbackLowpass(frequency), true));
        terminator.with(settings.feedbackHighpass.addObserver(frequency => this.setFeedbackHighpass(frequency), true));
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
export class FlangerSettings extends CompositeSettings {
    constructor() {
        super(...arguments);
        this.delayTime = this.bindValue(new BoundNumericValue(new Linear(0.005, 0.200), 0.007));
        this.feedback = this.bindValue(new BoundNumericValue(Linear.Identity, 0.9));
        this.rate = this.bindValue(new BoundNumericValue(new Exp(0.01, 10.0), 0.1));
        this.depth = this.bindValue(new BoundNumericValue(Linear.Identity, 0.1));
    }
    deserialize(format) {
        const data = super.unpack(format);
        this.delayTime.set(data.delayTime);
        this.feedback.set(data.feedback);
        this.rate.set(data.rate);
        this.depth.set(data.depth);
        return this;
    }
    serialize() {
        return super.pack({
            delayTime: this.delayTime.get(),
            feedback: this.feedback.get(),
            rate: this.rate.get(),
            depth: this.depth.get()
        });
    }
}
export class Flanger extends DefaultComposite {
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
        this.setInputOutput(this.delayNode, this.feedbackGainNode);
    }
    watchSettings(settings) {
        const terminator = new Terminator();
        terminator.with(settings.delayTime.addObserver(seconds => this.setDelayTime(seconds), true));
        terminator.with(settings.feedback.addObserver(gain => this.setFeedback(gain), true));
        terminator.with(settings.rate.addObserver(frequency => this.setLfoRate(frequency), true));
        terminator.with(settings.depth.addObserver(value => this.setDepth(value), true));
        return terminator;
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
export const CompositeSettingsUIBuilder = new class {
    constructor() {
        this.availableTypes = new Map([
            ["PulsarDelay", PulsarDelaySettings],
            ["Convolver", ConvolverSettings],
            ["Flanger", FlangerSettings]
        ]);
    }
    build(layout, settings) {
        if (settings instanceof PulsarDelaySettings) {
            layout.createNumericStepper("Pre-Delay L", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.preDelayTimeL);
            layout.createNumericStepper("Pre-Delay R", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.preDelayTimeR);
            layout.createNumericStepper("Delay ⟳", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.feedbackDelayTime);
            layout.createNumericStepper("Feedback ⟳", PrintMapping.UnipolarPercent, new NumericStepper(0.001)).with(settings.feedbackGain);
            layout.createNumericStepper("Lowpass ⟳", PrintMapping.integer("Hz"), new NumericStepper(1)).with(settings.feedbackLowpass);
            layout.createNumericStepper("Highpass ⟳", PrintMapping.integer("Hz"), new NumericStepper(1)).with(settings.feedbackHighpass);
        }
        else if (settings instanceof ConvolverSettings) {
            layout.createSelect("Impulse", ConvolverFiles).with(settings.url);
        }
        else if (settings instanceof FlangerSettings) {
            layout.createNumericStepper("delay", PrintMapping.float(3, "", "s"), new NumericStepper(0.001)).with(settings.delayTime);
            layout.createNumericStepper("feedback", PrintMapping.UnipolarPercent, new NumericStepper(0.01)).with(settings.feedback);
            layout.createNumericStepper("rate", PrintMapping.float(2, "", "Hz"), new NumericStepper(0.01)).with(settings.rate);
            layout.createNumericStepper("depth", PrintMapping.UnipolarPercent, new NumericStepper(0.01)).with(settings.depth);
        }
    }
};
//# sourceMappingURL=composite.js.map