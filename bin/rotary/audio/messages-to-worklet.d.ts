export declare type MessageToWorklet = UpdateCursorMessage | FormatUpdatedMessage;
export declare class UpdateCursorMessage {
    readonly phase: number;
    readonly type = "phase";
    constructor(phase: number);
}
export declare class FormatUpdatedMessage {
    readonly version: number;
    readonly type = "format-updated";
    constructor(version: number);
}
