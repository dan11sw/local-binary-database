import fs from "fs";
import path from "path";

import ServerModel from "./models/ServerModel.js";
import ServerListModel from "./models/ServerListModel.js";
import { writeBytesToFile } from "./utils/write-bytes.js";

const WorkingDirectory = process.cwd();
const DataBaseDirectory = path.join(WorkingDirectory, "db");

const model1 = new ServerModel(1, "server-1", "127.0.1.20", "Irkutsk");
const model2 = new ServerModel(2, "server-2", "192.0.81.122", "Moscow City");

try {
    const filepath = path.join(DataBaseDirectory, "data.bin");
    const filepathList = path.join(DataBaseDirectory, "data_list.bin");
    const fd = fs.openSync(filepath, "r");
    
    const model3 = new ServerModel();
    model3.print();

    console.log("Offset: ", model3.loadFromFile(fd, 0, filepath));
    model3.print();

    const serverList = new ServerListModel();
    serverList.push(model1);
    serverList.push(model2);
    serverList.push(model3);

    const listBuffer = serverList.packageMsg();

    const fd2 = fs.openSync(filepathList, "w");
    const pos = writeBytesToFile(fd2, listBuffer, 0, filepathList);
    if(pos !== listBuffer.length) {
        console.log(`Ошибка: записано ${pos} байтов из ${listBuffer}`);
    } else {
        console.log(`Успешная запись`);
    }
    // fs.writeFileSync(fd, model1.packageMsg());

    fs.closeSync(fd);
} catch (err) {
    console.error('Ошибка:', err);
}

