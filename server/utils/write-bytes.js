import fs from "fs";

/**
 * Запись определённого числа байт в бинарный файл
 * @param {number} fd Дескриптор открытого файла
 * @param {buffer: Buffer<ArrayBuffer>} buffer Буфер для записи
 * @param {number} position Смещение в бинарном файле
 * @param {string} filepath Путь до файла (для логов)
 * @returns {number} Новое смещение в бинарном файле
 */
export function writeBytesToFile(fd, buffer, position, filepath = "") {
    // Проверка на корректность типов
    if (typeof fd !== "number" ||
        typeof position !== "number" ||
        !(buffer instanceof Buffer)) {
        return null;
    }

    const length = buffer.length;

    // Считываем буфер из бинарного файла по определённому смещению и определённой длины
    const bytesWrite = fs.writeSync(fd, buffer, 0, length, position);

    // Проверка на целостность данных
    if (bytesWrite !== length) {
        console.log(`Ошибка: в файл \"${filepath}\" было записано ${bytesRead} байт из ${length}`);
        return null;
    }

    // Изменяем смещение файла (вручную)
    position += bytesWrite;

    return position;
}

/**
 * Конвертация строки в буфер байтов
 * @param {string} data 
 * @returns {Buffer<ArrayBuffer>} Буфер бинарных данных содержащий строку
 */
export function convertStringToBytes(data) {
    if (typeof data !== "string") {
        return "";
    }

    const length = data.length;
    const buffer = Buffer.alloc(length);

    for (let i = 0; i < length; i++) {
        buffer.writeUint8(data.charCodeAt(i), i);
    }

    return buffer;
}

/**
 * Запись строки в бинарный файл
 * @param {number} fd Дескриптор открытого файла
 * @param {string} data Строка, которая должна быть записана в бинарный файл
 * @param {number} position Смещение в бинарном файле
 * @param {string} filepath Путь к файлу (для лога)
 * @returns {number} Новое смещение в бинарном файле
 */
export function writeByteStringToFile(fd, data, position, filepath = "") {
    // Проверка типов аргументов
    if (typeof fd !== "number" ||
        typeof data !== "string" ||
        typeof position !== "number") {
        return null;
    }

    // Определяем размер буфера, который содержит байты характеризующие размер строки
    let length = Uint16Array.BYTES_PER_ELEMENT;

    const bufferLen = Buffer.alloc(length);
    bufferLen.writeUint16BE(data.length);

    let bytesWrite = fs.writeSync(fd, bufferLen, 0, length, position);

    if (bytesWrite !== length) {
        console.log(`Ошибка: в файл \"${filepath}\" было записано ${bytesWrite} байт из ${length}`);
        return null;
    }

    position += bytesWrite;

    length = data.length;

    // Определяем размер буфера для хранения байт строки
    const buffer = convertStringToBytes(data);
    // Запись строки в бинарный файл
    bytesWrite = fs.readSync(fd, buffer, 0, length, position);

    if (bytesWrite !== length) {
        console.log(`Ошибка: в файл \"${filepath}\" было записано ${bytesWrite} байт из ${length}`);
        return null;
    }

    position += bytesWrite;

    return position;
}
