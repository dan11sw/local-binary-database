
/*export function readStringFromBytes(dataView, offset) {
    if (typeof offset !== "number") {
        return "";
    }

    if (!(dataView instanceof DataView)) {
        return "";
    }

    const length = dataView.getUint16(offset);
    offset += Uint16Array.BYTES_PER_ELEMENT;

    let result = "";
    for (let i = 0; i < length; i++) {
        result += String.fromCharCode(dataView.getUint8(offset + i));
    }

    return {
        data: result,
        new_offset: offset + length
    };
}*/

