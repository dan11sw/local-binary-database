import fs from "fs";
import path from "path";

import ServerModel from "./models/ServerModel.js";

const WorkingDirectory = process.cwd();
const DataBaseDirectory = path.join(WorkingDirectory, "db");

const model1 = new ServerModel(1, "server-1", "127.0.1.20", "Irkutsk");
model1.loadFromMsg(model1.packageMsg());

const model2 = new ServerModel();
model2.loadFromMsg(model1.packageMsg());

try {
    const filepath = path.join(DataBaseDirectory, "data.bin");
    const fd = fs.openSync(path.join(DataBaseDirectory, "data.bin"), "r");
    
    const model3 = new ServerModel();
    model3.print();

    console.log("Offset: ", model3.loadFromFile(fd, 0, filepath));
    model3.print();

    // fs.writeFileSync(fd, model1.packageMsg());

    fs.closeSync(fd);
} catch (err) {
    console.error('Ошибка:', err);
}

