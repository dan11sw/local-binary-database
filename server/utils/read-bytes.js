import fs from "fs";

/**
 * Чтение определённого числа байт из бинарного файла
 * @param {number} fd Дескриптор открытого файла
 * @param {number} position Смещение в бинарном файле
 * @param {number} length Длина байт, которые нужно считать из файла
 * @param {string} filepath Путь до файла (для логов)
 * @returns {{buffer: Buffer<ArrayBuffer>, new_position: number}} Результат
 */
export function readBytesFromFile(fd, position, length, filepath = "") {
    // Проверка на корректность типов
    if (typeof fd !== "number" ||
        typeof position !== "number" ||
        typeof length !== "number") {
        return null;
    }

    // Определяем буфер размера length
    const buffer = Buffer.alloc(length);
    // Считываем буфер из бинарного файла по определённому смещению и определённой длины
    const bytesRead = fs.readSync(fd, buffer, 0, length, position);

    // Проверка на целостность данных
    if (bytesRead !== length) {
        console.log(`Ошибка: в файле \"${filepath}\" было считано ${bytesRead} байт из ${length}`);
        return null;
    }

    // Изменяем смещение файла (вручную)
    position += bytesRead;

    return {
        buffer: buffer,
        new_position: position
    };
}

/**
 * Чтение строки из бинарного файла
 * @param {number} fd Дескриптор открытого файла
 * @param {number} position Смещение в бинарном файле
 * @param {string} filepath Путь к файлу (для лога)
 * @returns {{data: string, new_position: number} | null} Результат
 */
export function readByteStringFromFile(fd, position, filepath = "") {
    // Проверка типов аргументов
    if (typeof fd !== "number" ||
        typeof position !== "number") {
        return null;
    }

    // Определяем размер буфера, который содержит байты характеризующие размер строки
    let length = Uint16Array.BYTES_PER_ELEMENT;

    const bufferLen = Buffer.alloc(length);
    let bytesRead = fs.readSync(fd, bufferLen, 0, length, position);

    if (bytesRead !== length) {
        console.log(`Ошибка: в файле \"${filepath}\" было считано ${bytesRead} байт из ${length}`);
        return null;
    }

    position += bytesRead;

    length = bufferLen.readUint16BE();
    
    // Определяем размер буфера для хранения байт строки
    const buffer = Buffer.alloc(length);
    // Чтение строки из бинарного файла с определённой размерностью
    bytesRead = fs.readSync(fd, buffer, 0, length, position);

    if (bytesRead !== length) {
        console.log(`Ошибка: в файле \"${filepath}\" было считано ${bytesRead} байт из ${length}`);
        return null;
    }

    position += bytesRead;

    return {
        data: convertBytesToString(buffer), // Перед возвращением результата конвертируем байты в строку
        new_position: position
    };
}

/**
 * Конвертация буфера байтов в строку
 * @param {Buffer} buffer 
 * @returns {string} Результирующая строка
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
 * Чтение строки из DataView (представления данных относительно буфера)
 * @param {DataView} dataView Экземпляр DataView
 * @param {number} offset Смещение бинарного файла
 * @returns {{data: string, new_offset: number} | null} Результат
 */
export function readStringFromBytes(dataView, offset) {
    if ((typeof offset !== "number") || (!(dataView instanceof DataView))) {
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