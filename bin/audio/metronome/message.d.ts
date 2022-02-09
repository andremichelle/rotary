export declare type Message = SetBpm | SetEnabled;
export declare class SetBpm {
    readonly value: number;
    readonly type = "bpm";
    constructor(value: number);
}
export declare class SetEnabled {
    readonly value: boolean;
    readonly type = "enabled";
    constructor(value: boolean);
}
