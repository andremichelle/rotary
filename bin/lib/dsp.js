var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const pulsarDelay = (context, input, output, delayTimeL, delayTimeR, delayTime, feedback, lpf, hpf) => {
    const preSplitter = context.createChannelSplitter(2);
    const preDelayL = context.createDelay();
    const preDelayR = context.createDelay();
    preDelayL.delayTime.value = delayTimeL;
    preDelayR.delayTime.value = delayTimeR;
    input.connect(preSplitter);
    preSplitter.connect(preDelayL, 0, 0);
    preSplitter.connect(preDelayR, 1, 0);
    const feedbackMerger = context.createChannelMerger(2);
    preDelayL.connect(feedbackMerger, 0, 1);
    preDelayR.connect(feedbackMerger, 0, 0);
    const feedbackLowpass = context.createBiquadFilter();
    feedbackLowpass.type = "lowpass";
    feedbackLowpass.frequency.value = lpf;
    feedbackLowpass.Q.value = -3.0;
    const feedbackHighpass = context.createBiquadFilter();
    feedbackHighpass.type = "highpass";
    feedbackHighpass.frequency.value = hpf;
    feedbackHighpass.Q.value = -3.0;
    const feedbackDelay = context.createDelay();
    feedbackDelay.delayTime.value = delayTime;
    const feedbackGain = context.createGain();
    feedbackGain.gain.value = feedback;
    const feedbackSplitter = context.createChannelSplitter(2);
    feedbackMerger
        .connect(feedbackLowpass)
        .connect(feedbackHighpass)
        .connect(feedbackGain)
        .connect(feedbackDelay)
        .connect(feedbackSplitter);
    feedbackSplitter.connect(feedbackMerger, 0, 1);
    feedbackSplitter.connect(feedbackMerger, 1, 0);
    feedbackGain.connect(output);
};
export const beep = (sampleRate, frequency, duration = 20.0) => __awaiter(void 0, void 0, void 0, function* () {
    const context = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate);
    const fadeTime = 0.010;
    const oscillator = context.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.start();
    const gainNode = context.createGain();
    gainNode.gain.value = 0.0;
    gainNode.gain.setValueAtTime(0.0, 0.0);
    gainNode.gain.linearRampToValueAtTime(0.5, fadeTime);
    gainNode.gain.setValueAtTime(0.5, duration - fadeTime);
    gainNode.gain.linearRampToValueAtTime(0.0, duration);
    oscillator.connect(gainNode).connect(context.destination);
    return context.startRendering();
});
//# sourceMappingURL=dsp.js.map