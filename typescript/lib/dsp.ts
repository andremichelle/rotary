export class DSP {
    static midiToHz = (note: number = 60.0, baseFrequency: number = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0)
}

export const pulsarDelay = (context: AudioContext, input: AudioNode, output: AudioNode,
                            delayTimeL: number, delayTimeR: number, delayTime: number,
                            feedback: number, lpf: number, hpf: number) => {
    const preSplitter = context.createChannelSplitter(2)
    const preDelayL = context.createDelay()
    const preDelayR = context.createDelay()
    preDelayL.delayTime.value = delayTimeL
    preDelayR.delayTime.value = delayTimeR
    input.connect(preSplitter)
    preSplitter.connect(preDelayL, 0, 0)
    preSplitter.connect(preDelayR, 1, 0)
    const feedbackMerger = context.createChannelMerger(2)
    preDelayL.connect(feedbackMerger, 0, 1)
    preDelayR.connect(feedbackMerger, 0, 0)
    const feedbackLowpass = context.createBiquadFilter()
    feedbackLowpass.type = "lowpass"
    feedbackLowpass.frequency.value = lpf
    feedbackLowpass.Q.value = -3.0
    const feedbackHighpass = context.createBiquadFilter()
    feedbackHighpass.type = "highpass"
    feedbackHighpass.frequency.value = hpf
    feedbackHighpass.Q.value = -3.0
    const feedbackDelay = context.createDelay()
    feedbackDelay.delayTime.value = delayTime
    const feedbackGain = context.createGain()
    feedbackGain.gain.value = feedback
    const feedbackSplitter = context.createChannelSplitter(2)
    feedbackMerger
        .connect(feedbackLowpass)
        .connect(feedbackHighpass)
        .connect(feedbackGain)
        .connect(feedbackDelay)
        .connect(feedbackSplitter)
    feedbackSplitter.connect(feedbackMerger, 0, 1)
    feedbackSplitter.connect(feedbackMerger, 1, 0)
    feedbackGain.connect(output)
}