import { Buffer } from "node:buffer";
import fs from "fs";

import { readBytesFromFile, readByteStringFromFile, readStringFromBytes } from "../utils/read-bytes.js";
import { isUndefinedOrNull } from "../utils/objector.js";

export default class ServerIndexModel {
    #id;           // uint32 - Идентификатор записи
    #file_position;       // uint32 - Смещение в файле бинарных данных

    /**
     * Конструктор модели сервера
     * @param {number} id Идентификатор сервера
     * @param {number} file_position Смещение в файле бинарных данных
     */
    constructor(id, file_position) {
        this.#id = id ?? 0;
        this.#file_position = file_position ?? 0;
    }

    /**
     * Вычисление байт, необходимых для формирования буфера для записи в бинарный файл
     * @param {string} encoding Кодировка
     * @returns {number} Размер буфера для представления модели
     */
    calcBytes(encoding = "utf-8") {
        return 2 * Uint32Array.BYTES_PER_ELEMENT;
    }

    /**
     * Формирование буфера
     * @returns {Buffer<ArrayBuffer>} Буфер
     */
    packageMsg() {
        // Выделяем память под буфер
        let buffer = Buffer.alloc(this.calcBytes());
        let offset = 0;

        // Записываем идентификатор и смещение
        offset = buffer.writeUInt32BE(this.#id, 0);
        offset = buffer.writeUint32BE(this.#file_position, offset);

        return buffer;
    }

    /**
     * Загрузка данных для текущего экземпляра модели из буфера
     * @param {Buffer<ArrayBuffer>} buffer Буфер
     * @returns {boolean} Результат загрузки данных из буфера
     */
    loadFromMsg(buffer) {
        if (!(buffer instanceof Buffer)) {
            return false;
        }

        // Создаём интерфейс для чтения данных из буфера байт
        const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        let offset = 0;

        const id = dataView.getUint32(0);
        offset += Uint32Array.BYTES_PER_ELEMENT;

        const file_position = dataView.getUint32(offset);
        offset += Uint32Array.BYTES_PER_ELEMENT;

        // Присвоение свойствам текущего объекта определённых данных
        this.#id = id;
        this.#file_position = file_position;

        return true;
    }

    /**
     * Чтение текущей структуры данных из файла
     * @param {number} fd Дескриптор файла
     * @param {number} position Текущее смещение файла
     * @param {string} filepath Путь до файла
     * @returns {number | null} Результирующее смещение в файле
     */
    loadFromFile(fd, position = 0, filepath = "") {
        if (typeof fd !== "number" || typeof position !== "number" || fd <= 0) {
            return null;
        }

        try {
            const arrayBuffer = readBytesFromFile(fd, position, this.calcBytes(), filepath);
            if (isUndefinedOrNull(buffer)) {
                return null;
            }

            const dataView = new DataView(arrayBuffer.buffer, arrayBuffer.buffer.byteOffset, arrayBuffer.buffer.byteLength);
            let offset = 0;

            const id = dataView.getUint32(0);
            offset += Uint32Array.BYTES_PER_ELEMENT;

            const file_position= dataView.getUint32(offset);
            offset += Uint32Array.BYTES_PER_ELEMENT;

            // Присвоение свойствам текущего объекта определённых данных
            this.#id = id;
            this.#file_position = file_position;

            return (position + offset);
        } catch (e) {
            console.log("Ошибка: ", e);
        }

        return null;
    }

    get id() {
        return this.#id;
    }

    get file_position() {
        return this.#file_position;
    }

    print() {
        console.log();
        console.log("---------------------");
        console.log("ID: ", this.#id);
        console.log("File position: ", this.#file_position);
        console.log("---------------------");
    }
};