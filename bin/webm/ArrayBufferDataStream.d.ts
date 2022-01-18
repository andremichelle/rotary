export declare class ArrayBufferDataStream {
    readonly length: number;
    private readonly data;
    private pos;
    constructor(length: number);
    seek(toOffset: number): void;
    writeBytes(arr: ArrayLike<any>): void;
    writeByte(b: number): void;
    writeU8: (b: number) => void;
    writeU16BE(u: number): void;
    writeDoubleBE(d: number): void;
    writeFloatBE(d: number): void;
    writeString(s: string): void;
    writeEBMLVarIntWidth(i: number, width: number): void;
    measureEBMLVarInt(val: number): number;
    writeEBMLVarInt(i: number): void;
    writeUnsignedIntBE(u: number, width?: number): void;
    measureUnsignedInt(val: number): number;
    getAsDataArray(): Uint8Array;
}
