export class UpdateFormatMessage {
    constructor(format) {
        this.format = format;
        this.type = 'format';
    }
}
export class UpdateSampleMessage {
    constructor(key, sample) {
        this.key = key;
        this.sample = sample;
        this.type = 'sample';
    }
    static from(key, buffer) {
        const raw = [];
        for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
            buffer.copyFromChannel(raw[channelIndex] =
                new Float32Array(buffer.length), Math.min(channelIndex, buffer.numberOfChannels - 1));
        }
        return new UpdateSampleMessage(key, raw);
    }
}
//# sourceMappingURL=worklet.js.map