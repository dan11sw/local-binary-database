import fs from "fs";
import path from "path";

import ServerModel from "./models/ServerModel.js";
import ListModel from "./models/ListModel.js";

// Определяем рабочую директорию процесса
const WorkingDirectory = process.cwd();
// Определяем расположение папки для хранения базы данных
const DataBaseDirectory = path.join(WorkingDirectory, "db");

try {
    const filepath = path.join(DataBaseDirectory, "data.bin");
    const filepathIndex = path.join(DataBaseDirectory, "data_index.bin");

    const model1 = new ServerModel("server-1", "127.0.1.20", "Irkutsk");
    const model2 = new ServerModel("server-2", "192.0.81.122", "Moscow City", 5000);
    const model3 = new ServerModel("server-3", "120.85.23.44", "Vladivostok", 3000);

    const list = new ListModel();
    list.push(model1);
    list.push(model2);
    list.push(model3);

    list.writeToFile(filepath, filepathIndex);

    const list2 = new ListModel();
    list2.loadFromFile(filepath);

    for(const item of list2) {
        item.print();
    }

} catch (err) {
    console.error('Ошибка:', err);
}

