export class Metronome extends AudioWorkletNode {
    constructor(context) {
        super(context, "metronome", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
    }
}
//# sourceMappingURL=Metronome.js.map