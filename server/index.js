import fs from "fs";
import path from "path";

import ServerModel from "./models/ServerModel.js";
import ServerListModel from "./models/ServerListModel.js";
import { writeBytesToFile } from "./utils/write-bytes.js";

// Определяем рабочую директорию процесса
const WorkingDirectory = process.cwd();
// Определяем расположение папки для хранения базы данных
const DataBaseDirectory = path.join(WorkingDirectory, "db");

const model1 = new ServerModel(1, "server-1", "127.0.1.20", "Irkutsk");
const model2 = new ServerModel(2, "server-2", "192.0.81.122", "Moscow City");

try {
    const filepath = path.join(DataBaseDirectory, "data.bin");
    const filepathList = path.join(DataBaseDirectory, "data_list.bin");
    
} catch (err) {
    console.error('Ошибка:', err);
}

