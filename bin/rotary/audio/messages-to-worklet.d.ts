export declare type MessageToWorklet = UpdateCursorMessage | FormatUpdatedMessage;
export declare type UpdateCursorMessage = {
    type: "update-cursor";
    position: number;
};
export declare type FormatUpdatedMessage = {
    type: "format-updated";
    version: number;
};
