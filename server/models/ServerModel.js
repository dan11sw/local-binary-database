import { Buffer } from "node:buffer";
import fs from "fs";

import { convertBytesToString, readBytesFromFile, readByteStringFromFile, readStringFromBytes } from "../utils/read-bytes.js";
import { isUndefinedOrNull } from "../utils/objector.js";


const DefaultIP = "127.0.0.1";
export default class ServerModel {
    #id;        // uint32
    #name;      // uint16 + bytes
    #ip;        // uint16 + bytes
    #location;  // uint16 + bytes

    /**
     * Конструктор модели сервера
     * @param {number} id 
     * @param {string} name 
     * @param {string} ip 
     * @param {string} location 
     */
    constructor(id, name, ip, location) {
        this.#id = id ?? 0;
        this.#name = name ?? "";
        this.#ip = ip ?? DefaultIP;
        this.#location = location ?? "";
    }

    #calcBytes(encoding = "utf-8") {
        const calc = Uint32Array.BYTES_PER_ELEMENT                                          // uint32
            + Uint16Array.BYTES_PER_ELEMENT + Buffer.from(this.#name, encoding).length      // uint16 + bytes
            + Uint16Array.BYTES_PER_ELEMENT + Buffer.from(this.#ip, encoding).length        // uint16 + bytes
            + Uint16Array.BYTES_PER_ELEMENT + Buffer.from(this.#location, encoding).length; // uint16 + bytes

        return calc;
    }

    packageMsg() {
        // Выделяем память под буфер
        let buffer = Buffer.alloc(this.#calcBytes());
        let offset = 0;

        // Записываем идентификатор
        offset = buffer.writeUInt32BE(this.#id, 0);

        // Формируем двоичные буферы на основе строк в кодировке UTF-8
        const bufferName = Buffer.from(this.#name, "utf-8");
        const bufferIp = Buffer.from(this.#ip, "utf-8");
        const bufferLocation = Buffer.from(this.#location, "utf-8");

        // Записываем строку name в буфер
        offset = buffer.writeUint16BE(this.#name.length, offset);
        // offset += buffer.write(this.#name, offset, "utf-8"); // -> эквивалентно копированию
        bufferName.copy(buffer, offset, 0, buffer.length);
        offset += bufferName.length;

        // Записываем строку ip в буфер
        offset = buffer.writeUint16BE(this.#ip.length, offset);
        // offset += buffer.write(this.#ip, offset, "utf-8");
        bufferIp.copy(buffer, offset, 0, buffer.length);
        offset += bufferIp.length;

        // Записываем строку location в буфер
        offset = buffer.writeUint16BE(this.#location.length, offset);
        // offset += buffer.write(this.#location, offset, "utf-8");
        bufferLocation.copy(buffer, offset, 0, buffer.length);
        offset += bufferLocation.length;

        return buffer;
    }

    loadFromMsg(buffer) {
        if (!(buffer instanceof Buffer)) {
            return;
        }

        // Создаём интерфейс для чтения данных из буфера байт
        const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        let offset = 0;

        const id = dataView.getUint32(0);
        offset += Uint32Array.BYTES_PER_ELEMENT;

        // Чтение атрибута name
        const readName = readStringFromBytes(dataView, offset);
        if (isUndefinedOrNull(readName)) {
            return;
        }

        offset = readName.new_offset;

        // Чтение атрибута ip
        const readIP = readStringFromBytes(dataView, offset);
        if (isUndefinedOrNull(readIP)) {
            return;
        }

        offset = readIP.new_offset;

        // Чтение атрибута location
        const readLocation = readStringFromBytes(dataView, offset);
        if (isUndefinedOrNull(readLocation)) {
            return;
        }

        offset = readLocation.new_offset;

        // Присвоение свойствам текущего объекта определённых данных
        this.#id = id;
        this.#name = readName.data;
        this.#ip = readIP.data;
        this.#location = readLocation.data;
    }

    /**
     * Чтение текущей структуры данных из файла
     * @param {*} fd Дескриптор файла
     * @param {number} position Текущее смещение файла
     * @param {*} filepath Путь до файла
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

            this.#id = readId.buffer.readUint32BE();
            this.#name = readName.data;
            this.#ip = readIP.data;
            this.#location = readLocation.data;

            return position;
        } catch (e) {
            console.log("Ошибка: ", e);
        }

        return null;
    }

    get id() {
        return this.#id;
    }

    get ip() {
        return this.#ip;
    }

    get name() {
        return this.#name;
    }

    get location() {
        return this.#location;
    }

    print() {
        console.log();
        console.log("---------------------");
        console.log("ID: ", this.#id);
        console.log("Name: ", this.#name);
        console.log("IP: ", this.#ip);
        console.log("Location: ", this.#location);
        console.log("---------------------");
    }
};