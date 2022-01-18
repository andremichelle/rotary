"use strict";
let BlobBuffer = function (fs) {
    return function (destination) {
        let buffer = [], writePromise = Promise.resolve(), fileWriter = null, fd = null;
        if (destination && destination.constructor.name === "FileWriter") {
            fileWriter = destination;
        }
        else if (fs && destination) {
            fd = destination;
        }
        this.pos = 0;
        this.length = 0;
        function readBlobAsBuffer(blob) {
            return new Promise(function (resolve, reject) {
                let reader = new FileReader();
                reader.addEventListener("loadend", function () {
                    resolve(reader.result);
                });
                reader.readAsArrayBuffer(blob);
            });
        }
        function convertToUint8Array(thing) {
            return new Promise(function (resolve, reject) {
                if (thing instanceof Uint8Array) {
                    resolve(thing);
                }
                else if (thing instanceof ArrayBuffer || ArrayBuffer.isView(thing)) {
                    resolve(new Uint8Array(thing));
                }
                else if (thing instanceof Blob) {
                    resolve(readBlobAsBuffer(thing).then(function (buffer) {
                        return new Uint8Array(buffer);
                    }));
                }
                else {
                    resolve(readBlobAsBuffer(new Blob([thing])).then(function (buffer) {
                        return new Uint8Array(buffer);
                    }));
                }
            });
        }
        function measureData(data) {
            let result = data.byteLength || data.length || data.size;
            if (!Number.isInteger(result)) {
                throw new Error("Failed to determine size of element");
            }
            return result;
        }
        this.seek = function (offset) {
            if (offset < 0) {
                throw new Error("Offset may not be negative");
            }
            if (isNaN(offset)) {
                throw new Error("Offset may not be NaN");
            }
            if (offset > this.length) {
                throw new Error("Seeking beyond the end of file is not allowed");
            }
            this.pos = offset;
        };
        this.write = function (data) {
            let newEntry = {
                offset: this.pos,
                data: data,
                length: measureData(data)
            }, isAppend = newEntry.offset >= this.length;
            this.pos += newEntry.length;
            this.length = Math.max(this.length, this.pos);
            writePromise = writePromise.then(function () {
                if (fd) {
                    return new Promise(function (resolve, reject) {
                        convertToUint8Array(newEntry.data).then(function (dataArray) {
                            let totalWritten = 0, buffer = Buffer.from(dataArray.buffer), handleWriteComplete = function (err, written, buffer) {
                                totalWritten += written;
                                if (totalWritten >= buffer.length) {
                                    resolve();
                                }
                                else {
                                    fs.write(fd, buffer, totalWritten, buffer.length - totalWritten, newEntry.offset + totalWritten, handleWriteComplete);
                                }
                            };
                            fs.write(fd, buffer, 0, buffer.length, newEntry.offset, handleWriteComplete);
                        });
                    });
                }
                else if (fileWriter) {
                    return new Promise(function (resolve, reject) {
                        fileWriter.onwriteend = resolve;
                        fileWriter.seek(newEntry.offset);
                        fileWriter.write(new Blob([newEntry.data]));
                    });
                }
                else if (!isAppend) {
                    for (let i = 0; i < buffer.length; i++) {
                        let entry = buffer[i];
                        if (!(newEntry.offset + newEntry.length <= entry.offset || newEntry.offset >= entry.offset + entry.length)) {
                            if (newEntry.offset < entry.offset || newEntry.offset + newEntry.length > entry.offset + entry.length) {
                                throw new Error("Overwrite crosses blob boundaries");
                            }
                            if (newEntry.offset == entry.offset && newEntry.length == entry.length) {
                                entry.data = newEntry.data;
                                return;
                            }
                            else {
                                return convertToUint8Array(entry.data)
                                    .then(function (entryArray) {
                                    entry.data = entryArray;
                                    return convertToUint8Array(newEntry.data);
                                }).then(function (newEntryArray) {
                                    newEntry.data = newEntryArray;
                                    entry.data.set(newEntry.data, newEntry.offset - entry.offset);
                                });
                            }
                        }
                    }
                }
                buffer.push(newEntry);
            });
        };
        this.complete = function (mimeType) {
            if (fd || fileWriter) {
                writePromise = writePromise.then(function () {
                    return null;
                });
            }
            else {
                writePromise = writePromise.then(function () {
                    let result = [];
                    for (let i = 0; i < buffer.length; i++) {
                        result.push(buffer[i].data);
                    }
                    return new Blob(result, { type: mimeType });
                });
            }
            return writePromise;
        };
    };
};
//# sourceMappingURL=BlobBuffer.js.map