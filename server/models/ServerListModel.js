import ServerModel from "./ServerModel";


export default class ServerListModel {
    #version; // uint8
    #size;    // uint32
    #items;   // bytes

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

    remove(id) {
        if (typeof id !== "number") {
            return false;
        }

        const index = this.#items.findIndex((value) => {
            return value.id == id;
        });

        if(index >= 0) {
            this.#items.splice(index, 1);
        }

        return true;
    }

    packageMsg() {
        // Выделяем память под версию
        let bufferVersion = Buffer.alloc(Uint8Array.BYTES_PER_ELEMENT);
        let offset = 0;

        // Записываем версию
        offset = bufferVersion.writeUint8(this.#version, 0);

        // Выделяем память под количество элементов
        let bufferSize = Buffer.alloc(Uint16Array.BYTES_PER_ELEMENT);
        // Записываем количество элементов в буфер;
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