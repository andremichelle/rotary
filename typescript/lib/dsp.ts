// TODO Advance or give up

export const pulsarDelay = (context: BaseAudioContext, input: AudioNode, output: AudioNode,
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

export const cycle = async (sampleRate: number, frequency: number): Promise<AudioBuffer> => {
    const context = new OfflineAudioContext(1, Math.floor(sampleRate / frequency), sampleRate)
    const oscillator = context.createOscillator()
    oscillator.frequency.value = frequency
    oscillator.start(0.0)
    oscillator.connect(context.destination)
    return context.startRendering()
}

export const beep = async (sampleRate: number, frequency: number, duration: number = 20.0): Promise<AudioBuffer> => {
    const context = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate)
    const fadeTime = 0.010
    const oscillator = context.createOscillator()
    oscillator.frequency.value = frequency
    oscillator.start()
    const gainNode = context.createGain()
    gainNode.gain.value = 0.0
    gainNode.gain.setValueAtTime(0.0, 0.0)
    gainNode.gain.linearRampToValueAtTime(0.5, fadeTime)
    gainNode.gain.setValueAtTime(0.5, duration - fadeTime)
    gainNode.gain.linearRampToValueAtTime(0.0, duration)
    oscillator.connect(gainNode).connect(context.destination)
    return context.startRendering()
}