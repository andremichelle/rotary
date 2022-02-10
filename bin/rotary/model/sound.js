import { Settings } from "../../lib/common.js";
export class SoundSettings extends Settings {
    static from(format) {
        switch (format.class) {
            case SamplePlayerSettings.name:
                return new SamplePlayerSettings().deserialize(format);
            case OscillatorSettings.name:
                return new OscillatorSettings().deserialize(format);
        }
        throw new Error("Unknown format");
    }
}
export class SamplePlayerSettings extends SoundSettings {
    deserialize(format) {
        super.unpack(format);
        return this;
    }
    serialize() {
        return super.pack({});
    }
}
export class OscillatorSettings extends SoundSettings {
    deserialize(format) {
        super.unpack(format);
        return this;
    }
    serialize() {
        return super.pack({});
    }
}
//# sourceMappingURL=sound.js.map