import fs, { readv } from "fs";

import { isUndefinedOrNull } from "../utils/objector.js";
import { writeBytesToFile } from "../utils/write-bytes.js";
import ServerIndexModel from "./ServerIndexModel.js";
import ServerModel from "./ServerModel.js";
import { readBytesFromFile } from "../utils/read-bytes.js";

export default class ListModel {
    #version; // uint8  - Версия формата (как интерпретировать записи)
    #size;    // uint32 - Количество записей
    #items;   // bytes  - Записи

    constructor(version) {
        this.#version = version ?? 1;
        this.#size = 0;
        this.#items = [];
    }

    /**
     * Добавление нового элемента
     * @param {*} item Элемент для записи 
     */
    push(item) {
        // Добавляем только те элементы, у которых есть функция packageMsg и идентификатор записи (id)
        if (isUndefinedOrNull(item.packageMsg) || (typeof item.packageMsg !== "function")) {
            return false;
        } else if (isUndefinedOrNull(item.id) || (typeof item.id !== "number")) {
            return false;
        }

        this.#items.push(item);
        this.#size = this.#items.length;

        return true;
    }

    /**
     * Удаление записи из списка по идентификатору
     * @param {number} id Идентификатор записи
     * @returns {boolean} Результат удаления записи из списка
     */
    remove(id) {
        if (typeof id !== "number") {
            return false;
        }

        const index = this.#items.findIndex((value) => {
            return value.id == id;
        });

        if (index >= 0) {
            this.#items.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * Чтение данных из бинарного файла
     * @param {string} filepath Путь до файла
     * @returns {number | null} Смещение в бинарном файле
     */
    loadFromFile(filepath = "") {
        if ((typeof filepath !== "string" || filepath.length === 0) ||
            !fs.existsSync(filepath)) {
            return null;
        }

        try {
            const fd = fs.openSync(filepath, "r");
            let position = 0;

            // Чтение версии
            const readVersion = readBytesFromFile(fd, position, Uint8Array.BYTES_PER_ELEMENT, filepath);
            if (isUndefinedOrNull(readVersion)) {
                return null;
            }

            position = readVersion.new_position;
            this.#version = readVersion.buffer.readUint8(0);

            // Чтение количества записей
            const readSize = readBytesFromFile(fd, position, Uint32Array.BYTES_PER_ELEMENT, filepath);
            if (isUndefinedOrNull(readSize)) {
                return null;
            }

            position = readSize.new_position;
            this.#size = readSize.buffer.readUint32BE(0);

            // Чтение элементов
            for(let i = 0; i < this.#size; i++) {
                const item = new ServerModel();

                const new_position = item.loadFromFile(fd, position, filepath);
                if(isUndefinedOrNull(new_position)) {
                    return null;
                }

                position = new_position;
                this.items.push(item);
            }

            return position;
        } catch (e) {
            console.log("Ошибка: ", e);
        }

        return null;
    }

    /**
     * Запись данных о серверах в файл (+ формирование индексного файла)
     * @param {string} filepath Путь к файлу
     * @param {string} filepath_index Путь к файлу с индексами
     * @returns {boolean} Результат записи в файл
     */
    writeToFile(filepath = "", filepath_index = "") {
        if ((typeof filepath !== "string" || filepath.length === 0) ||
            typeof filepath_index !== "string" || filepath_index.length === 0) {
            return false;
        }

        const fd = fs.openSync(filepath, "w");

        // Выделяем память под версию
        let buffer = Buffer.alloc(Uint8Array.BYTES_PER_ELEMENT);
        // Записываем версию
        buffer.writeUint8(this.#version, 0);

        let position = 0;
        position = writeBytesToFile(fd, buffer, position, filepath);
        if (isUndefinedOrNull(position)) {
            return false;
        }

        // Выделяем память под количество записей
        buffer = Buffer.alloc(Uint32Array.BYTES_PER_ELEMENT);
        buffer.writeUint32BE(this.#size, 0);

        position = writeBytesToFile(fd, buffer, position, filepath);
        if (isUndefinedOrNull(position)) {
            return false;
        }

        // Если данных нет, то просто завершаем запись в файл
        if (this.#items.length === 0) {
            return true;
        }

        // Индексы для быстрого доступа к записям (определённое смещение по файлу filepath)
        const indexes = new ListModel(this.#version);
        for (const item of this.#items) {
            const old_position = position;
            position = writeBytesToFile(fd, item.packageMsg(), position, filepath);
            if (isUndefinedOrNull(position)) {
                return false;
            }

            // Добавляем индексный элемент (идентификатор записи + позиция в файле данных, по которой запись была добавлена)
            if (!indexes.push(new ServerIndexModel(item.id, old_position))) {
                break;
            }
        }

        if (indexes.size !== this.#items.length) {
            return false;
        }

        // Запись индексов в индексный файл "как есть"
        const fdIndex = fs.openSync(filepath_index, "w");
        if (!writeBytesToFile(fdIndex, indexes.packageMsg(), 0, filepath_index)) {
            return false;
        }

        return true;
    }

    packageMsg() {
        // Выделяем память под версию
        let bufferVersion = Buffer.alloc(Uint8Array.BYTES_PER_ELEMENT);
        // Записываем версию
        bufferVersion.writeUint8(this.#version, 0);

        // Выделяем память под количество элементов
        let bufferSize = Buffer.alloc(Uint32Array.BYTES_PER_ELEMENT);
        bufferSize.writeUint32BE(this.#size, 0);

        // Объединяем независимые буферы в один с помощью статического метода Buffer.concat
        let buffer = Buffer.concat([bufferVersion, bufferSize]);

        // Добавляем в общий буфер информацию о всех записях
        for (const item of this.#items) {
            buffer = Buffer.concat([buffer, item.packageMsg()]);
        }

        return buffer;
    }

    get items() {
        return this.#items;
    }

    get size() {
        return this.#size;
    }

    get version() {
        return this.#version;
    }

    // Реализация итератора
    [Symbol.iterator]() {
        let index = 0;
        const items = this.#items;

        return {
            next() {
                if (index < items.length) {
                    return {
                        value: items[index++],
                        done: false
                    };
                } else {
                    return {
                        done: true
                    };
                }
            }
        };
    }
}