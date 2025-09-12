import { Buffer } from "node:buffer";
import fs from "fs";

import Status from "../constants/status.js";
import { readBytesFromFile, readByteStringFromFile, readStringFromBytes } from "../utils/read-bytes.js";
import { isUndefinedOrNull } from "../utils/objector.js";

export default class ServerModel {
    #id;           // uint32          - Идентификатор записи
    #title;        // uint16 + bytes  - Название сервера
    #ip_address;   // uint16 + bytes  - IP-адрес сервера
    #location;     // uint16 + bytes  - Местоположение сервера
    #status;       // uint8           - Статус
    #capture_time; // uint16_t        - Время, которое сервер будет тратить на выполнение задач (в миллисекундах)
    #created_at;   // uint64          - Время создания записи (в Unixtime)
    #updated_at;   // uint64          - Время обновления записи (в Unixtime)

    /**
     * Конструктор модели сервера
     * @param {number} id Идентификатор сервера
     * @param {string} title Название сервера
     * @param {string} ip_address IP-адрес сервера
     * @param {string} location Местоположение сервера
     * @param {number} capture_time Время, которое сервер будет тратить на выполнение задачи (в мс)
     */
    constructor(id, title, ip_address, location, capture_time = 10000) {
        this.#id = id ?? 0;
        this.#title = title ?? "";
        this.#ip_address = ip_address ?? "127.0.0.1";
        this.#location = location ?? "";
        this.#capture_time = capture_time;

        // Сервер изначально остановлен (их нужно запускать)
        this.#status = Status.STOPPED;

        // Обновляем 
        const timeNow = Date.now();
        this.#created_at = timeNow;
        this.#updated_at = timeNow;
    }

    /**
     * Вычисление байт, необходимых для формирования буфера для записи в бинарный файл
     * @param {string} encoding Кодировка
     * @returns {number} Размер буфера для представления модели
     */
    calcBytes(encoding = "utf-8") {
        const calc = Uint32Array.BYTES_PER_ELEMENT
            + Uint16Array.BYTES_PER_ELEMENT + Buffer.from(this.#title, encoding).length
            + Uint16Array.BYTES_PER_ELEMENT + Buffer.from(this.#ip_address, encoding).length
            + Uint16Array.BYTES_PER_ELEMENT + Buffer.from(this.#location, encoding).length
            + Uint8Array.BYTES_PER_ELEMENT + 2 * BigUint64Array.BYTES_PER_ELEMENT
            + Uint16Array.BYTES_PER_ELEMENT;

        return calc;
    }

    /**
     * Формирование буфера
     * @returns {Buffer<ArrayBuffer>} Буфер, содержащий бинарные данные текущего экземпляра модели
     */
    packageMsg() {
        // Выделяем память под буфер
        let buffer = Buffer.alloc(this.calcBytes());
        let offset = 0;

        // Записываем идентификатор
        offset = buffer.writeUInt32BE(this.#id, 0);

        // Формируем двоичные буферы на основе строк в кодировке UTF-8
        const bufferName = Buffer.from(this.#title, "utf-8");
        const bufferIp = Buffer.from(this.#ip_address, "utf-8");
        const bufferLocation = Buffer.from(this.#location, "utf-8");

        // Записываем строку name в буфер
        offset = buffer.writeUint16BE(this.#title.length, offset);
        // offset += buffer.write(this.#name, offset, "utf-8"); // -> эквивалентно копированию
        bufferName.copy(buffer, offset, 0, buffer.length);
        offset += bufferName.length;

        // Записываем строку ip в буфер
        offset = buffer.writeUint16BE(this.#ip_address.length, offset);
        // offset += buffer.write(this.#ip, offset, "utf-8");
        bufferIp.copy(buffer, offset, 0, buffer.length);
        offset += bufferIp.length;

        // Записываем строку location в буфер
        offset = buffer.writeUint16BE(this.#location.length, offset);
        // offset += buffer.write(this.#location, offset, "utf-8");
        bufferLocation.copy(buffer, offset, 0, buffer.length);
        offset += bufferLocation.length;

        // Записываем статус в буфер
        offset += buffer.writeUint8(this.#status, offset);

        // Записываем время выполнение задачи сервером в буфер
        offset += buffer.writeUint16BE(this.#capture_time, offset);

        // Записываем время создания и время обновления записи
        offset += buffer.writeBigUint64BE(this.#created_at, offset);
        offset += buffer.writeBigUInt64BE(this.#updated_at, offset);

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

        // Чтение атрибута name
        const readName = readStringFromBytes(dataView, offset);
        if (isUndefinedOrNull(readName)) {
            return false;
        }

        offset = readName.new_offset;

        // Чтение атрибута ip
        const readIP = readStringFromBytes(dataView, offset);
        if (isUndefinedOrNull(readIP)) {
            return false;
        }

        offset = readIP.new_offset;

        // Чтение атрибута location
        const readLocation = readStringFromBytes(dataView, offset);
        if (isUndefinedOrNull(readLocation)) {
            return false;
        }

        offset = readLocation.new_offset;

        // Чтение статуса
        const status = dataView.getUint8(offset);
        offset += Uint8Array.BYTES_PER_ELEMENT;

        // Чтение времени работы сервера
        const capture_time = dataView.getUint16(offset);
        offset += Uint16Array.BYTES_PER_ELEMENT;

        // Чтение времени создания записи
        const created_at = dataView.getBigUint64(offset);
        offset += BigUint64Array.BYTES_PER_ELEMENT;

        // Чтение времени обновления записи
        const updated_at = dataView.getBigUint64(offset);
        offset += BigUint64Array.BYTES_PER_ELEMENT;

        // Присвоение свойствам текущего объекта определённых данных
        this.#id = id;
        this.#title = readName.data;
        this.#ip_address = readIP.data;
        this.#location = readLocation.data;
        this.#status = status;
        this.#capture_time = capture_time;
        this.#created_at = created_at;
        this.#updated_at = updated_at;

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
            const readId = readBytesFromFile(fd, position, Uint32Array.BYTES_PER_ELEMENT, filepath);
            if (isUndefinedOrNull(readId)) {
                return null;
            }

            position = readId.new_position;

            // Чтение названия сервера
            const readName = readByteStringFromFile(fd, position);
            if (isUndefinedOrNull(readName)) {
                return null;
            }

            position = readName.new_position;

            // Чтение IP-адреса сервера
            const readIP = readByteStringFromFile(fd, position);
            if (isUndefinedOrNull(readIP)) {
                return null;
            }

            position = readIP.new_position;

            // Чтение локации сервера
            const readLocation = readByteStringFromFile(fd, position);
            if (isUndefinedOrNull(readLocation)) {
                return null;
            }

            position = readLocation.new_position;

            const bytes = Uint8Array.BYTES_PER_ELEMENT + 2 * BigUint64Array.BYTES_PER_ELEMENT
                + Uint16Array.BYTES_PER_ELEMENT;

            const readBuffer = readBytesFromFile(fd, position, bytes, filepath);
            if (isUndefinedOrNull(readBuffer)) {
                return null;
            }

            let offset = 0;
            const dataView = new DataView(readBuffer.buffer, readBuffer.buffer.byteOffset, readBuffer.buffer.byteLength);

            const status = dataView.getUint8(offset);
            offset += Uint8Array.BYTES_PER_ELEMENT;

            const capture_time = dataView.getUint16(offset);
            offset += Uint16Array.BYTES_PER_ELEMENT;

            const created_at = dataView.getBigUint64(offset);
            offset += BigUint64Array.BYTES_PER_ELEMENT;

            const updated_at = dataView.getBigUint64(offset);
            offset += BigUint64Array.BYTES_PER_ELEMENT;

            this.#id = readId.buffer.readUint32BE();
            this.#title = readName.data;
            this.#ip_address = readIP.data;
            this.#location = readLocation.data;
            this.#status = status;
            this.#capture_time = capture_time;
            this.#created_at = created_at;
            this.#updated_at = updated_at;

            return position;
        } catch (e) {
            console.log("Ошибка: ", e);
        }

        return null;
    }

    get id() {
        return this.#id;
    }

    get ip_address() {
        return this.#ip_address;
    }

    get title() {
        return this.#title;
    }

    get location() {
        return this.#location;
    }

    get status() {
        return this.#status;
    }

    get capture_time() {
        return this.#capture_time;
    }

    get created_at() {
        return this.#created_at;
    }

    get updated_at() {
        return this.#updated_at;
    }

    print() {
        console.log();
        console.log("---------------------");
        console.log("ID: ", this.#id);
        console.log("Title: ", this.#title);
        console.log("IP Address: ", this.#ip_address);
        console.log("Location: ", this.#location);
        console.log("Status: ", this.#status);
        console.log("Capture Time: ", this.#capture_time);
        console.log("Created At: ", this.#created_at);
        console.log("Updated At: ", this.#updated_at);
        console.log("---------------------");
    }
};