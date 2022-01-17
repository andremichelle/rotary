export class UpdateFormatMessage {
    constructor(format) {
        this.format = format;
        this.type = 'format';
    }
}
export class UpdateLoopDurationMessage {
    constructor(seconds) {
        this.seconds = seconds;
        this.type = 'loop-duration';
    }
}
export class UpdateSampleMessage {
    constructor(sample) {
        this.sample = sample;
        this.type = 'sample';
    }
    static from(buffer) {
        const raw = [];
        for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex++) {
            buffer.copyFromChannel(raw[channelIndex] = new Float32Array(buffer.length), channelIndex);
        }
        return new UpdateSampleMessage(raw);
    }
}
//# sourceMappingURL=messages.js.map