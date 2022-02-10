import {Settings, SettingsFormat} from "../../lib/common.js"

export type SoundType = { new(): SoundSettings<any> }

export type SoundSettingsData = SamplePlayerData | OscillatorData

export declare interface SamplePlayerData {
    // TODO
}

export declare interface OscillatorData {
    // TODO
}

export abstract class SoundSettings<DATA extends SoundSettingsData> extends Settings<DATA> {
    static from(format: SettingsFormat<any>): Settings<any> {
        switch (format.class) {
            case SamplePlayerSettings.name:
                return new SamplePlayerSettings().deserialize(format)
            case OscillatorSettings.name:
                return new OscillatorSettings().deserialize(format)
        }
        throw new Error("Unknown format")
    }
}

export class SamplePlayerSettings extends SoundSettings<SamplePlayerData> {
    deserialize(format: SettingsFormat<SamplePlayerData>): SamplePlayerSettings {
        super.unpack(format)
        return this
    }

    serialize(): SettingsFormat<SamplePlayerData> {
        return super.pack({})
    }
}

export class OscillatorSettings extends SoundSettings<OscillatorData> {
    deserialize(format: SettingsFormat<OscillatorData>): OscillatorSettings {
        super.unpack(format)
        return this
    }

    serialize(): SettingsFormat<OscillatorData> {
        return super.pack({})
    }
}