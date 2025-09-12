
// Объект, характеризующий все возможные состояния модели данных "Сервер"
const Status = {
    STOPPED: 0,
    RUNNING: 1,
    BUSY: 2
};

// Замораживаем свойства объекта (от несанкционированного изменения)
Object.freeze(Status);

export default Status;
