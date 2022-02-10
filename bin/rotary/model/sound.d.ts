import { Settings, SettingsFormat } from "../../lib/common.js";
export declare type SoundType = {
    new (): SoundSettings<any>;
};
export declare type SoundSettingsData = SamplePlayerData | OscillatorData;
export declare interface SamplePlayerData {
}
export declare interface OscillatorData {
}
export declare abstract class SoundSettings<DATA extends SoundSettingsData> extends Settings<DATA> {
    static from(format: SettingsFormat<any>): Settings<any>;
}
export declare class SamplePlayerSettings extends SoundSettings<SamplePlayerData> {
    deserialize(format: SettingsFormat<SamplePlayerData>): SamplePlayerSettings;
    serialize(): SettingsFormat<SamplePlayerData>;
}
export declare class OscillatorSettings extends SoundSettings<OscillatorData> {
    deserialize(format: SettingsFormat<OscillatorData>): OscillatorSettings;
    serialize(): SettingsFormat<OscillatorData>;
}
