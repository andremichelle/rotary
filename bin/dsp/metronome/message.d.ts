export declare type Message = SetBpm;
export declare class SetBpm {
    readonly value: number;
    readonly type = "bpm";
    constructor(value: number);
}
