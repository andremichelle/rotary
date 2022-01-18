export class ArrayBufferDataStream {
    constructor(length) {
        this.length = length;
        this.pos = 0 | 0;
        this.writeU8 = this.writeByte;
        this.data = new Uint8Array(length);
    }
    seek(toOffset) {
        this.pos = toOffset;
    }
    writeBytes(arr) {
        for (let i = 0; i < arr.length; i++) {
            this.data[this.pos++] = arr[i];
        }
    }
    writeByte(b) {
        this.data[this.pos++] = b;
    }
    writeU16BE(u) {
        this.data[this.pos++] = u >> 8;
        this.data[this.pos++] = u;
    }
    writeDoubleBE(d) {
        const bytes = new Uint8Array(new Float64Array([d]).buffer);
        for (let i = bytes.length - 1; i >= 0; i--) {
            this.writeByte(bytes[i]);
        }
    }
    writeFloatBE(d) {
        const bytes = new Uint8Array(new Float32Array([d]).buffer);
        for (let i = bytes.length - 1; i >= 0; i--) {
            this.writeByte(bytes[i]);
        }
    }
    writeString(s) {
        for (let i = 0; i < s.length; i++) {
            this.data[this.pos++] = s.charCodeAt(i);
        }
    }
    writeEBMLVarIntWidth(i, width) {
        switch (width) {
            case 1:
                this.writeU8((1 << 7) | i);
                break;
            case 2:
                this.writeU8((1 << 6) | (i >> 8));
                this.writeU8(i);
                break;
            case 3:
                this.writeU8((1 << 5) | (i >> 16));
                this.writeU8(i >> 8);
                this.writeU8(i);
                break;
            case 4:
                this.writeU8((1 << 4) | (i >> 24));
                this.writeU8(i >> 16);
                this.writeU8(i >> 8);
                this.writeU8(i);
                break;
            case 5:
                this.writeU8((1 << 3) | ((i / 4294967296) & 0x7));
                this.writeU8(i >> 24);
                this.writeU8(i >> 16);
                this.writeU8(i >> 8);
                this.writeU8(i);
                break;
            default:
                throw new Error("Bad EBML VINT size " + width);
        }
    }
    measureEBMLVarInt(val) {
        if (val < (1 << 7) - 1) {
            return 1;
        }
        else if (val < (1 << 14) - 1) {
            return 2;
        }
        else if (val < (1 << 21) - 1) {
            return 3;
        }
        else if (val < (1 << 28) - 1) {
            return 4;
        }
        else if (val < 34359738367) {
            return 5;
        }
        else {
            throw new Error("EBML VINT size not supported " + val);
        }
    }
    writeEBMLVarInt(i) {
        this.writeEBMLVarIntWidth(i, this.measureEBMLVarInt(i));
    }
    writeUnsignedIntBE(u, width) {
        if (width === undefined) {
            width = this.measureUnsignedInt(u);
        }
        switch (width) {
            case 5:
                this.writeU8(Math.floor(u / 4294967296));
            case 4:
                this.writeU8(u >> 24);
            case 3:
                this.writeU8(u >> 16);
            case 2:
                this.writeU8(u >> 8);
            case 1:
                this.writeU8(u);
                break;
            default:
                throw new Error("Bad UINT size " + width);
        }
    }
    measureUnsignedInt(val) {
        if (val < (1 << 8)) {
            return 1;
        }
        else if (val < (1 << 16)) {
            return 2;
        }
        else if (val < (1 << 24)) {
            return 3;
        }
        else if (val < 4294967296) {
            return 4;
        }
        else {
            return 5;
        }
    }
    getAsDataArray() {
        if (this.pos < this.data.byteLength) {
            return this.data.subarray(0, this.pos);
        }
        else if (this.pos == this.data.byteLength) {
            return this.data;
        }
        else {
            throw new Error("ArrayBufferDataStream's pos lies beyond end of buffer");
        }
    }
}
//# sourceMappingURL=ArrayBufferDataStream.js.map