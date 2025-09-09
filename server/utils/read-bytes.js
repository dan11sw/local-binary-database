import fs from "fs";

export function readBytesFromFile(fd, position, length, filepath = "") {
    if (typeof fd !== "number" ||
        typeof position !== "number" ||
        typeof length !== "number") {
        return null;
    }

    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, position);

    if (bytesRead !== length) {
        console.log(`Ошибка: в файле \"${filepath}\" было считано ${bytesRead} байт из ${length}`);
        return null;
    }

    position += bytesRead;

    return {
        buffer: buffer,
        new_position: position
    };
}

/**
 * Чтение строки из файла
 * @param {*} fd Дескриптор файла
 * @param {number} position Смещение в файле
 */
export function readByteStringFromFile(fd, position, filepath = "") {
    if (typeof fd !== "number" ||
        typeof position !== "number") {
        return null;
    }

    let length = Uint16Array.BYTES_PER_ELEMENT;
    const bufferLen = Buffer.alloc(length);
    let bytesRead = fs.readSync(fd, bufferLen, 0, length, position);

    if (bytesRead !== length) {
        console.log(`Ошибка: в файле \"${filepath}\" было считано ${bytesRead} байт из ${length}`);
        return null;
    }

    position += bytesRead;

    length = bufferLen.readUint16BE();
    const bufferName = Buffer.alloc(length);
    bytesRead = fs.readSync(fd, bufferName, 0, length, position);

    if (bytesRead !== length) {
        console.log(`Ошибка: в файле \"${filepath}\" было считано ${bytesRead} байт из ${length}`);
        return null;
    }

    position += bytesRead;

    return {
        data: convertBytesToString(bufferName),
        new_position: position
    };
}

/**
 * Получение строки из буфера
 * @param {Buffer} buffer 
 * @returns 
 */
export function convertBytesToString(buffer) {
    if (!(buffer instanceof Buffer)) {
        return "";
    }

    let result = "";
    const length = buffer.length;

    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(buffer.readUint8(i));
    }

    return result;
}

/**
 * 
 * @param {DataView} dataView Экземпляр DataView
 * @param {number} offset Смещение
 * @returns 
 */
export function readStringFromBytes(dataView, offset) {
    if (typeof offset !== "number") {
        return null;
    }

    if (!(dataView instanceof DataView)) {
        return null;
    }

    const length = dataView.getUint16(offset);
    offset += Uint16Array.BYTES_PER_ELEMENT;

    let result = "";
    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(dataView.getUint8(offset + i));
    }

    return {
        data: result,
        new_offset: (offset + length)
    };
}