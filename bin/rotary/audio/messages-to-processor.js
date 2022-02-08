export class UpdateFormatMessage {
    constructor(format, version) {
        this.format = format;
        this.version = version;
        this.type = 'format';
    }
}
export class UploadSampleMessage {
    constructor(key, sample, loop) {
        this.key = key;
        this.sample = sample;
        this.loop = loop;
        this.type = 'sample';
    }
    static from(key, buffer, loop) {
        const raw = [];
        for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
            buffer.copyFromChannel(raw[channelIndex] =
                new Float32Array(buffer.length), Math.min(channelIndex, buffer.numberOfChannels - 1));
        }
        return new UploadSampleMessage(key, raw, loop);
    }
}
//# sourceMappingURL=messages-to-processor.js.map