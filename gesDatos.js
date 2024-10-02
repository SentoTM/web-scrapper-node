const fs = require('fs');
const path = require('path');

function cargarDatos(tienda) {
    const filePath = path.join(__dirname, `${tienda}_data.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath));
    }
    return[];
}

function guardarDatos(tienda, nuevosDatos) {
    const filePath = path.join(__dirname, `${tienda}_data.json`);
    let datosExistentes = cargarDatos(tienda);
    let datosFinales = [...datosExistentes, ...nuevosDatos];
    fs. writeFileSync(filePath, JSON.stringify(datosFinales, null, 2));
}

module.exports = {cargarDatos, guardarDatos};