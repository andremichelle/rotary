export class DSP {
}
DSP.midiToHz = (note = 60.0, baseFrequency = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0);
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
    input.connect(output);
    feedbackGain.connect(output);
};
//# sourceMappingURL=dsp.js.map