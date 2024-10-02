const config = require('./tiendas.json');
const {cargarDatos, guardarDatos} = require('./gesDatos');
const { handleError } = require ('./gesErrores');

//El script se va a ejecutar con el nombre de la tienda como argumento, así qué:
const tienda = process.argv[2];

if (!config.tiendas[tienda]) {
    console.error('Tienda no encontrada.');
    process.exit(1);
}

//Cargamos el script de scraping de la tienda
const scraper = require (`scrapingScripts/${tienda}_scraper`);

//Cargamos los datos existentes
let datosGuardados = cargarDatos(tienda);

//Ejecutamos el scraper de la tienda
scraper.scrapear(config.tiendas[tienda].url_catalogo, datosGuardados).then (nuevosDatos => {
    //guardamos datos nuevos
    guardarDatos(tienda, nuevosDatos);
    console.log(`Datos guardados para ${tienda}`);
}).catch(error => {
    handleError(error);
});