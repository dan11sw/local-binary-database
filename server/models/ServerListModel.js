import { isUndefinedOrNull } from "../utils/objector.js";
import { writeBytesToFile } from "../utils/write-bytes.js";
import ServerIndexModel from "./ServerIndexModel.js";
import ServerModel from "./ServerModel.js";

export default class ServerListModel {
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
     * @param {ServerModel} item 
     */
    push(item) {
        if (!(item instanceof ServerModel)) {
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
     * Запись данных о серверах в файл (+ формирование индексного файла)
     * @param {number} fd Дескриптор открытого файла
     * @param {string} filepath Путь к файлу
     * @param {string} filepath_index Путь к файлу с индексами
     * @returns {boolean} Результат записи в файл
     */
    writeToFile(fd, filepath = "", filepath_index) {
        if (typeof fd !== "number") {
            return false;
        }

        // Выделяем память под версию
        let buffer = Buffer.alloc(Uint8Array.BYTES_PER_ELEMENT);
        // Записываем версию
        buffer.writeUint8(this.#version, 0);

        let position = 0;
        let new_position = writeBytesToFile(fd, buffer, position, filepath);
        if (isUndefinedOrNull(new_position)) {
            return false;
        }

        position += new_position;

        // Выделяем память под количество записей
        buffer = Buffer.alloc(Uint32Array.BYTES_PER_ELEMENT);
        buffer.writeUint32BE(this.#size, 0);

        new_position = writeBytesToFile(fd, buffer, position, filepath);
        if (isUndefinedOrNull(new_position)) {
            return false;
        }

        position += new_position;

        // Если данных нет, то просто завершаем запись в файл
        if (this.#items.length === 0) {
            return true;
        }

        // Индексы для быстрого доступа к записям (определённое смещение по файлу filepath)
        const indexes = [];
        for (const item of this.#items) {
            new_position = writeBytesToFile(fd, item.packageMsg(), position, filepath);
            if (isUndefinedOrNull(new_position)) {
                return false;
            }

            // Добавляем индексный элемент (идентификатор записи + позиция в файле данных, по которой запись была добавлена)
            indexes.push(new ServerIndexModel(item.id, position));
            position += new_position;
        }

        if(indexes.length === 0) {
            return false;
        }
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
}